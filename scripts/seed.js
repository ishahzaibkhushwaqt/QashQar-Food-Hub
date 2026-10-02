import mongoose from 'mongoose';
import connectDB from '../lib/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Driver from '../models/Driver.js';
import Order from '../models/Order.js';
import { hashPassword } from '../lib/auth.js';

export async function seedDatabase() {
  console.log('🌱 Starting Qashqar Food Hub (QFH) Database Seeding...');
  await connectDB();

  // Clear existing collections
  await User.deleteMany({});
  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});
  await Driver.deleteMany({});
  await Order.deleteMany({});
  console.log('🧹 Cleaned existing database collections.');

  const defaultPassword = await hashPassword('12345678');
  const adminPassword = await hashPassword('admin001');

  // 1. Create Users
  const customerUser = await User.create({
    name: 'Sohail Ahmad (Customer)',
    email: 'customer@qashqarfoodhub.com',
    password: defaultPassword, // using 12345678 for default testing
    role: 'customer',
    phone: '03426522787',
    address: {
      locality: 'Ataliq Bazaar, Qashqar (Chitral Town)',
      detail: 'Opposite Shahi Masjid, Shop 12 Lane',
      coordinates: { lat: 35.8510, lng: 71.7864 },
    },
  });

  const driverUser = await User.create({
    name: 'Karim Ullah (Rider)',
    email: 'driver@qashqarfoodhub.com',
    password: defaultPassword,
    role: 'driver',
    phone: '03426522787',
  });

  const adminUser = await User.create({
    name: 'QFH System Admin',
    email: 'shahzaibkhushwaqt6@gmail.com',
    password: adminPassword,
    role: 'admin',
    phone: '03426522787',
  });

  // Owner definitions by restaurant slug
  const ownerConfigs = {
    'mountain-inn-restaurant': { email: 'mountaininn@gmail.com', name: 'Mountain Inn Owner' },
    'conflux-fast-food': { email: 'conflux@gmail.com', name: 'Conflux Fast Food Owner' },
    'hindukush-heights-dining': { email: 'hidukushheights@gmail.com', name: 'Hindukush Heights Owner' },
    'taste-me-fast-food-cafe': { email: 'tastemeffc@gmail.com', name: 'Taste Me Fast Food Owner' },
    'kashmir-restaurant-pizza-house': { email: 'kashmirrph@gmail.com', name: 'Kashmir Restaurant Owner' },
    'fokker-friendship-restaurant': { email: 'fokkerfriendship@gmail.com', name: 'Fokker Friendship Owner' },
    'new-shinwari-restaurant-atoz': { email: 'shinwari@gmail.com', name: 'New Shinwari Owner' },
  };

  const ownersMap = {};
  for (const [slug, config] of Object.entries(ownerConfigs)) {
    ownersMap[slug] = await User.create({
      name: config.name,
      email: config.email,
      password: defaultPassword, // 12345678
      role: 'restaurant_owner',
      phone: '03426522787',
    });
  }

  console.log('✅ Seeded users (Customer, Driver, System Admin and Restaurant Owners).');

  // 2. Seed Restaurants
  const restaurantsData = [
    {
      name: 'Mountain Inn Restaurant',
      slug: 'mountain-inn-restaurant',
      tagline: 'Authentic Traditional Chitrali & Pamiri Cuisine',
      description: 'Chitral Town’s iconic dining destination serving freshly prepared steamed Mantou, organic trout fish from river streams, and slow-cooked lamb karahi.',
      category: 'Traditional Chitrali',
      address: 'Ataliq Bazaar, Chitral Town',
      locality: 'Ataliq Bazaar',
      location: { lat: 35.8510, lng: 71.7864 },
      bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 284,
      deliveryTimeMin: 25,
      deliveryTimeMax: 40,
      deliveryFee: 100,
      minimumOrder: 400,
      cuisineTags: ['Traditional', 'Mantou', 'River Trout', 'Lamb Karahi', 'Qawa'],
      menuItems: [
        {
          name: 'Chitrali Special Mantou (Steamed Beef Dumplings)',
          description: 'Handcrafted dough parcels filled with seasoned minced Chitral beef, steamed to tender perfection and topped with rich tomato sauce and yogurt dressing.',
          price: 850,
          category: 'Traditional',
          tags: ['Local Special', 'Popular', 'Chef Choice'],
          image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 25,
        },
        {
          name: 'Traditional Khowar Lamb Karahi (1KG)',
          description: 'Tender mountain pasture lamb cooked over wood embers in cast iron with fresh tomatoes, ginger, green chilies, and black pepper.',
          price: 2400,
          category: 'Karahi',
          tags: ['Local Special', 'Popular'],
          image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 35,
        },
        {
          name: 'Pan-Fried River Trout Fish',
          description: 'Freshly caught Chitral river trout seasoned with native mountain spices, pan-seared in desi butter with crispy golden skin.',
          price: 1800,
          category: 'Trout & Fish',
          tags: ['Local Special', 'Popular'],
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 25,
        },
        {
          name: 'Fresh Garden Salad & Mint Chutney',
          description: 'Crisp organic cucumber, purple onions, juicy tomatoes, and freshly stone-ground wild mint yogurt dip.',
          price: 150,
          category: 'Sides & Salads',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'chutney_salad',
          prepTimeMinutes: 5,
        },
        {
          name: 'Kashmiri Green Tea / Local Qawa',
          description: 'Authentic brewed green tea infused with green cardamom, saffron threads, cinnamon, and crushed almonds.',
          price: 120,
          category: 'Beverages',
          tags: ['Local Special', 'Popular'],
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'digestive_tea',
          prepTimeMinutes: 10,
        },
        {
          name: 'Tandoori Naan',
          description: 'Traditional wood-fired earthen tandoor flatbread brushed with sesame seeds.',
          price: 30,
          category: 'Breads',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'bread_naan',
          prepTimeMinutes: 5,
        },
      ],
    },
    {
      name: 'Conflux Fast Food',
      slug: 'conflux-fast-food',
      tagline: 'Crispy Burgers, Loaded Pizzas & Shawarmas in Singur',
      description: 'The preferred hangout and delivery hub for Chitral youth and families, renowned for hot crunchy zinger burgers and cheesy deep-dish pizzas.',
      category: 'Fast Food & Pizzeria',
      address: 'Village Gankorini Singur / Shotkhora, Chitral',
      locality: 'Singoor',
      location: { lat: 35.8655, lng: 71.7942 },
      bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80',
      rating: 4.7,
      reviewCount: 198,
      deliveryTimeMin: 20,
      deliveryTimeMax: 35,
      deliveryFee: 120,
      minimumOrder: 350,
      cuisineTags: ['Fast Food', 'Zinger', 'Pizza', 'Shawarma', 'Fries'],
      menuItems: [
        {
          name: 'Conflux Supreme Zinger Burger',
          description: 'Extra crunchy marinated chicken thigh fillet, garlic mayo, iceberg lettuce in toasted brioche bun.',
          price: 650,
          category: 'Burgers',
          tags: ['Popular', 'Chef Choice'],
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 15,
        },
        {
          name: 'Special Cheesy Chicken Pizza (Large)',
          description: 'House dough covered in spiced chicken tikka chunks, black olives, sweet bell peppers, and melted mozzarella.',
          price: 1650,
          category: 'Pizza',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 25,
        },
        {
          name: 'Crispy Chicken Shawarma Roll',
          description: 'Shaved seasoned rotisserie chicken wrapped in warm pita with pickled cucumber and tahini garlic sauce.',
          price: 350,
          category: 'Fast Food',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 10,
        },
        {
          name: 'Loaded Cheese Fries',
          description: 'Golden crinkle-cut fries smothered in warm cheddar cheese sauce, jalapenos, and sprinkled spice herbs.',
          price: 400,
          category: 'Sides & Fries',
          tags: ['Popular', 'Local Special'],
          image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'fries_sides',
          prepTimeMinutes: 12,
        },
        {
          name: 'Chilled Soft Drink (Can)',
          description: 'Ice cold carbonated soda can (Pepsi / 7Up / Mirinda).',
          price: 120,
          category: 'Beverages',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'cold_beverage',
          prepTimeMinutes: 2,
        },
      ],
    },
    {
      name: 'Hindukush Heights Dining',
      slug: 'hindukush-heights-dining',
      tagline: 'Fine Mountain Dining with Panoramic Valley Views',
      description: 'Luxury dining perched high above the valley on Garam Chashma Road, highlighting organic local heritage recipes such as walnut Ghalmandi and charcoal skewers.',
      category: 'Hotel & Fine Dining',
      address: 'Garam Chashma Road, Chitral',
      locality: 'Garam Chashma Road',
      location: { lat: 35.8720, lng: 71.7810 },
      bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 312,
      deliveryTimeMin: 35,
      deliveryTimeMax: 50,
      deliveryFee: 150,
      minimumOrder: 600,
      cuisineTags: ['Fine Dining', 'Ghalmandi', 'Tikka Kebab', 'Handi', 'Organic'],
      menuItems: [
        {
          name: 'Chitrali Tikka Kebab Skewer',
          description: 'Succulent cubes of mountain beef marinated in wild thyme, roasted coriander, and pomegranate molasses.',
          price: 650,
          category: 'BBQ',
          tags: ['Local Special', 'Popular'],
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 20,
        },
        {
          name: 'Ghalmandi (Organic Walnut Bread)',
          description: 'A prized ancient Chitrali delicacy: layered whole-wheat bread filled with crushed native walnuts, cottage cheese, and drizzled with warm desi ghee.',
          price: 500,
          category: 'Traditional',
          tags: ['Local Special', 'Chef Choice', 'Popular'],
          image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'bread_naan',
          prepTimeMinutes: 25,
        },
        {
          name: 'Special Chicken Handi',
          description: 'Boneless chicken cubes simmered gently in rich creamy butter gravy with crushed fenugreek and white pepper inside an earthen pot.',
          price: 1400,
          category: 'Handi & Karahi',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 30,
        },
        {
          name: 'Kashmiri Green Tea / Local Qawa',
          description: 'Pure Chitral wild mountain herbs and Kashmiri tea leaves with crushed walnut garnish.',
          price: 120,
          category: 'Beverages',
          tags: ['Local Special'],
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'digestive_tea',
          prepTimeMinutes: 8,
        },
      ],
    },
    {
      name: 'Taste Me Fast Food & Cafe',
      slug: 'taste-me-fast-food-cafe',
      tagline: 'Chitral’s Modern Urban Cafe & Gourmet Burgers',
      description: 'Prime spot on Bypass Road offering delicious BBQ beef burgers, crisp club sandwiches, chicken wings, and iced espresso concoctions.',
      category: 'Fast Food & Cafe',
      address: 'Bypass Road, Chitral Town',
      locality: 'Bypass Road',
      location: { lat: 35.8450, lng: 71.7780 },
      bannerImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=300&q=80',
      rating: 4.6,
      reviewCount: 165,
      deliveryTimeMin: 20,
      deliveryTimeMax: 35,
      deliveryFee: 110,
      minimumOrder: 300,
      cuisineTags: ['Burgers', 'Cafe', 'Wings', 'Coffee', 'Sandwiches'],
      menuItems: [
        {
          name: 'Smoky BBQ Beef Burger',
          description: 'Char-grilled 100% prime beef patty basted with smoky BBQ glaze, topped with melted cheese, caramelized onions, and crisp greens.',
          price: 580,
          category: 'Burgers',
          tags: ['Popular', 'Chef Choice'],
          image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 18,
        },
        {
          name: 'Club Sandwich with Fries',
          description: 'Triple-decker toasted sandwich with roasted shredded chicken, fried egg, cheddar slice, and crispy golden fries.',
          price: 450,
          category: 'Sandwiches',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 15,
        },
        {
          name: 'Hot & Crispy Wings (8 Pcs)',
          description: 'Crunchy battered chicken wings tossed in homemade spicy peri peri sauce with dip.',
          price: 520,
          category: 'Fast Food',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1527477378698-0c62c2f6d2f3?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'fries_sides',
          prepTimeMinutes: 15,
        },
        {
          name: 'Cold Coffee with Ice Cream',
          description: 'Double shot rich espresso blended with chilled milk and topped with a generous scoop of vanilla ice cream and chocolate drizzle.',
          price: 350,
          category: 'Beverages',
          tags: ['Popular', 'Local Special'],
          image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'cold_beverage',
          prepTimeMinutes: 5,
        },
      ],
    },
    {
      name: 'Kashmir Restaurant & Pizza House',
      slug: 'kashmir-restaurant-pizza-house',
      tagline: 'Traditional Flavors & Modern Stone-Baked Pizzas',
      description: 'Right in the bustling heart of Main Shahi Bazaar, serving savory Peshawar-style Chapli Kebabs, fragrant Biryani, and hot crispy pizzas.',
      category: 'Fast Food & Traditional',
      address: 'Main Shahi Bazaar, Chitral Town',
      locality: 'Main Shahi Bazaar',
      location: { lat: 35.8525, lng: 71.7872 },
      bannerImage: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=300&q=80',
      rating: 4.7,
      reviewCount: 220,
      deliveryTimeMin: 20,
      deliveryTimeMax: 35,
      deliveryFee: 100,
      minimumOrder: 350,
      cuisineTags: ['Pizza', 'Chapli Kebab', 'Biryani', 'Traditional'],
      menuItems: [
        {
          name: 'Chicken Tikka Pizza (Medium)',
          description: 'Stone-baked pizza loaded with spicy tikka chicken, red onions, jalapeños, and extra mozzarella blend.',
          price: 1100,
          category: 'Pizza',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 20,
        },
        {
          name: 'Beef Chapli Kebab (2 Pcs)',
          description: 'Authentic pan-fried beef patties infused with crushed coriander, pomegranate seeds, diced tomatoes, and egg.',
          price: 480,
          category: 'BBQ & Kebab',
          tags: ['Popular', 'Local Special'],
          image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 15,
        },
        {
          name: 'Special Chicken Biryani',
          description: 'Long grain aged basmati rice cooked with whole aromatic spices, tender spiced chicken, and saffron aroma.',
          price: 450,
          category: 'Traditional',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 10,
        },
      ],
    },
    {
      name: 'Fokker Friendship Restaurant',
      slug: 'fokker-friendship-restaurant',
      tagline: 'Historic Riverfront Dining at Singoor',
      description: 'Named after the legendary PIA Fokker flights that connected Chitral Valley to the world. Renowned for scenic riverbank trout grills and Afghani pulao.',
      category: 'Continental & Traditional',
      address: 'Main Garam Chashma Rd, Singoor, Chitral',
      locality: 'Singoor',
      location: { lat: 35.8670, lng: 71.7915 },
      bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=300&q=80',
      rating: 4.8,
      reviewCount: 240,
      deliveryTimeMin: 30,
      deliveryTimeMax: 45,
      deliveryFee: 130,
      minimumOrder: 500,
      cuisineTags: ['River Trout', 'Afghani Pulao', 'Karahi', 'Historic'],
      menuItems: [
        {
          name: 'Grilled River Trout with Local Spices',
          description: 'Whole fresh river trout charcoal-grilled on river stones with wild rosemary, lemon garlic butter, and Himalayan rock salt.',
          price: 1950,
          category: 'Trout & Fish',
          tags: ['Local Special', 'Popular', 'Chef Choice'],
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 25,
        },
        {
          name: 'Special Afghani Pulao',
          description: 'Aromatic sella rice steamed with tender mutton shanks, caramelized julienned carrots, and sweet golden raisins.',
          price: 750,
          category: 'Traditional',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 15,
        },
        {
          name: 'Chicken Karahi (Half KG)',
          description: 'Country chicken sauteed in iron wok with fresh ginger slivers, crushed black pepper, and green chilies.',
          price: 950,
          category: 'Karahi',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 25,
        },
      ],
    },
    {
      name: 'New Shinwari Restaurant AtoZ',
      slug: 'new-shinwari-restaurant-atoz',
      tagline: 'Master of Shinwari Mutton & Namak Mandi BBQ',
      description: 'The ultimate stop on Birmugh Lasht Road for authentic Khyber and Chitral tribal style BBQ, where cuts are seasoned simply with rock salt and slow-cooked in natural fat.',
      category: 'BBQ & Karahi',
      address: 'Birmugh Lasht Road, Chitral Town',
      locality: 'Birmugh Lasht Road',
      location: { lat: 35.8610, lng: 71.7700 },
      bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      logoImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 275,
      deliveryTimeMin: 35,
      deliveryTimeMax: 55,
      deliveryFee: 140,
      minimumOrder: 600,
      cuisineTags: ['Shinwari', 'Mutton Karahi', 'Namak Mandi', 'Tandoor'],
      menuItems: [
        {
          name: 'Shinwari Mutton Karahi (1KG)',
          description: 'Fresh young goat meat slow-cooked in its own rendered fat with fresh vine-ripened tomatoes, salt, and slit green chilies.',
          price: 2800,
          category: 'Karahi',
          tags: ['Local Special', 'Popular', 'Chef Choice'],
          image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 40,
        },
        {
          name: 'Beef Namak Mandi Tikka',
          description: 'Tender beef skewers salted and char-grilled over acacia wood coals, crispy exterior with melt-in-mouth tenderness.',
          price: 900,
          category: 'BBQ',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'none',
          prepTimeMinutes: 25,
        },
        {
          name: 'Tandoori Naan',
          description: 'Fluffy, piping hot tandoori flatbread fresh out of clay oven.',
          price: 30,
          category: 'Breads',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
          complementaryCategory: 'bread_naan',
          prepTimeMinutes: 5,
        },
      ],
    },
  ];

  for (const rData of restaurantsData) {
    const { menuItems, ...restaurantFields } = rData;
    
    // Assign ownerId if mapped
    const currentOwner = ownersMap[rData.slug];
    if (currentOwner) {
      restaurantFields.ownerId = currentOwner._id;
    }

    const restaurant = await Restaurant.create(restaurantFields);

    for (const item of menuItems) {
      await MenuItem.create({
        ...item,
        restaurantId: restaurant._id,
      });
    }

    // Link restaurant to owner
    if (currentOwner) {
      currentOwner.restaurantId = restaurant._id;
      await currentOwner.save();
    }
  }
  console.log(`✅ Seeded ${restaurantsData.length} Chitral restaurants and all authentic menu items.`);

  // 3. Seed Drivers with realistic Qashqar Valley coordinates and official dispatch phone
  const driversData = [
    {
      name: 'Karim Ullah (Rider #1)',
      phone: '03426522787',
      vehicleType: 'Honda CD70',
      vehiclePlate: 'QFH-9812',
      status: 'available',
      currentLocation: {
        lat: 35.8518,
        lng: 71.7860,
        localityName: 'Ataliq Bazaar, Qashqar',
      },
      rating: 4.9,
      totalDeliveries: 112,
    },
    {
      name: 'Asif Raza (Rider #2)',
      phone: '03426522787',
      vehicleType: 'Yamaha YBR',
      vehiclePlate: 'QFH-4421',
      status: 'available',
      currentLocation: {
        lat: 35.8640,
        lng: 71.7920,
        localityName: 'Singoor Suspension Bridge',
      },
      rating: 4.8,
      totalDeliveries: 88,
    },
    {
      name: 'Sher Ali (Rider #3)',
      phone: '03426522787',
      vehicleType: 'Motorcycle (Rider)',
      vehiclePlate: 'QFH-1190',
      status: 'available',
      currentLocation: {
        lat: 35.8465,
        lng: 71.7790,
        localityName: 'Bypass Road Terminal',
      },
      rating: 4.9,
      totalDeliveries: 154,
    },
  ];

  for (const d of driversData) {
    await Driver.create(d);
  }
  console.log(`✅ Seeded ${driversData.length} active delivery riders across Qashqar Valley hubs (Phone: 03426522787).`);

  console.log('🎉 Database seeding completed successfully for Qashqar Food Hub (QFH)!');
}

// Allow direct execution: node scripts/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    console.log('Done. Exiting process.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
