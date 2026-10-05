/**
 * /pages/api/ai/qfh-gpt.js
 *
 * QFH GPT — the conversational AI assistant for Qashqar Food Hub.
 *
 * Architecture:
 *   1. Fetch live menu & restaurant data from MongoDB (grounding context).
 *   2. Build a system prompt that contains that real data so the LLM can only
 *      reference dishes/prices that actually exist in the database.
 *   3. Call Groq's OpenAI-compatible chat-completions endpoint with the
 *      llama-3.3-70b-versatile model.
 *   4. Return the LLM's reply in the same JSON shape the widget already expects
 *      { success, answer, dishes, restaurants, quickActions, supportPhone }.
 *   5. Fall back to a friendly error message if Groq is unreachable/key missing.
 *
 * No API key is hardcoded — always read from process.env.GROQ_API_KEY.
 */

import connectDB from '../../../lib/db.js';
import MenuItem from '../../../models/MenuItem.js';
import Restaurant from '../../../models/Restaurant.js';

const OFFICIAL_PHONE = '03426522787';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 10_000; // 10-second guard so the widget never hangs

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a compact, token-efficient summary of live menu data to inject into
 * the system prompt. We deliberately keep each line short so we don't blow
 * the context window on large menus.
 */
function buildMenuContext(menuItems, restaurants) {
  // Restaurants summary
  const restLines = restaurants
    .slice(0, 20) // cap at 20 to save tokens
    .map(
      (r) =>
        `• ${r.name} (${r.locality || 'Chitral'}) — min order Rs.${r.minimumOrder || 200}, delivery fee Rs.${r.deliveryFee || 120}, open: ${r.isOpen ? 'YES' : 'NO'}`
    )
    .join('\n');

  // Menu items summary — group by restaurant for readability
  const dishLines = menuItems
    .slice(0, 60) // cap at 60 to save tokens
    .map(
      (item) =>
        `  - ${item.name} | Rs.${item.price} | ${item.category || 'General'} | at: ${item.restaurantId?.name || 'Unknown'} (${item.restaurantId?.locality || 'Chitral'})`
    )
    .join('\n');

  return `LIVE RESTAURANTS (${restaurants.length} active):\n${restLines || 'None found.'}\n\nLIVE MENU ITEMS (${menuItems.length} available):\n${dishLines || 'None found.'}`;
}

/**
 * Attempt to extract dish-name matches from the user query to surface as
 * inline product cards alongside the LLM's text reply. This re-uses the
 * existing keyword-matching logic so the widget's dish card UI still works.
 */
function findRelevantDishes(menuItems, query) {
  const q = query.toLowerCase();
  const scored = menuItems
    .map((item) => {
      let score = 0;
      if (item.name.toLowerCase().includes(q)) score += 10;
      if (item.description?.toLowerCase().includes(q)) score += 4;
      if (item.category?.toLowerCase().includes(q)) score += 3;
      if (item.tags?.some((t) => t.toLowerCase().includes(q))) score += 2;

      // Budget queries: surface cheap options
      const priceMatch = q.match(/under\s*(\d+)|below\s*(\d+)|rs\.?\s*(\d+)/);
      if (priceMatch) {
        const limit = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3], 10);
        if (item.price <= limit) score += 5;
      }
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ item }) => item);

  return scored;
}

/** Format a matched dish into the card shape QfhGptWidget.js expects */
function formatDish(item) {
  return {
    _id: item._id,
    name: item.name,
    price: item.price,
    category: item.category,
    description: item.description,
    image: item.image,
    tags: item.tags,
    restaurant: {
      _id: item.restaurantId?._id,
      name: item.restaurantId?.name || 'Qashqar Eatery',
      locality: item.restaurantId?.locality || 'Chitral Town',
      deliveryFee: item.restaurantId?.deliveryFee || 120,
    },
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { message = '', history = [] } = req.body;
    const query = message.trim();

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: 'Message query is required' });
    }

    // ── 1. Fetch live grounding data (same queries the old rule-based code used)
    const [restaurants, menuItems] = await Promise.all([
      Restaurant.find({ isActive: true }).lean(),
      MenuItem.find({ isAvailable: true })
        .populate('restaurantId', 'name locality slug deliveryFee minimumOrder isOpen')
        .lean(),
    ]);

    // ── 2. Find relevant dish cards to show alongside the text reply
    const matchedDishes = findRelevantDishes(menuItems, query);

    // ── 3. Build grounded system prompt with real DB data injected
    const menuContext = buildMenuContext(menuItems, restaurants);

    const systemPrompt = `You are QFH GPT — the friendly, knowledgeable AI assistant for Qashqar Food Hub (QFH), a food-delivery platform serving Chitral Valley (Qashqar), Pakistan.

PERSONALITY:
- Warm, concise, and conversational — never robotic or essay-length.
- Proud of Chitrali culture: mention local specialties like Mantou, River Trout, Ghalmandi, Shinwari Karahi lovingly when relevant.
- Always helpful; if unsure, suggest calling the support hotline: ${OFFICIAL_PHONE}.

RULES — VERY IMPORTANT:
1. Answer ONLY using the live data provided in the CONTEXT section below.
2. Do NOT invent dish names, prices, restaurants, or delivery areas that are not in the context.
3. When quoting prices, always say "Rs. X" (Pakistani Rupees).
4. Keep replies under ~120 words unless a list genuinely needs more space.
5. Payment methods accepted: Cash on Delivery (COD), Easypaisa, JazzCash.
6. Delivery areas: Chitral Town and surrounding Qashqar valley localities.
7. Scheduled pre-orders are supported — customers can book up to 2 days in advance.
8. Support hotline / rider dispatch: ${OFFICIAL_PHONE} (call or WhatsApp).

CONTEXT (live database snapshot — do not reference anything outside this):
${menuContext}`;

    // ── 4. Build message array for Groq (include up to last 4 turns for context)
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      // Prior conversation history (already in {role, text} shape from widget)
      ...history.slice(-4).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: query },
    ];

    // ── 5. Call Groq API with a hard timeout so the widget never hangs
    let aiReply = null;

    const groqApiKey = process.env.GROQ_API_KEY;

    if (groqApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const groqResponse = await fetch(GROQ_API_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: chatMessages,
            temperature: 0.4, // low temp → factual, grounded replies
            max_tokens: 300,  // keep chat-widget responses concise
          }),
        });

        clearTimeout(timeoutId);

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          aiReply = groqData.choices?.[0]?.message?.content?.trim() || null;
        } else {
          // Log the error server-side but don't crash
          const errText = await groqResponse.text();
          console.error(`[QFH GPT] Groq API error ${groqResponse.status}:`, errText);
        }
      } catch (groqErr) {
        // Network error, timeout, or abort — log and fall through to fallback
        console.error('[QFH GPT] Groq request failed:', groqErr.message);
      }
    } else {
      console.warn('[QFH GPT] GROQ_API_KEY not set — using rule-based fallback.');
    }

    // ── 6. Fallback: if LLM call failed or key is missing, produce a
    //       friendly rule-based response so the widget never returns empty
    if (!aiReply) {
      aiReply = buildFallbackReply(query, menuItems, restaurants);
    }

    // ── 7. Return in the exact shape QfhGptWidget.js expects
    return res.status(200).json({
      success: true,
      answer: aiReply,
      dishes: matchedDishes.map(formatDish),
      restaurants: [], // restaurant cards not used by current widget UI
      quickActions: [],
      supportPhone: OFFICIAL_PHONE,
    });

  } catch (error) {
    console.error('[QFH GPT] Unhandled error:', error);
    // Endpoint must never crash with a 500 — return a safe fallback
    return res.status(200).json({
      success: false,
      answer: `I'm having a little trouble connecting right now. For instant support, please call or WhatsApp our rider desk at **${OFFICIAL_PHONE}** — we're ready to help!`,
      dishes: [],
      restaurants: [],
      quickActions: [
        { label: `Call ${OFFICIAL_PHONE}`, action: `tel:${OFFICIAL_PHONE}` },
        { label: 'Chat on WhatsApp', action: `https://wa.me/923426522787` },
      ],
      supportPhone: OFFICIAL_PHONE,
    });
  }
}

// ─── Rule-based fallback (preserved from original, used when LLM unavailable) ─

function buildFallbackReply(query, menuItems, restaurants) {
  const q = query.toLowerCase();

  if (q.includes('phone') || q.includes('contact') || q.includes('rider') || q.includes('whatsapp') || q.includes('help') || q.includes('support')) {
    return `📞 **QFH Helpline & Rider Dispatch:** Call or WhatsApp us anytime at **${OFFICIAL_PHONE}** — our Chitral team is ready for order dispatches, directions, and support.`;
  }
  if (q.includes('payment') || q.includes('pay') || q.includes('easypaisa') || q.includes('jazzcash') || q.includes('cod')) {
    return `💳 **Payment Options:** Cash on Delivery (COD), Easypaisa, and JazzCash are all accepted. Call **${OFFICIAL_PHONE}** for any payment queries.`;
  }
  if (q.includes('qashqar') || q.includes('what is')) {
    return `🏔️ **Qashqar** (قاشقار) is the ancient cultural name of Chitral Valley — home of Mantou, River Trout, Ghalmandi, and Shinwari Karahi. What would you like to taste today?`;
  }
  if (q.includes('under') || q.includes('cheap') || q.includes('budget')) {
    const priceMatch = q.match(/\d+/);
    const limit = priceMatch ? parseInt(priceMatch[0], 10) : 800;
    const count = menuItems.filter((i) => i.price <= limit).length;
    return `💰 We have **${count} dishes** available under Rs. ${limit}! Browse above for the full list.`;
  }
  return `👋 I'm **QFH GPT**, your Qashqar dining guide! Ask me about Mantou, River Trout, Shinwari Karahi, price ranges, or connect with our rider hotline at **${OFFICIAL_PHONE}**. What can I help you with?`;
}
