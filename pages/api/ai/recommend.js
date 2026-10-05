/**
 * /pages/api/ai/recommend.js
 *
 * Cart recommendation endpoint — now powered by Gemini AI.
 * Calls generateCartRecommendationsAI() which uses Gemini first,
 * then gracefully falls back to the rule-based engine if unavailable.
 */

import connectDB from '../../../lib/db.js';
import MenuItem from '../../../models/MenuItem.js';
import { generateCartRecommendationsAI } from '../../../lib/aiRecommendation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { cartItems = [], restaurantId } = req.body;

    if (!restaurantId || cartItems.length === 0) {
      return res.status(200).json({ success: true, recommendations: [] });
    }

    const availableMenuItems = await MenuItem.find({
      restaurantId,
      isAvailable: true,
    }).lean();

    // Use Gemini AI recommendations with rule-based fallback
    const recommendations = await generateCartRecommendationsAI(cartItems, availableMenuItems);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
      aiPowered: !!process.env.GEMINI_API_KEY,
    });
  } catch (error) {
    console.error('[Recommend] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
