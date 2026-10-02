import connectDB from '../../../lib/db.js';
import Driver from '../../../models/Driver.js';
import { broadcastOrderEvent } from '../../../lib/socket.js';

export default async function handler(req, res) {
  try {
    await connectDB();

    // GET: Query driver live GPS location
    if (req.method === 'GET') {
      const { driverId } = req.query;
      if (!driverId) {
        return res.status(400).json({ success: false, message: 'driverId is required' });
      }

      const driver = await Driver.findById(driverId).select('name phone vehicleType vehiclePlate currentLocation rating status');
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      return res.status(200).json({ success: true, driver });
    }

    // PUT: Update driver live GPS location and broadcast via Socket
    if (req.method === 'PUT') {
      const { driverId, lat, lng, localityName, speedKmH } = req.body;

      if (!driverId || lat === undefined || lng === undefined) {
        return res.status(400).json({ success: false, message: 'driverId, lat, and lng are required' });
      }

      const updated = await Driver.findByIdAndUpdate(
        driverId,
        {
          'currentLocation.lat': Number(lat),
          'currentLocation.lng': Number(lng),
          ...(localityName ? { 'currentLocation.localityName': localityName } : {}),
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      // Broadcast real-time driver movement to order tracking pages
      broadcastOrderEvent('driver:location_update', {
        driverId: updated._id,
        lat: Number(lat),
        lng: Number(lng),
        localityName: updated.currentLocation?.localityName,
        speedKmH: speedKmH || 28,
        timestamp: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: 'Driver location updated successfully',
        driver: updated,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Driver location API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
