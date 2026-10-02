import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Chitral Valley Delight',
  },
  description: {
    type: String,
    default: 'Authentic dining in Chitral Valley',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Traditional Chitrali',
      'Fast Food & Pizzeria',
      'Hotel & Fine Dining',
      'BBQ & Karahi',
      'Fast Food & Cafe',
      'Continental & Traditional',
      'Fast Food & Traditional',
      'Traditional & Fast Food',
      'Cafe'
    ],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
  },
  locality: {
    type: String,
    required: true,
    default: 'Chitral Town',
  },
  location: {
    lat: { type: Number, required: true, default: 35.8510 },
    lng: { type: Number, required: true, default: 71.7864 },
  },
  bannerImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  logoImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
  },
  rating: {
    type: Number,
    default: 4.8,
  },
  reviewCount: {
    type: Number,
    default: 142,
  },
  deliveryTimeMin: {
    type: Number,
    default: 25,
  },
  deliveryTimeMax: {
    type: Number,
    default: 45,
  },
  deliveryFee: {
    type: Number,
    default: 120, // in PKR
  },
  minimumOrder: {
    type: Number,
    default: 400,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  openingHours: {
    open: { type: String, default: '10:00 AM' },
    close: { type: String, default: '11:00 PM' },
  },
  cuisineTags: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
