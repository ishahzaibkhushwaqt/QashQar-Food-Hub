import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '' },
});

const OrderTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
});

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
  },
  customerPhone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  customerAddress: {
    locality: {
      type: String,
      required: true,
      default: 'Ataliq Bazaar, Chitral Town',
    },
    streetAddress: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, default: 35.8510 },
      lng: { type: Number, default: 71.7864 },
    },
    notes: { type: String, default: '' },
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 120,
  },
  tax: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Easypaisa', 'JazzCash'],
    default: 'COD',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed',
  },
  assignedDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null,
  },
  prepTimeMinutes: {
    type: Number,
    default: 25,
  },
  estimatedDeliveryTime: {
    type: Date,
  },
  isScheduled: {
    type: Boolean,
    default: false,
  },
  scheduledDate: {
    type: String,
    default: null,
  },
  scheduledTimeSlot: {
    type: String,
    default: null,
  },
  scheduledTargetTime: {
    type: Date,
    default: null,
  },
  timeline: [OrderTimelineSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
