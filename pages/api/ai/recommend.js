/**
 * /pages/api/ai/recommend.js
 *
 * Cart & Post-Order recommendation endpoint — powered by Gemini AI.
 * Grounded in the specific restaurant's menu, items, and the customer's order price.
 */

import connectDB from '../../../lib/db.js';
import MenuItem from '../../../models/MenuItem.js';
import Restaurant from '../../../models/Restaurant.js';
import { generateCartRecommendationsAI } from '../../../lib/aiRecommendation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { cartItems = [], restaurantId, orderTotal = null } = req.body;

    if (!restaurantId || cartItems.length === 0) {
      return res.status(200).json({ success: true, recommendations: [] });
    }

    // Fetch restaurant name & details for accurate AI grounding
    const [restaurant, availableMenuItems] = await Promise.all([
      Restaurant.findById(restaurantId).select('name locality category').lean(),
      MenuItem.find({
        restaurantId,
        isAvailable: true,
      }).lean(),
    ]);

    const restaurantName = restaurant?.name || 'Local Kitchen';

    // Use Gemini AI recommendations with price & restaurant awareness
    const recommendations = await generateCartRecommendationsAI(cartItems, availableMenuItems, {
      restaurantName,
      orderTotal,
    });

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      restaurant: {
        _id: restaurantId,
        name: restaurantName,
      },
      recommendations,
      aiPowered: !!process.env.GEMINI_API_KEY,
    });
  } catch (error) {
    console.error('[Recommend] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
