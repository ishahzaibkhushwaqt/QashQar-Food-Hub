import connectDB from '../../../lib/db.js';
import Restaurant from '../../../models/Restaurant.js';
import MenuItem from '../../../models/MenuItem.js';
import User from '../../../models/User.js';
import { hashPassword, signToken, getAuthUser } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const {
      name,
      tagline,
      description,
      category,
      address,
      locality,
      lat,
      lng,
      bannerImage,
      logoImage,
      deliveryTimeMin = 25,
      deliveryTimeMax = 40,
      deliveryFee = 120,
      minimumOrder = 400,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
      initialDishes = [],
    } = req.body;

    if (!name || !category || !address || !locality) {
      return res.status(400).json({
        success: false,
        message: 'Name, Category, Address, and Locality are required',
      });
    }

    // Generate unique slug
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Restaurant.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create or find Owner
    let owner;
    const auth = getAuthUser(req);
    if (auth) {
      owner = await User.findById(auth.id);
    } else if (ownerEmail) {
      owner = await User.findOne({ email: ownerEmail.toLowerCase() });
      if (!owner) {
        const hashedPassword = await hashPassword(ownerPassword || 'pass1234');
        owner = await User.create({
          name: ownerName || `${name} Manager`,
          email: ownerEmail.toLowerCase(),
          password: hashedPassword,
          role: 'restaurant_owner',
          phone: ownerPhone || '+92 345 1122334',
        });
      }
    } else {
      // Default demo owner
      const hashedPassword = await hashPassword('pass1234');
      owner = await User.create({
        name: ownerName || `${name} Manager`,
        email: `owner.${slug}@chitralfoodhub.com`,
        password: hashedPassword,
        role: 'restaurant_owner',
        phone: ownerPhone || '+92 345 1122334',
      });
    }

    // Create Restaurant
    const restaurant = await Restaurant.create({
      name,
      slug,
      tagline: tagline || 'Finest dining in Chitral Valley',
      description: description || 'Freshly prepared specialty meals in Chitral.',
      category,
      address,
      locality,
      location: {
        lat: parseFloat(lat) || 35.8510,
        lng: parseFloat(lng) || 71.7864,
      },
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      logoImage: logoImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      deliveryTimeMin: parseInt(deliveryTimeMin, 10),
      deliveryTimeMax: parseInt(deliveryTimeMax, 10),
      deliveryFee: parseInt(deliveryFee, 10),
      minimumOrder: parseInt(minimumOrder, 10),
      ownerId: owner._id,
      cuisineTags: [category, locality],
      isActive: true,
    });

    // Update owner's restaurant reference
    owner.restaurantId = restaurant._id;
    owner.role = 'restaurant_owner';
    await owner.save();

    // If initial dishes were passed, create them
    if (Array.isArray(initialDishes) && initialDishes.length > 0) {
      for (const dish of initialDishes) {
        if (dish.name && dish.price) {
          await MenuItem.create({
            restaurantId: restaurant._id,
            name: dish.name,
            description: dish.description || '',
            price: parseFloat(dish.price),
            category: dish.category || 'Specials',
            tags: dish.tags || ['Local Special'],
            image: dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
            isAvailable: true,
          });
        }
      }
    }

    const token = signToken(owner);

    return res.status(201).json({
      success: true,
      message: 'Restaurant onboarded successfully in Chitral Food Hub!',
      restaurant,
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        restaurantId: restaurant._id,
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
