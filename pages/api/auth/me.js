import connectDB from '../../../lib/db.js';
import User from '../../../models/User.js';
import { getAuthUser } from '../../../lib/auth.js';

export default async function handler(req, res) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectDB();
    const user = await User.findById(auth.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
