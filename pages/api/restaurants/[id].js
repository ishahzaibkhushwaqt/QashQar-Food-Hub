import connectDB from '../../../lib/db.js';
import Restaurant from '../../../models/Restaurant.js';
import MenuItem from '../../../models/MenuItem.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await connectDB();

    let restaurant;
    if (mongoose.Types.ObjectId.isValid(id)) {
      restaurant = await Restaurant.findById(id);
    } else {
      restaurant = await Restaurant.findOne({ slug: id });
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (req.method === 'GET') {
      const menuItems = await MenuItem.find({ restaurantId: restaurant._id }).sort({ category: 1, name: 1 });

      // Group menu items by category
      const categoriesMap = {};
      menuItems.forEach((item) => {
        if (!categoriesMap[item.category]) {
          categoriesMap[item.category] = [];
        }
        categoriesMap[item.category].push(item);
      });

      return res.status(200).json({
        success: true,
        restaurant,
        menuItems,
        categorizedMenu: categoriesMap,
      });
    }

    if (req.method === 'PUT') {
      const updated = await Restaurant.findByIdAndUpdate(restaurant._id, req.body, { new: true });
      return res.status(200).json({ success: true, restaurant: updated });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Restaurant fetch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
