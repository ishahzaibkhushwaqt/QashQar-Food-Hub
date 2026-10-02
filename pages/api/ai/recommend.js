import connectDB from '../../../lib/db.js';
import MenuItem from '../../../models/MenuItem.js';
import { generateCartRecommendations } from '../../../lib/aiRecommendation.js';

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
    });

    const recommendations = generateCartRecommendations(cartItems, availableMenuItems);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
