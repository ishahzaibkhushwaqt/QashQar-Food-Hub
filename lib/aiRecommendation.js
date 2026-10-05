/**
 * /lib/aiRecommendation.js
 *
 * QFH AI Cart & Post-Order Recommendation Engine
 * Powered by Google Gemini (gemini-3.8-flash with instant gemini-3.5-flash-lite failover).
 *
 * Strategy:
 *   - Grounded strictly in the specific restaurant's menu and the customer's price tier.
 *   - Suggests complementary items (appetizers, drinks, sides, desserts) that pair with
 *     what the customer ordered without exceeding their budget.
 *   - Automatic 503 high-demand failover and IPv4 first DNS order.
 *   - Fallback to intelligent rule-based engine if Gemini is unreachable.
 */

import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Ask Gemini to recommend up to 3 complementary dishes given the current cart or placed order.
 * Returns: [{ item, score, badge, reasoning }]
 */
export async function generateCartRecommendationsAI(
  cartItems, 
  availableMenuItems, 
  options = {}
) {
  if (!cartItems?.length || !availableMenuItems?.length) return [];

  const { restaurantName = 'this restaurant', orderTotal = null } = options;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // ── PRIMARY: Gemini AI recommendations
  if (geminiApiKey) {
    try {
      const genai = new GoogleGenAI({ apiKey: geminiApiKey });

      // Calculate total price if not passed
      const calculatedTotal = orderTotal !== null 
        ? orderTotal 
        : cartItems.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

      // Summarise cart / placed order items
      const cartSummary = cartItems
        .map((i) => `${i.name} (Rs. ${i.price}${i.quantity > 1 ? ` x${i.quantity}` : ''}, Category: ${i.category || 'Food'})`)
        .join(', ');

      // Filter available menu items strictly to this restaurant and not already in the cart
      const cartIds = new Set(
        cartItems.map((i) => (i._id?.toString() || i.menuItemId?.toString() || i.id?.toString()))
      );

      const candidateItems = availableMenuItems.filter(
        (i) => i._id && !cartIds.has(i._id.toString()) && i.isAvailable !== false
      );

      if (candidateItems.length === 0) {
        return [];
      }

      // Limit candidates to 35 items for token efficiency
      const menuSummary = candidateItems
        .slice(0, 35)
        .map((i) => `ID:${i._id} | ${i.name} | Rs. ${i.price} | Category: ${i.category || 'General'}`)
        .join('\n');

      const prompt = `You are the culinary AI recommendation engine for Qashqar Food Hub (QFH), serving Chitral Valley, Pakistan.

CUSTOMER ORDER DETAILS:
- Restaurant: "${restaurantName}"
- Ordered Dishes: ${cartSummary}
- Order Price Subtotal: Rs. ${calculatedTotal}

AVAILABLE MENU FROM "${restaurantName}":
${menuSummary}

TASK:
Recommend exactly 3 complementary items from the available menu above that best complement the customer's order and fit their price profile:
1. Price Awareness: Suggest items that match the meal's budget (e.g. affordable drinks like Qawa/tea Rs. 80-200, sides/naan Rs. 60-180, salads/chutneys, or appropriate desserts).
2. Chitral Culinary Pairing: Pair rich meat dishes (Mantou, Shinwari Karahi, River Trout) with digestive green tea, naan, or fresh salad. Pair fast food (Burgers, Pizza) with cold beverages or loaded sides.
3. Strict Grounding: ONLY use items from the provided available menu list. NEVER invent items or prices.
4. Provide a punchy badge (e.g. "Perfect Pairing", "Best with Trout", "Budget Add-on", "Digestive Side").
5. Provide a short, persuasive reasoning in 1 sentence.

Respond with ONLY a valid JSON array of up to 3 objects:
[
  { "id": "EXACT_ITEM_ID", "badge": "Badge Label", "score": 0.95, "reasoning": "Why this pairs perfectly with their order" }
]`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), REQUEST_TIMEOUT_MS)
      );

      // Call Gemini with failover
      const callGemini = async (modelToUse) => {
        return genai.models.generateContent({
          model: modelToUse,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.3,
            maxOutputTokens: 350,
          },
        });
      };

      let result;
      try {
        result = await Promise.race([callGemini(GEMINI_MODEL), timeoutPromise]);
      } catch (geminiErr) {
        if (
          geminiErr.message?.includes('503') ||
          geminiErr.message?.includes('high demand') ||
          geminiErr.message?.includes('UNAVAILABLE')
        ) {
          console.warn(`[AI Rec] 503 on ${GEMINI_MODEL}, switching to gemini-3.5-flash-lite failover...`);
          result = await Promise.race([callGemini('gemini-3.5-flash-lite'), timeoutPromise]);
        } else {
          throw geminiErr;
        }
      }

      const rawText = result?.text?.trim() || result?.response?.text()?.trim() || '[]';

      // Extract JSON array
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Gemini returned non-JSON response');
      const aiRecs = JSON.parse(jsonMatch[0]);

      // Map Gemini's IDs back to actual candidate objects
      const candidateMap = new Map(
        candidateItems.map((i) => [i._id.toString(), i])
      );

      const recommendations = aiRecs
        .filter((rec) => rec.id && candidateMap.has(rec.id.toString()))
        .map((rec) => ({
          item: candidateMap.get(rec.id.toString()),
          score: Math.min(Math.max(Number(rec.score) || 0.85, 0.7), 0.99),
          badge: rec.badge || 'AI Pick',
          reasoning: rec.reasoning,
        }));

      if (recommendations.length > 0) {
        return recommendations.slice(0, 3);
      }
    } catch (err) {
      console.warn('[AI Recommendation] Gemini error, using rule-based fallback:', err.message);
    }
  }

  // ── FALLBACK: Price-aware rule-based pairing engine
  return generateCartRecommendations(cartItems, availableMenuItems);
}

// ─── Rule-based pairing engine (enhanced with price awareness) ─────────────────
export function generateCartRecommendations(cartItems, availableMenuItems) {
  if (!cartItems?.length || !availableMenuItems?.length) return [];

  const recommendations = [];
  const cartItemIds = new Set(
    cartItems.map((item) => (item._id?.toString() || item.menuItemId?.toString() || item.id?.toString()))
  );

  const available = availableMenuItems.filter(
    (item) => item._id && !cartItemIds.has(item._id.toString()) && item.isAvailable !== false
  );

  if (available.length === 0) return [];

  // Determine cart price and meal category
  const orderSubtotal = cartItems.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0
  );

  const cartText = cartItems.map((i) => `${i.name} ${i.category || ''}`).join(' ').toLowerCase();

  const isMeatOrKarahi = cartText.includes('karahi') || cartText.includes('trout') || cartText.includes('mantou') || cartText.includes('tikka') || cartText.includes('meat');
  const isFastFood = cartText.includes('burger') || cartText.includes('pizza') || cartText.includes('sandwich') || cartText.includes('fries');

  // Find complementary drinks / tea
  const beverages = available.filter(
    (i) =>
      i.category?.toLowerCase().includes('beverage') ||
      i.category?.toLowerCase().includes('tea') ||
      i.category?.toLowerCase().includes('drink') ||
      i.complementaryCategory === 'digestive_tea' ||
      i.complementaryCategory === 'cold_beverage'
  );

  // Find sides / breads
  const sides = available.filter(
    (i) =>
      i.category?.toLowerCase().includes('side') ||
      i.category?.toLowerCase().includes('naan') ||
      i.category?.toLowerCase().includes('salad') ||
      i.complementaryCategory === 'bread_naan' ||
      i.complementaryCategory === 'chutney_salad' ||
      i.complementaryCategory === 'fries_sides'
  );

  // Find desserts
  const desserts = available.filter(
    (i) =>
      i.category?.toLowerCase().includes('dessert') ||
      i.category?.toLowerCase().includes('sweet') ||
      i.complementaryCategory === 'dessert'
  );

  if (isMeatOrKarahi) {
    if (beverages.length > 0) {
      recommendations.push({
        item: beverages[0],
        score: 0.94,
        badge: 'Traditional Digestive',
        reasoning: `Pairs perfectly with your hearty meal to aid digestion.`,
      });
    }
    if (sides.length > 0) {
      recommendations.push({
        item: sides[0],
        score: 0.91,
        badge: 'Essential Side',
        reasoning: `Freshly prepared side to complete your traditional Chitral dining experience.`,
      });
    }
  } else if (isFastFood) {
    if (beverages.length > 0) {
      recommendations.push({
        item: beverages[0],
        score: 0.95,
        badge: 'Chilled Drink Pairing',
        reasoning: `Cold beverage to enjoy alongside your meal.`,
      });
    }
    if (sides.length > 0) {
      recommendations.push({
        item: sides[0],
        score: 0.89,
        badge: 'Crispy Side',
        reasoning: `Freshly fried side to complement your order.`,
      });
    }
  }

  // If still need more, pick best price-matched item (under 30% of order total)
  if (recommendations.length < 3) {
    const targetPrice = Math.max(150, Math.round(orderSubtotal * 0.35));
    const budgetMatches = available
      .filter((i) => !recommendations.some((r) => r.item._id?.toString() === i._id?.toString()))
      .sort((a, b) => Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice));

    if (budgetMatches.length > 0) {
      recommendations.push({
        item: budgetMatches[0],
        score: 0.85,
        badge: 'Budget Add-on',
        reasoning: `Popular item (Rs. ${budgetMatches[0].price}) that matches your order budget.`,
      });
    }
  }

  // Final fallback to any available items
  while (recommendations.length < 3 && available.length > recommendations.length) {
    const nextItem = available.find(
      (a) => !recommendations.some((r) => r.item._id?.toString() === a._id?.toString())
    );
    if (!nextItem) break;
    recommendations.push({
      item: nextItem,
      score: 0.80,
      badge: 'Chef Recommendation',
      reasoning: `Popular specialty from ${nextItem.category || 'this kitchen'}.`,
    });
  }

  return recommendations.slice(0, 3);
}
