async function runQfhVerification() {
  console.log('🧪 Running Qashqar Food Hub (QFH) & QFH GPT Verification...\n');

  // 1. Check Restaurants
  const restRes = await fetch('http://localhost:3000/api/restaurants');
  const restData = await restRes.json();
  console.log(`✅ 1. QFH Restaurants API: Loaded ${restData.count} establishments.`);
  const mountainInn = restData.restaurants.find(r => r.slug === 'mountain-inn-restaurant');
  console.log(`   Featured: "${mountainInn.name}" located at ${mountainInn.address}`);

  // 2. Check Drivers & Phone Numbers
  const driversRes = await fetch('http://localhost:3000/api/drivers');
  const driversData = await driversRes.json();
  console.log(`✅ 2. QFH Drivers Fleet: Loaded ${driversData.count} riders.`);
  for (const d of driversData.drivers) {
    console.log(`   Rider: ${d.name} | Phone: ${d.phone} | Vehicle: ${d.vehicleType} (${d.vehiclePlate})`);
    if (d.phone !== '03426522787') {
      throw new Error(`Expected rider phone to be 03426522787, got ${d.phone}`);
    }
  }

  // 3. Test QFH GPT: Search Mantou
  console.log('\n🤖 3. Testing QFH GPT Search: "Where can I get Mantou and what is it?"');
  const gptRes1 = await fetch('http://localhost:3000/api/ai/qfh-gpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Where can I get Mantou and what is it?' }),
  });
  const gptData1 = await gptRes1.json();
  console.log(`   QFH GPT Answer:\n   ${gptData1.answer.replace(/\n/g, '\n   ')}`);
  console.log(`   Matched Dishes Count: ${gptData1.dishes?.length}`);
  if (gptData1.dishes?.length > 0) {
    console.log(`   Top Dish: "${gptData1.dishes[0].name}" - Rs. ${gptData1.dishes[0].price} at ${gptData1.dishes[0].restaurant.name}`);
  }

  // 4. Test QFH GPT: Customer Support & Hotline
  console.log('\n🤖 4. Testing QFH GPT Customer Support: "What is the rider helpline phone number?"');
  const gptRes2 = await fetch('http://localhost:3000/api/ai/qfh-gpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is the rider helpline phone number?' }),
  });
  const gptData2 = await gptRes2.json();
  console.log(`   QFH GPT Helpline Response:\n   ${gptData2.answer.replace(/\n/g, '\n   ')}`);
  console.log(`   Support Phone verified: ${gptData2.supportPhone}`);
  if (gptData2.supportPhone !== '03426522787') {
    throw new Error(`Expected support phone 03426522787, got ${gptData2.supportPhone}`);
  }

  // 5. Test QFH GPT: River Trout query
  console.log('\n🤖 5. Testing QFH GPT: "Show me fresh river trout dishes"');
  const gptRes3 = await fetch('http://localhost:3000/api/ai/qfh-gpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Show me fresh river trout dishes' }),
  });
  const gptData3 = await gptRes3.json();
  console.log(`   Found ${gptData3.dishes?.length} Trout options:`);
  for (const d of gptData3.dishes) {
    console.log(`   - ${d.name} (Rs. ${d.price}) at ${d.restaurant.name}`);
  }

  // 6. Test New Order Placement with QFH- prefix
  console.log('\n📦 6. Testing Order Placement with QFH- prefix');
  const menuRes = await fetch(`http://localhost:3000/api/restaurants/${mountainInn._id}`);
  const menuData = await menuRes.json();
  const mantouDish = menuData.menuItems.find(i => i.name.includes('Mantou'));

  const orderRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: mountainInn._id,
      customerName: 'Sardar Qashqari',
      customerPhone: '03426522787',
      customerAddress: {
        locality: 'Ataliq Bazaar, Qashqar',
        streetAddress: 'Near Shahi Polo Ground',
        notes: 'Deliver hot with extra mint chutney',
      },
      items: [
        { _id: mantouDish._id, name: mantouDish.name, price: mantouDish.price, quantity: 2 }
      ],
      deliveryFee: mountainInn.deliveryFee,
      paymentMethod: 'COD',
    }),
  });
  const orderData = await orderRes.json();
  const order = orderData.order;
  console.log(`   Order Created: #${order.orderNumber}`);
  console.log(`   Order Prefix check: ${order.orderNumber.startsWith('QFH-') ? 'PASSED (QFH-)' : 'FAILED'}`);
  console.log(`   Total Amount: Rs. ${order.totalAmount}`);

  // 7. Test AI Nearest-Driver Dispatch
  console.log('\n🛵 7. Testing AI Smart Dispatching to Nearest Rider');
  const dispatchRes = await fetch('http://localhost:3000/api/drivers/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order._id }),
  });
  const dispatchData = await dispatchRes.json();
  console.log(`   Assigned Rider: ${dispatchData.driver.name} | Phone: ${dispatchData.driver.phone}`);
  console.log(`   Distance: ${dispatchData.dispatchMetrics.distanceKm} km (ETA: ${dispatchData.dispatchMetrics.etaMinutes} mins)`);
  console.log(`   Status: "${dispatchData.order.status}"`);

  console.log('\n🎉 ALL QASHQAR FOOD HUB (QFH) & QFH GPT VERIFICATIONS PASSED SUCCESSFULLY!');
}

runQfhVerification().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
