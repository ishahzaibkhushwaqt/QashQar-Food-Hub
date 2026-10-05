/**
 * /lib/aiRecommendation.js
 *
 * QFH AI Cart Recommendation Engine
 * Powered by Google Gemini (gemini-3.8-flash via @google/genai SDK).
 *
 * Strategy:
 *   - PRIMARY: Call Gemini with the cart contents + available menu as context.
 *     Gemini returns up to 3 dish recommendations as structured JSON with reasoning.
 *   - FALLBACK: If Gemini is unavailable (no key, network error, timeout),
 *     the original keyword/rule-based pairing logic runs silently.
 *
 * This module exports TWO functions:
 *   generateCartRecommendations(cartItems, availableMenuItems)
 *     — synchronous rule-based (used internally as fallback, and by code that
 *       hasn't migrated to the async version yet).
 *   generateCartRecommendationsAI(cartItems, availableMenuItems)
 *     — async, calls Gemini first then falls back to the rule-based engine.
 *
 * The /api/ai/recommend.js route calls generateCartRecommendationsAI.
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-3.8-flash';
const REQUEST_TIMEOUT_MS = 8_000;

// ─── Gemini-powered recommendation ───────────────────────────────────────────

/**
 * Ask Gemini to recommend up to 3 complementary dishes given the current cart.
 * Returns the same array shape as the rule-based engine:
 * [{ item, score, badge, reasoning }]
 */
export async function generateCartRecommendationsAI(cartItems, availableMenuItems) {
  if (!cartItems?.length || !availableMenuItems?.length) return [];

  const geminiApiKey = process.env.GEMINI_API_KEY;

  // ── PRIMARY: Gemini AI recommendations
  if (geminiApiKey) {
    try {
      const genai = new GoogleGenAI({ apiKey: geminiApiKey });

      // Summarise cart for the prompt
      const cartSummary = cartItems
        .map((i) => `${i.name} (Rs.${i.price}, ${i.category || 'Food'})`)
        .join(', ');

      // Limit menu to 40 items for token efficiency
      const menuSummary = availableMenuItems
        .slice(0, 40)
        .map((i) => `ID:${i._id} | ${i.name} | Rs.${i.price} | ${i.category || 'General'}`)
        .join('\n');

      // Build the already-in-cart ID set so Gemini doesn't recommend duplicates
      const cartIds = new Set(
        cartItems.map((i) => (i._id?.toString() || i.menuItemId?.toString() || i.id))
      );

      const prompt = `You are a culinary AI expert for Qashqar Food Hub — a food-delivery platform in Chitral Valley, Pakistan.

A customer's cart currently contains:
${cartSummary}

Available menu items from this restaurant (ID | Name | Price | Category):
${menuSummary}

Recommend exactly 3 complementary dishes from the available menu that would pair best with the cart items. Consider Chitrali culinary culture: pair rich meats (Karahi, Mantou, Trout) with Qawa tea or chutney; pair fast food (Burgers, Pizza) with fries or cold drinks.

Rules:
- Only recommend items that appear in the available menu list above.
- Do not recommend items already in the cart.
- Give a short, specific pairing reason (max 15 words) for each.
- Assign a confidence score between 0.70 and 0.99.

Respond with ONLY a JSON array of exactly 3 objects (no extra text):
[
  { "id": "MENU_ITEM_ID", "badge": "Short Badge Label", "score": 0.95, "reasoning": "Why this pairs well" },
  { "id": "MENU_ITEM_ID", "badge": "Short Badge Label", "score": 0.90, "reasoning": "Why this pairs well" },
  { "id": "MENU_ITEM_ID", "badge": "Short Badge Label", "score": 0.85, "reasoning": "Why this pairs well" }
]`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), REQUEST_TIMEOUT_MS)
      );

      const geminiPromise = genai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // low temp for consistent structured output
          maxOutputTokens: 250,
          candidateCount: 1,
        },
      });

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const rawText = result?.response?.text()?.trim() || '[]';

      // Extract JSON (strip markdown code fences if present)
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Gemini returned non-JSON response');
      const aiRecs = JSON.parse(jsonMatch[0]);

      // Map Gemini's IDs back to actual menu item objects
      const menuMap = new Map(
        availableMenuItems.map((i) => [i._id?.toString(), i])
      );

      const recommendations = aiRecs
        .filter((rec) => rec.id && menuMap.has(rec.id) && !cartIds.has(rec.id))
        .map((rec) => ({
          item: menuMap.get(rec.id),
          score: Math.min(Math.max(Number(rec.score) || 0.8, 0.7), 0.99),
          badge: rec.badge || 'AI Pick',
          reasoning: `🤖 Gemini AI: ${rec.reasoning}`,
        }));

      if (recommendations.length > 0) {
        return recommendations.slice(0, 3);
      }
      // If Gemini returned empty or bad IDs, fall through to rule-based
    } catch (err) {
      console.error('[AI Recommendation] Gemini error:', err.message);
      // Fall through to rule-based fallback
    }
  } else {
    console.warn('[AI Recommendation] GEMINI_API_KEY not set — using rule-based fallback.');
  }

  // ── FALLBACK: original rule-based pairing engine
  return generateCartRecommendations(cartItems, availableMenuItems);
}

// ─── Original rule-based engine (preserved as fallback) ───────────────────────
/**
 * Synchronous rule-based cart pairing engine.
 * Tailored for Chitral culinary culture:
 * - Pairs rich meats (Mantou, Karahi, Tikka, Trout) with digestive Qawa, chutney, naan.
 * - Pairs fast-food (Burgers, Pizza) with loaded sides, dips, and iced beverages.
 *
 * Used as the automatic fallback when GEMINI_API_KEY is absent or Gemini fails.
 */
export function generateCartRecommendations(cartItems, availableMenuItems) {
  if (!cartItems?.length || !availableMenuItems?.length) return [];

  const recommendations = [];
  const cartItemIds = new Set(
    cartItems.map((item) => item._id?.toString() || item.menuItemId?.toString() || item.id)
  );

  let hasHeavyMeat = false;
  let hasTraditionalDish = false;
  let hasFastFood = false;
  let hasTeaOrBeverage = false;
  let hasBread = false;
  let hasSaladOrChutney = false;
  let hasFries = false;

  const meatKeywords = ['karahi', 'mantou', 'trout', 'fish', 'tikka', 'kebab', 'mutton', 'beef', 'shinwari', 'handi', 'biryani'];
  const fastFoodKeywords = ['burger', 'pizza', 'shawarma', 'sandwich', 'wings'];
  const drinkKeywords = ['tea', 'qawa', 'coffee', 'beverage', 'drink', 'chai'];
  const breadKeywords = ['naan', 'roti', 'bread', 'ghalmandi'];
  const saladKeywords = ['salad', 'chutney', 'raita'];
  const fryKeywords = ['fries', 'potato'];

  for (const item of cartItems) {
    const name = (item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    if (meatKeywords.some((kw) => name.includes(kw) || category.includes(kw))) hasHeavyMeat = true;
    if (['mantou', 'karahi', 'ghalmandi', 'shinwari', 'trout'].some((kw) => name.includes(kw))) hasTraditionalDish = true;
    if (fastFoodKeywords.some((kw) => name.includes(kw) || category.includes(kw))) hasFastFood = true;
    if (drinkKeywords.some((kw) => name.includes(kw) || category.includes(kw))) hasTeaOrBeverage = true;
    if (breadKeywords.some((kw) => name.includes(kw) || category.includes(kw))) hasBread = true;
    if (saladKeywords.some((kw) => name.includes(kw) || category.includes(kw))) hasSaladOrChutney = true;
    if (fryKeywords.some((kw) => name.includes(kw) || category.includes(kw))) hasFries = true;
  }

  const candidates = availableMenuItems.filter((item) => {
    const id = item._id?.toString() || item.id;
    return !cartItemIds.has(id) && item.isAvailable !== false;
  });

  for (const candidate of candidates) {
    const cName = candidate.name.toLowerCase();
    const cCat = (candidate.category || '').toLowerCase();
    const cComp = candidate.complementaryCategory || '';

    if (hasHeavyMeat && !hasTeaOrBeverage && (cComp === 'digestive_tea' || cName.includes('qawa') || cName.includes('green tea') || cName.includes('tea'))) {
      recommendations.push({ item: candidate, score: 0.96, badge: 'Recommended Digestif', reasoning: 'Rich meat dishes traditionally pair with hot Chitrali Qawa or Green Tea for digestion at high altitude.' });
      continue;
    }
    if (hasHeavyMeat && !hasSaladOrChutney && (cComp === 'chutney_salad' || cName.includes('chutney') || cName.includes('salad') || cName.includes('raita'))) {
      recommendations.push({ item: candidate, score: 0.93, badge: 'Palate Cleanser', reasoning: 'Crisp mint chutney cuts through the rich spices of Karahi and Kebab.' });
      continue;
    }
    if ((hasHeavyMeat || hasTraditionalDish) && !hasBread && (cComp === 'bread_naan' || cName.includes('naan') || cName.includes('roti') || cName.includes('ghalmandi'))) {
      recommendations.push({ item: candidate, score: 0.91, badge: 'Essential Side', reasoning: 'Tandoori Naan or local walnut Ghalmandi is the quintessential accompaniment to gravies.' });
      continue;
    }
    if (hasFastFood && !hasFries && (cComp === 'fries_sides' || cName.includes('fries') || cName.includes('wings') || cName.includes('cheese'))) {
      recommendations.push({ item: candidate, score: 0.92, badge: 'Crispy Side', reasoning: 'Customers ordering burgers frequently add seasoned loaded fries.' });
      continue;
    }
    if (hasFastFood && !hasTeaOrBeverage && (cComp === 'cold_beverage' || cName.includes('coffee') || cName.includes('shake') || cName.includes('coke') || cName.includes('drink'))) {
      recommendations.push({ item: candidate, score: 0.88, badge: 'Chilled Drink', reasoning: 'Chilled beverages enhance the savoriness of crispy fast food.' });
      continue;
    }
    if (candidate.tags && (candidate.tags.includes('Popular') || candidate.tags.includes('Local Special'))) {
      recommendations.push({
        item: candidate,
        score: 0.75,
        badge: candidate.tags.includes('Local Special') ? 'Chitral Special' : 'Popular Dish',
        reasoning: `"${candidate.name}" is one of the highest-rated favorites from this kitchen.`,
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, 3);
}
