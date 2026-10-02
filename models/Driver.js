import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    default: '03426522787',
  },
  vehicleType: {
    type: String,
    enum: ['Motorcycle (Rider)', 'Honda CD70', 'Yamaha YBR', 'Suzuki Mehran (Car)', 'Electric Bike'],
    default: 'Motorcycle (Rider)',
  },
  vehiclePlate: {
    type: String,
    default: 'CH-2024-884',
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available',
  },
  currentLocation: {
    lat: { type: Number, required: true, default: 35.8520 },
    lng: { type: Number, required: true, default: 71.7850 },
    localityName: { type: String, default: 'Ataliq Bazaar' },
  },
  rating: {
    type: Number,
    default: 4.9,
  },
  totalDeliveries: {
    type: Number,
    default: 84,
  },
  activeOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
