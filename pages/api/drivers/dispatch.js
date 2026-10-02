import connectDB from '../../../lib/db.js';
import Driver from '../../../models/Driver.js';
import Order from '../../../models/Order.js';
import Restaurant from '../../../models/Restaurant.js';
import { dispatchNearestDriver } from '../../../lib/aiDispatch.js';
import { broadcastOrderEvent } from '../../../lib/socket.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { orderId, driverId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId).populate('restaurantId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const restaurant = order.restaurantId;
    const restaurantLoc = restaurant?.location || { lat: 35.8510, lng: 71.7864 };

    // If driverId was manually passed (e.g. driver accepts from order pool)
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      order.assignedDriverId = driver._id;
      order.status = 'out_for_delivery';
      order.timeline.push({
        status: 'out_for_delivery',
        timestamp: new Date(),
        note: `Assigned to rider ${driver.name} (${driver.vehiclePlate})`,
      });
      await order.save();

      driver.status = 'busy';
      driver.activeOrderId = order._id;
      await driver.save();

      // Real-time broadcast
      broadcastOrderEvent('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'out_for_delivery',
        assignedDriver: {
          name: driver.name,
          phone: driver.phone,
          vehiclePlate: driver.vehiclePlate,
          vehicleType: driver.vehicleType,
        },
        restaurantId: restaurant._id,
      });

      return res.status(200).json({
        success: true,
        message: `Rider ${driver.name} accepted order`,
        order,
        driver,
      });
    }

    // Otherwise run AI nearest-driver dispatch
    const allDrivers = await Driver.find({});
    const dispatchResult = dispatchNearestDriver(allDrivers, restaurantLoc);

    if (!dispatchResult.selectedDriver) {
      return res.status(400).json({
        success: false,
        message: 'No available drivers nearby in Chitral Valley right now.',
      });
    }

    const matchedDriver = dispatchResult.selectedDriver;
    order.assignedDriverId = matchedDriver._id;
    order.status = 'out_for_delivery';
    order.timeline.push({
      status: 'out_for_delivery',
      timestamp: new Date(),
      note: `AI Dispatched to nearest rider: ${matchedDriver.name} (${dispatchResult.selectedMetrics?.distanceKm} km away in ${dispatchResult.selectedMetrics?.locality})`,
    });
    await order.save();

    await Driver.findByIdAndUpdate(matchedDriver._id, {
      status: 'busy',
      activeOrderId: order._id,
    });

    // Real-time broadcast
    broadcastOrderEvent('order:status_update', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'out_for_delivery',
      assignedDriver: {
        name: matchedDriver.name,
        phone: matchedDriver.phone,
        vehiclePlate: matchedDriver.vehiclePlate,
        vehicleType: matchedDriver.vehicleType,
      },
      restaurantId: restaurant._id,
      metrics: dispatchResult.selectedMetrics,
    });

    return res.status(200).json({
      success: true,
      order,
      driver: matchedDriver,
      dispatchMetrics: dispatchResult.selectedMetrics,
      rankedCandidates: dispatchResult.rankedCandidates,
    });
  } catch (error) {
    console.error('Dispatch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
