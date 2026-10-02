import connectDB from '../../../lib/db.js';
import MenuItem from '../../../models/MenuItem.js';
import Restaurant from '../../../models/Restaurant.js';

const OFFICIAL_PHONE = '03426522787';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { message = '', history = [] } = req.body;
    const query = message.trim().toLowerCase();

    if (!query) {
      return res.status(400).json({ success: false, message: 'Message query is required' });
    }

    // Fetch all active restaurants and menu items for intelligent search grounding
    const [restaurants, menuItems] = await Promise.all([
      Restaurant.find({ isActive: true }).lean(),
      MenuItem.find({ isAvailable: true }).populate('restaurantId', 'name locality slug deliveryFee').lean(),
    ]);

    let responseText = '';
    let matchedDishes = [];
    let matchedRestaurants = [];
    let quickActions = [];

    // 1. Phone / Rider / Contact / Helpline Query
    if (query.includes('phone') || query.includes('contact') || query.includes('number') || query.includes('rider') || query.includes('call') || query.includes('whatsapp') || query.includes('help') || query.includes('support')) {
      responseText = `📞 **Qashqar Food Hub (QFH) Official Helpline & Rider Dispatch:**\n\nYou can reach our live rider dispatch desk and customer support anytime at:\n\n👉 **${OFFICIAL_PHONE}**\n\nOur team in Qashqar (Chitral Town) is ready to help you with order dispatches, address directions, or restaurant inquiries.`;
      quickActions = [
        { label: `Call Support (${OFFICIAL_PHONE})`, action: `tel:${OFFICIAL_PHONE}` },
        { label: 'Chat on WhatsApp', action: `https://wa.me/923426522787` },
        { label: 'View Rider Portal', action: '/driver' }
      ];
    }

    // 2. What is Qashqar / History / Cultural Query
    else if (query.includes('qashqar') || query.includes('what is qashqar') || query.includes('meaning')) {
      responseText = `🏔️ **Welcome to Qashqar!**\n\n"**Qashqar**" (قاشقار) is the historic, ancient cultural name of Chitral Valley, nestled under the shadow of Tirich Mir (7,708m). \n\nQashqar Food Hub (QFH) celebrates our centuries-old mountain culinary traditions — from savory steamed **Mantou** and whole **River Trout** to organic walnut **Ghalmandi** and earthen-pot **Shinwari Karahi**. What traditional delight can I find for you today?`;
      quickActions = [
        { label: '🥟 Explore Traditional Dishes', query: 'Show me traditional Chitrali dishes' },
        { label: '🐟 Fresh River Trout', query: 'Where can I get river trout?' }
      ];
    }

    // 3. Mantou inquiry
    else if (query.includes('mantou') || query.includes('mantu') || query.includes('dumpling')) {
      matchedDishes = menuItems.filter(item => item.name.toLowerCase().includes('mantou'));
      responseText = `🥟 **Chitrali Special Mantou (Steamed Beef Dumplings)** is one of Qashqar's most celebrated delicacies! Delicate handmade dough wraps filled with finely minced local beef, onions, and mountain spices, steamed to juicy tenderness and crowned with tomato glaze and garlic yogurt.`;
    }

    // 4. River Trout / Fish inquiry
    else if (query.includes('trout') || query.includes('fish')) {
      matchedDishes = menuItems.filter(item => item.name.toLowerCase().includes('trout') || item.name.toLowerCase().includes('fish'));
      responseText = `🐟 **Fresh River Trout Fish** is caught directly from the crystal glacier streams of Chitral River and Garam Chashma streams. It is pan-seared or grilled over river stones in pure desi butter. Here are the top trout preparations available right now:`;
    }

    // 5. Ghalmandi / Traditional Bread inquiry
    else if (query.includes('ghalmandi') || query.includes('bread') || query.includes('walnut')) {
      matchedDishes = menuItems.filter(item => item.name.toLowerCase().includes('ghalmandi') || item.category?.toLowerCase().includes('bread'));
      responseText = `🫓 **Ghalmandi** is an ancient native Qashqari flatbread stuffed with stone-ground wild walnuts, fresh local cottage cheese, and basted with bubbling desi ghee. It is rich, nutty, and nutritious.`;
    }

    // 6. Karahi / Shinwari / Meat inquiry
    else if (query.includes('karahi') || query.includes('shinwari') || query.includes('mutton') || query.includes('lamb') || query.includes('beef') || query.includes('tikka')) {
      matchedDishes = menuItems.filter(item => 
        item.name.toLowerCase().includes('karahi') || 
        item.name.toLowerCase().includes('shinwari') || 
        item.name.toLowerCase().includes('tikka') ||
        item.category?.toLowerCase().includes('karahi') ||
        item.category?.toLowerCase().includes('bbq')
      );
      responseText = `🍲 **Qashqar Karahi & Shinwari Specialties:** Cooked over roaring wood coals and iron woks, seasoned with Himalayan rock salt, fresh tomatoes, and green chilies. Here are our top karahi and BBQ dishes:`;
    }

    // 7. Fast Food / Burger / Pizza inquiry
    else if (query.includes('burger') || query.includes('pizza') || query.includes('shawarma') || query.includes('fast food') || query.includes('fries') || query.includes('wings')) {
      matchedDishes = menuItems.filter(item => 
        item.category?.toLowerCase().includes('fast food') || 
        item.category?.toLowerCase().includes('pizza') ||
        item.category?.toLowerCase().includes('burger') ||
        item.name.toLowerCase().includes('burger') ||
        item.name.toLowerCase().includes('pizza') ||
        item.name.toLowerCase().includes('shawarma') ||
        item.name.toLowerCase().includes('fries')
      );
      responseText = `🍔 Looking for crispy fast-food in Qashqar? We have supreme zinger burgers, loaded cheese fries, and stone-baked pizzas from top spots like Conflux and Taste Me:`;
    }

    // 8. Budget / Price queries (e.g. under 500, under 1000)
    else if (query.includes('under') || query.includes('cheap') || query.includes('budget') || query.includes('rs') || query.includes('price')) {
      let maxPrice = 1000;
      const priceMatch = query.match(/\d+/);
      if (priceMatch) {
        maxPrice = parseInt(priceMatch[0], 10);
      }
      matchedDishes = menuItems.filter(item => item.price <= maxPrice).sort((a, b) => a.price - b.price);
      responseText = `💰 Here are the finest dishes in Qashqar Food Hub under **Rs. ${maxPrice}**:`;
    }

    // 9. Payment Methods & Delivery Tracking Help
    else if (query.includes('payment') || query.includes('pay') || query.includes('easypaisa') || query.includes('jazzcash') || query.includes('cod')) {
      responseText = `💳 **Payment Options on Qashqar Food Hub:**\n\n1. **Cash on Delivery (COD)**: Pay the rider directly in cash upon receiving your food.\n2. **Easypaisa**: Instant digital wallet transfer.\n3. **JazzCash**: Seamless mobile account payment.\n\nAll orders are verified and dispatched with a live GPS receipt. Need help with a payment? Call our hotline at **${OFFICIAL_PHONE}**.`;
    }

    // 10. General Search fallback matching dish names or restaurant names
    else {
      matchedDishes = menuItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );

      matchedRestaurants = restaurants.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query) ||
        r.locality?.toLowerCase().includes(query)
      );

      if (matchedDishes.length > 0) {
        responseText = `✨ Found **${matchedDishes.length} items** in Qashqar Food Hub matching "${message}":`;
      } else if (matchedRestaurants.length > 0) {
        responseText = `🏰 Found **${matchedRestaurants.length} dining spots** matching "${message}":`;
      } else {
        responseText = `I'm **QFH GPT**, your guide to dining in Qashqar! I can help you search dishes (Mantou, River Trout, Karahi, Zinger Burgers, Pizzas), compare prices in PKR, check restaurant hours, or connect you with our rider dispatch hotline at **${OFFICIAL_PHONE}**.\n\nWhat would you like to taste today?`;
        matchedDishes = menuItems.slice(0, 4); // show popular highlights
      }
    }

    // Format top 6 dishes
    const formattedDishes = matchedDishes.slice(0, 6).map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      image: item.image,
      tags: item.tags,
      restaurant: {
        _id: item.restaurantId?._id,
        name: item.restaurantId?.name || 'Qashqar Eatery',
        locality: item.restaurantId?.locality || 'Chitral Town',
        deliveryFee: item.restaurantId?.deliveryFee || 120,
      }
    }));

    return res.status(200).json({
      success: true,
      answer: responseText,
      dishes: formattedDishes,
      restaurants: matchedRestaurants.slice(0, 3),
      quickActions,
      supportPhone: OFFICIAL_PHONE,
    });

  } catch (error) {
    console.error('QFH GPT Error:', error);
    return res.status(500).json({ 
      success: false, 
      answer: `QFH GPT is currently taking orders! You can call our live hotline at ${OFFICIAL_PHONE} for immediate order support.`,
      dishes: [],
      supportPhone: OFFICIAL_PHONE
    });
  }
}
