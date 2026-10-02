import connectDB from '../../../lib/db.js';
import Order from '../../../models/Order.js';
import Driver from '../../../models/Driver.js';
import { broadcastOrderEvent } from '../../../lib/socket.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await connectDB();

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
    }

    let order = await Order.findOne(query)
      .populate('restaurantId')
      .populate('assignedDriverId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, order });
    }

    if (req.method === 'PUT') {
      const { status, prepTimeMinutes, note, assignedDriverId } = req.body;

      if (status && status !== order.status) {
        order.status = status;
        order.timeline.push({
          status,
          timestamp: new Date(),
          note: note || `Order transitioned to ${status.replace(/_/g, ' ')}`,
        });

        // If delivered or cancelled, release driver
        if (['delivered', 'cancelled'].includes(status) && order.assignedDriverId) {
          await Driver.findByIdAndUpdate(order.assignedDriverId, {
            status: 'available',
            activeOrderId: null,
            $inc: { totalDeliveries: status === 'delivered' ? 1 : 0 },
          });
        }
      }

      if (prepTimeMinutes !== undefined) {
        order.prepTimeMinutes = Number(prepTimeMinutes);
        const estDelivery = new Date();
        estDelivery.setMinutes(estDelivery.getMinutes() + Number(prepTimeMinutes) + 15);
        order.estimatedDeliveryTime = estDelivery;
      }

      if (assignedDriverId) {
        order.assignedDriverId = assignedDriverId;
      }

      await order.save();

      const updatedOrder = await Order.findById(order._id)
        .populate('restaurantId')
        .populate('assignedDriverId');

      // Real-time broadcast
      broadcastOrderEvent('order:status_update', updatedOrder);

      return res.status(200).json({
        success: true,
        message: `Order status updated to ${order.status}`,
        order: updatedOrder,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Order update error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
