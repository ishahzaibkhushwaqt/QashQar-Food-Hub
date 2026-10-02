import connectDB from '../../../../lib/db.js';
import MenuItem from '../../../../models/MenuItem.js';
import Restaurant from '../../../../models/Restaurant.js';
import { requireRestaurantAccess } from '../../../../lib/auth.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await connectDB();

    let restaurantId = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const rest = await Restaurant.findOne({ slug: id });
      if (!rest) return res.status(404).json({ message: 'Restaurant not found' });
      restaurantId = rest._id;
    }

    // GET: List all items (public — anyone browsing the site can see the menu)
    if (req.method === 'GET') {
      const items = await MenuItem.find({ restaurantId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: items.length, items });
    }

    // Everything below this line changes data, so only the restaurant's
    // own owner (or an admin) may proceed.
    const access = requireRestaurantAccess(req, restaurantId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    // POST: Create menu item
    if (req.method === 'POST') {
      const { name, description, price, category, tags, image, complementaryCategory, prepTimeMinutes } = req.body;

      if (!name || price === undefined || !category) {
        return res.status(400).json({ message: 'Name, price, and category are required' });
      }

      const newItem = await MenuItem.create({
        restaurantId,
        name,
        description: description || '',
        price: parseFloat(price),
        category,
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : ['Popular']),
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        complementaryCategory: complementaryCategory || 'none',
        prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : 20,
        isAvailable: true,
      });

      return res.status(201).json({ success: true, item: newItem });
    }

    // PUT: Update menu item or inventory stock toggle
    if (req.method === 'PUT') {
      const { itemId, ...updateFields } = req.body;

      if (!itemId) {
        return res.status(400).json({ message: 'itemId is required to update' });
      }

      const updated = await MenuItem.findOneAndUpdate(
        { _id: itemId, restaurantId },
        updateFields,
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ message: 'Menu item not found for this restaurant' });
      }

      return res.status(200).json({ success: true, item: updated });
    }

    // DELETE: Delete menu item
    if (req.method === 'DELETE') {
      const { itemId } = req.body || req.query;

      if (!itemId) {
        return res.status(400).json({ message: 'itemId is required' });
      }

      const deleted = await MenuItem.findOneAndDelete({ _id: itemId, restaurantId });
      if (!deleted) {
        return res.status(404).json({ message: 'Menu item not found for this restaurant' });
      }
      return res.status(200).json({ success: true, message: 'Item deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Menu API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
