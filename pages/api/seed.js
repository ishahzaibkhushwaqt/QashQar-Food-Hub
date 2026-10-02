import connectDB from '../../lib/db.js';
import { seedDatabase } from '../../scripts/seed.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    await seedDatabase();
    return res.status(200).json({ success: true, message: 'Chitral Food Hub database seeded successfully!' });
  } catch (error) {
    console.error('API Seed Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
