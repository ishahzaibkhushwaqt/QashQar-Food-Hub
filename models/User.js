import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'driver', 'admin'],
    default: 'customer',
  },
  phone: {
    type: String,
    default: '+92 345 1234567',
  },
  address: {
    locality: { type: String, default: 'Ataliq Bazaar, Chitral Town' },
    detail: { type: String, default: 'House 14, Near Shahi Masjid Road' },
    coordinates: {
      lat: { type: Number, default: 35.8510 },
      lng: { type: Number, default: 71.7864 },
    }
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
