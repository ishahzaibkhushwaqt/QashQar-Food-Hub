/**
 * /pages/api/ai/qfh-gpt.js
 *
 * Real Google Gemini LLM Integration for QFH GPT (Qashqar Food Hub).
 * Uses Google Gemini API via @google/genai SDK with gemini-3.8-flash.
 *
 * Requirements:
 * 1. Real Gemini LLM — no if/else fake canned responses.
 * 2. GEMINI_API_KEY server-side environment variable.
 * 3. Never expose API key in frontend code.
 * 4. Pass user message to Gemini.
 * 5. Fetch actual restaurant and menu data from MongoDB and ground Gemini.
 * 6. Generate genuine food recommendations and conversational answers.
 * 7. Support conversation history and follow-up questions.
 * 8. Strict anti-hallucination instruction — no invented dishes, prices, or restaurants.
 * 9. Compatible with existing QfhGptWidget frontend.
 * 10. Proper error handling.
 */

import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import { GoogleGenAI } from '@google/genai';
import connectDB from '../../../lib/db.js';
import MenuItem from '../../../models/MenuItem.js';
import Restaurant from '../../../models/Restaurant.js';

const OFFICIAL_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '03426522787';

// Keyword scoring used ONLY to prioritize relevant dishes for the context and product carousel
function scoreAndFilterDishes(menuItems, query) {
  if (!query) return menuItems.slice(0, 30);
  const q = query.toLowerCase();

  const scored = menuItems.map((item) => {
    let score = 1; // baseline
    const name = item.name?.toLowerCase() || '';
    const desc = item.description?.toLowerCase() || '';
    const cat = item.category?.toLowerCase() || '';

    if (name.includes(q)) score += 15;
    if (desc.includes(q)) score += 6;
    if (cat.includes(q)) score += 5;
    item.tags?.forEach((t) => {
      if (t.toLowerCase().includes(q)) score += 3;
    });

    const priceMatch = q.match(/under\s*(\d+)|below\s*(\d+)|rs\.?\s*(\d+)/);
    if (priceMatch) {
      const limit = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3], 10);
      if (!isNaN(limit) && item.price <= limit) score += 8;
    }

    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((s) => s.item);
}

function formatDishCard(item) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const userQuery = (req.body.message || req.body.query || '').trim();
  const history = Array.isArray(req.body.history) ? req.body.history : [];
  const restaurantId = req.body.restaurantId;

  if (!userQuery) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    return res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
      answer:
        '⚠️ Gemini AI is not connected yet. Please add a valid GEMINI_API_KEY to .env.local on the server.',
      reply:
        '⚠️ Gemini AI is not connected yet. Please add a valid GEMINI_API_KEY to .env.local on the server.',
      dishes: [],
      restaurants: [],
      quickActions: [],
      supportPhone: OFFICIAL_PHONE,
    });
  }

  try {
    await connectDB();

    // 1. Fetch live grounding data from MongoDB
    const restFilter = restaurantId ? { _id: restaurantId, isActive: true } : { isActive: true };
    const [restaurants, allMenuItems] = await Promise.all([
      Restaurant.find(restFilter).limit(20).lean(),
      MenuItem.find({ isAvailable: true })
        .populate('restaurantId', 'name locality slug deliveryFee minimumOrder isOpen')
        .lean(),
    ]);

    // Filter relevant dishes for LLM grounding context & carousel
    const relevantDishes = scoreAndFilterDishes(allMenuItems, userQuery);

    // Build compact grounding strings
    const restaurantContext = restaurants
      .map(
        (r) =>
          `• ${r.name} (${r.locality || 'Chitral'}) | Delivery Fee: Rs. ${r.deliveryFee || 120} | Status: ${
            r.isOpen ? 'Open' : 'Closed'
          }`
      )
      .join('\n');

    const menuContext = relevantDishes
      .map(
        (dish) =>
          `• ${dish.name} | Rs. ${dish.price} | Category: ${dish.category || 'General'} | Restaurant: ${
            dish.restaurantId?.name || 'Local Kitchen'
          } (${dish.restaurantId?.locality || 'Chitral'})` +
          (dish.description ? ` | Note: ${dish.description}` : '')
      )
      .join('\n');

    // 2. Strict grounding system instruction
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const systemInstruction = `You are QFH GPT, the friendly, helpful AI food guide for QashQar Food Hub (QFH), the premier food ordering and delivery network in Chitral Valley, Pakistan.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. ONLY recommend and discuss restaurants, dishes, and prices that are listed in the REAL DATABASE CONTEXT below.
2. DO NOT invent, hallucinate, or assume any dish, price, ingredient, or restaurant that is not present in the context.
3. If the user asks for something not in the database, clearly inform them that it is currently not available on QFH and suggest available alternatives from the provided menu list.
4. Quote all prices accurately in Pakistani Rupees using "Rs. X".
5. Chitral cultural context: Speak warmly and respectfully. Chitrali local favorites include Mantou, River Trout, Ghalmandi, Shinwari Karahi, etc.
6. Available Payment Methods: Cash on Delivery (COD), Easypaisa, JazzCash.
7. Delivery details: We deliver across Chitral Town and nearby valley localities. Scheduled pre-orders are supported up to 2 days in advance.
8. Rider/Customer support phone: ${OFFICIAL_PHONE}.
9. Keep answers conversational, helpful, and concise (typically 2-4 sentences or a neat bulleted list). Do not write long essays.

=== REAL DATABASE CONTEXT ===
AVAILABLE RESTAURANTS:
${restaurantContext || 'No active restaurants found.'}

AVAILABLE MENU ITEMS:
${menuContext || 'No available menu items found.'}
============================`;

    // 3. Prepare multi-turn conversation contents
    const contents = [];

    // Include last 4 turns from conversation history
    for (const h of history.slice(-4)) {
      const text = (h.text || h.content || '').trim();
      if (!text) continue;
      const role = h.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text }],
      });
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    // 4. Initialize GoogleGenAI client and call the real LLM
    const ai = new GoogleGenAI({ apiKey });

    let response;
    let usedModel = modelName;

    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      });
    } catch (primaryErr) {
      // If primary model encounters high demand (Google 503), immediately failover to high-throughput gemini-3.5-flash-lite
      if (
        primaryErr.message?.includes('503') ||
        primaryErr.message?.includes('high demand') ||
        primaryErr.message?.includes('UNAVAILABLE')
      ) {
        console.warn(`[QFH GPT] ${modelName} 503 spike, switching to gemini-3.5-flash-lite failover...`);
        usedModel = 'gemini-3.5-flash-lite';
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
            maxOutputTokens: 600,
          },
        });
      } else {
        throw primaryErr;
      }
    }

    const aiText = response.text?.trim();

    if (!aiText) {
      throw new Error('Gemini returned an empty response.');
    }

    // Return the response matching the frontend widget shape
    return res.status(200).json({
      success: true,
      model: modelName,
      answer: aiText,
      reply: aiText,
      dishes: relevantDishes.slice(0, 6).map(formatDishCard),
      restaurants: [],
      quickActions: [],
      supportPhone: OFFICIAL_PHONE,
    });
  } catch (error) {
    console.error('[QFH GPT - Gemini Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gemini API call failed',
      answer: `⚠️ AI Error: ${error.message || 'Unable to connect to Gemini API'}. Please verify your GEMINI_API_KEY and network connection.`,
      reply: `⚠️ AI Error: ${error.message || 'Unable to connect to Gemini API'}. Please verify your GEMINI_API_KEY and network connection.`,
      dishes: [],
      restaurants: [],
      quickActions: [],
      supportPhone: OFFICIAL_PHONE,
    });
  }
}
