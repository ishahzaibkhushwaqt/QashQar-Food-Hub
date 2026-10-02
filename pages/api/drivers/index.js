import connectDB from '../../../lib/db.js';
import Driver from '../../../models/Driver.js';

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const { status } = req.query;
      const query = {};
      if (status) query.status = status;

      const drivers = await Driver.find(query).sort({ rating: -1 });
      return res.status(200).json({ success: true, count: drivers.length, drivers });
    }

    if (req.method === 'POST') {
      const { name, phone, vehicleType, vehiclePlate, lat, lng, localityName } = req.body;
      const driver = await Driver.create({
        name,
        phone,
        vehicleType,
        vehiclePlate,
        currentLocation: {
          lat: parseFloat(lat) || 35.8520,
          lng: parseFloat(lng) || 71.7850,
          localityName: localityName || 'Ataliq Bazaar',
        },
      });
      return res.status(201).json({ success: true, driver });
    }

    if (req.method === 'PUT') {
      const { driverId, status, lat, lng, localityName } = req.body;
      const updateData = {};
      if (status) updateData.status = status;
      if (lat && lng) {
        updateData.currentLocation = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          localityName: localityName || 'Chitral Valley',
        };
      }

      const updatedDriver = await Driver.findByIdAndUpdate(driverId, updateData, { new: true });
      return res.status(200).json({ success: true, driver: updatedDriver });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Drivers API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
