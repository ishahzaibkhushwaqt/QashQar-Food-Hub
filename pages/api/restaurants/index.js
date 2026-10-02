import connectDB from '../../../lib/db.js';
import Restaurant from '../../../models/Restaurant.js';
import { seedDatabase } from '../../../scripts/seed.js';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const count = await Restaurant.countDocuments();
    if (count === 0) {
      console.log('⚡ No restaurants detected in database. Auto-seeding Chitral dataset...');
      await seedDatabase();
    }

    if (req.method === 'GET') {
      const { category, search, locality, sort } = req.query;

      const query = { isActive: true };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (locality && locality !== 'All') {
        query.locality = new RegExp(locality, 'i');
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { cuisineTags: { $in: [new RegExp(search, 'i')] } },
          { category: new RegExp(search, 'i') },
        ];
      }

      let sortOptions = { rating: -1 };
      if (sort === 'delivery_time') {
        sortOptions = { deliveryTimeMin: 1 };
      } else if (sort === 'delivery_fee') {
        sortOptions = { deliveryFee: 1 };
      } else if (sort === 'rating') {
        sortOptions = { rating: -1 };
      }

      const restaurants = await Restaurant.find(query).sort(sortOptions);

      return res.status(200).json({
        success: true,
        count: restaurants.length,
        restaurants,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Restaurant list error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
