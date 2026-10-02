import connectDB from '../../../lib/db.js';
import User from '../../../models/User.js';
import Restaurant from '../../../models/Restaurant.js';
import { signToken } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { role = 'customer' } = req.body;

    let user = await User.findOne({ role });

    // If restaurant owner, ensure restaurantId is set
    if (role === 'restaurant_owner') {
      const rest = await Restaurant.findOne({ slug: 'mountain-inn-restaurant' }) || await Restaurant.findOne();
      if (rest && user) {
        user.restaurantId = rest._id;
        await user.save();
      }
    }

    if (!user) {
      // Fallback find any or create
      user = await User.findOne() || {
        _id: '65f000000000000000000001',
        name: 'Demo ' + role,
        email: `${role}@chitralfoodhub.com`,
        role,
      };
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId || null,
        phone: user.phone || '+92 345 1234567',
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Demo Switch error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
