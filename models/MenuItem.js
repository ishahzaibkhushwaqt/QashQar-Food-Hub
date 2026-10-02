import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Dish name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price in PKR is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  tags: [{
    type: String,
  }],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  complementaryCategory: {
    type: String,
    enum: ['digestive_tea', 'chutney_salad', 'bread_naan', 'fries_sides', 'cold_beverage', 'dessert', 'none'],
    default: 'none',
  },
  prepTimeMinutes: {
    type: Number,
    default: 20,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
