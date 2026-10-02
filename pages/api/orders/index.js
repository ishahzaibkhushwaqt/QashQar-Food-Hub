import connectDB from '../../../lib/db.js';
import Order from '../../../models/Order.js';
import Restaurant from '../../../models/Restaurant.js';
import { broadcastOrderEvent } from '../../../lib/socket.js';
import { getAuthUser } from '../../../lib/auth.js';

export default async function handler(req, res) {
  try {
    await connectDB();

    // GET: List orders
    if (req.method === 'GET') {
      const { restaurantId, customerId, status, limit = 50 } = req.query;
      const query = {};

      if (restaurantId) query.restaurantId = restaurantId;
      if (customerId) query.customerId = customerId;
      if (status) {
        if (status.includes(',')) {
          query.status = { $in: status.split(',') };
        } else {
          query.status = status;
        }
      }

      const orders = await Order.find(query)
        .populate('restaurantId')
        .populate('assignedDriverId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10));

      return res.status(200).json({ success: true, count: orders.length, orders });
    }

    // POST: Create new order
    if (req.method === 'POST') {
      const {
        restaurantId,
        customerName,
        customerPhone,
        customerAddress,
        items,
        subtotal,
        deliveryFee,
        paymentMethod = 'COD',
        isScheduled = false,
        scheduledDate = null,
        scheduledTimeSlot = null,
        scheduledTargetTime = null,
      } = req.body;

      if (!restaurantId || !customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required order fields (restaurant, items, customer info, address)',
        });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      // Generate unique human-readable order number
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const orderNumber = `QFH-${randomDigits}`;

      const finalSubtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
      const finalDeliveryFee = deliveryFee !== undefined ? Number(deliveryFee) : restaurant.deliveryFee;
      const tax = Math.round(finalSubtotal * 0.05); // 5% local hospitality tax
      const totalAmount = finalSubtotal + finalDeliveryFee + tax;

      // Extract customer ID if token is provided
      const auth = getAuthUser(req);
      const customerId = auth ? auth.id : null;

      const newOrder = await Order.create({
        orderNumber,
        customerId,
        customerName,
        customerPhone,
        customerAddress: {
          locality: customerAddress.locality || restaurant.locality || 'Chitral Town',
          streetAddress: customerAddress.streetAddress || 'Main Road',
          coordinates: customerAddress.coordinates || { lat: 35.8510, lng: 71.7864 },
          notes: customerAddress.notes || '',
        },
        restaurantId: restaurant._id,
        items: items.map(item => ({
          menuItemId: item._id || item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || '',
        })),
        subtotal: finalSubtotal,
        deliveryFee: finalDeliveryFee,
        tax,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'pending' : 'paid',
        status: 'placed',
        prepTimeMinutes: 25,
        isScheduled: Boolean(isScheduled),
        scheduledDate: scheduledDate || null,
        scheduledTimeSlot: scheduledTimeSlot || null,
        scheduledTargetTime: scheduledTargetTime ? new Date(scheduledTargetTime) : null,
        timeline: [
          {
            status: 'placed',
            timestamp: new Date(),
            note: isScheduled
              ? `Scheduled pre-order placed for ${scheduledDate || 'upcoming date'} (${scheduledTimeSlot || 'selected slot'})`
              : 'Order successfully placed by customer',
          },
        ],
      });

      // Populate restaurant for socket broadcast
      const populatedOrder = await Order.findById(newOrder._id).populate('restaurantId');

      // Real-time broadcast to KDS & Global listeners
      broadcastOrderEvent('order:created', populatedOrder);

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: populatedOrder,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Order API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
