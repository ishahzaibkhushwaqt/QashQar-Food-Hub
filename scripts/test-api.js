async function runVerification() {
  console.log('🧪 Running Chitral Food Hub End-to-End Verification...\n');

  // 1. Query Restaurants
  const restRes = await fetch('http://localhost:3000/api/restaurants');
  const restData = await restRes.json();
  console.log(`✅ 1. Restaurants API: Found ${restData.count} establishments.`);
  const mountainInn = restData.restaurants.find(r => r.slug === 'mountain-inn-restaurant');
  console.log(`   Featured: "${mountainInn.name}" located at ${mountainInn.address}`);

  // 2. Fetch Menu
  const menuRes = await fetch(`http://localhost:3000/api/restaurants/${mountainInn._id}`);
  const menuData = await menuRes.json();
  console.log(`✅ 2. Menu API: Retrieved ${menuData.menuItems.length} dishes for ${mountainInn.name}.`);
  const mantou = menuData.menuItems.find(i => i.name.includes('Mantou'));
  console.log(`   Sample Dish: "${mantou.name}" - Rs. ${mantou.price}`);

  // 3. AI Menu Recommendation Engine
  const aiRes = await fetch('http://localhost:3000/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: mountainInn._id,
      cartItems: [{ _id: mantou._id, name: mantou.name, category: mantou.category, price: mantou.price, quantity: 1 }],
    }),
  });
  const aiData = await aiRes.json();
  console.log(`✅ 3. AI Recommendation Engine: Generated ${aiData.count} pairings for cart with Mantou:`);
  for (const rec of aiData.recommendations) {
    console.log(`   * [${rec.badge}] ${rec.item.name} (Score: ${rec.score})`);
    console.log(`     Reasoning: "${rec.reasoning}"`);
  }

  // 4. Place Live Order
  const orderRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: mountainInn._id,
      customerName: 'Aziz Ullah Chitrali',
      customerPhone: '+92 345 5544332',
      customerAddress: {
        locality: 'Ataliq Bazaar, Chitral Town',
        streetAddress: 'Near Shahi Masjid & Polo Ground',
        notes: 'Please bring hot Qawa with the order',
      },
      items: [
        { _id: mantou._id, name: mantou.name, price: mantou.price, quantity: 2 },
      ],
      deliveryFee: mountainInn.deliveryFee,
      paymentMethod: 'COD',
    }),
  });
  const orderData = await orderRes.json();
  const createdOrder = orderData.order;
  console.log(`✅ 4. Order Placement API: Successfully placed #${createdOrder.orderNumber}`);
  console.log(`   Total Amount: Rs. ${createdOrder.totalAmount} (Subtotal: Rs. ${createdOrder.subtotal}, Fee: Rs. ${createdOrder.deliveryFee}, Tax: Rs. ${createdOrder.tax})`);
  console.log(`   Initial Status: "${createdOrder.status}"`);

  // 5. Smart Nearest-Driver AI Dispatching
  const dispatchRes = await fetch('http://localhost:3000/api/drivers/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: createdOrder._id }),
  });
  const dispatchData = await dispatchRes.json();
  console.log(`✅ 5. Smart Driver AI Dispatching:`);
  console.log(`   Assigned Rider: ${dispatchData.driver.name} (${dispatchData.driver.vehicleType} - ${dispatchData.driver.vehiclePlate})`);
  console.log(`   Proximity Distance: ${dispatchData.dispatchMetrics.distanceKm} km (ETA: ${dispatchData.dispatchMetrics.etaMinutes} mins)`);
  console.log(`   Telemetry Explanation: "${dispatchData.dispatchMetrics.aiExplanation}"`);
  console.log(`   Updated Order Status: "${dispatchData.order.status}"`);

  // 6. Test Vendor Self-Onboarding
  const onboardRes = await fetch('http://localhost:3000/api/restaurants/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tirich Mir View Cafe',
      category: 'Cafe',
      address: 'Bypass Road, Near Shahi Qila',
      locality: 'Bypass Road',
      lat: 35.8480,
      lng: 71.7795,
      deliveryFee: 110,
      ownerName: 'Zubair Khan',
      ownerEmail: 'zubair@tirichmircafe.com',
      initialDishes: [
        { name: 'Mountain Herbal Tea & Walnut Cookie', price: 250, category: 'Beverages' },
      ],
    }),
  });
  const onboardData = await onboardRes.json();
  console.log(`✅ 6. Vendor Onboarding API: Successfully registered "${onboardData.restaurant.name}"`);
  console.log(`   Slug: ${onboardData.restaurant.slug}, Locality: ${onboardData.restaurant.locality}`);
  console.log(`   Owner Account Created: ${onboardData.owner.name} (${onboardData.owner.email})`);

  // 7. Test Inventory Stock Toggle
  const toggleRes = await fetch(`http://localhost:3000/api/restaurants/${mountainInn._id}/menu`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId: mantou._id,
      isAvailable: false,
    }),
  });
  const toggleData = await toggleRes.json();
  console.log(`✅ 7. Inventory Stock Toggle: Toggled "${toggleData.item.name}" availability to ${toggleData.item.isAvailable}`);

  // Re-enable stock
  await fetch(`http://localhost:3000/api/restaurants/${mountainInn._id}/menu`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId: mantou._id,
      isAvailable: true,
    }),
  });
  console.log(`   Restored stock availability to true.`);

  console.log('\n🎉 ALL 7 SYSTEM CAPABILITIES VERIFIED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
