/**
 * Modern Embedded AI Menu Recommendation Engine
 * Tailored specifically for Chitral culinary pairings:
 * - Pairs rich, traditional mountainous meats (Mantou, Karahi, Tikka, Trout) with local herbal digestives (Qawa, Green Tea, Mint Chutney)
 * - Pairs Western / fast-food dishes (Burgers, Pizza) with loaded sides, dips, and iced beverages
 */

export function generateCartRecommendations(cartItems, availableMenuItems) {
  if (!cartItems || cartItems.length === 0 || !availableMenuItems || availableMenuItems.length === 0) {
    return [];
  }

  const recommendations = [];
  const cartItemIds = new Set(cartItems.map(item => item._id?.toString() || item.menuItemId?.toString() || item.id));

  // Determine cart flavor profiles
  let hasHeavyMeat = false;
  let hasTraditionalDish = false;
  let hasFastFood = false;
  let hasPizzaOrBurger = false;
  let hasTeaOrBeverage = false;
  let hasBread = false;
  let hasSaladOrChutney = false;
  let hasFries = false;

  const meatKeywords = ['karahi', 'mantou', 'trout', 'fish', 'tikka', 'kebab', 'mutton', 'beef', 'shinwari', 'handi', 'biryani'];
  const fastFoodKeywords = ['burger', 'pizza', 'shawarma', 'sandwich', 'wings'];
  const drinkKeywords = ['tea', 'qawa', 'coffee', 'beverage', 'drink', 'chai'];
  const breadKeywords = ['naan', 'roti', 'bread', 'ghalmandi'];
  const saladKeywords = ['salad', 'chutney', 'raita'];
  const fryKeywords = ['fries', 'potato'];

  for (const item of cartItems) {
    const name = (item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();

    if (meatKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
      hasHeavyMeat = true;
    }
    if (name.includes('mantou') || name.includes('karahi') || name.includes('ghalmandi') || name.includes('shinwari') || name.includes('trout')) {
      hasTraditionalDish = true;
    }
    if (fastFoodKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
      hasFastFood = true;
      hasPizzaOrBurger = true;
    }
    if (drinkKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
      hasTeaOrBeverage = true;
    }
    if (breadKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
      hasBread = true;
    }
    if (saladKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
      hasSaladOrChutney = true;
    }
    if (fryKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
      hasFries = true;
    }
  }

  // Iterate over restaurant menu candidates not yet in cart
  const candidates = availableMenuItems.filter(item => {
    const id = item._id?.toString() || item.id;
    return !cartItemIds.has(id) && item.isAvailable !== false;
  });

  for (const candidate of candidates) {
    const cName = candidate.name.toLowerCase();
    const cCat = (candidate.category || '').toLowerCase();
    const cComp = candidate.complementaryCategory || '';

    // 1. Traditional Meat -> Digestive Qawa / Green Tea pairing
    if (hasHeavyMeat && !hasTeaOrBeverage && (cComp === 'digestive_tea' || cName.includes('qawa') || cName.includes('green tea') || cName.includes('tea'))) {
      recommendations.push({
        item: candidate,
        score: 0.96,
        badge: 'Recommended Digestif',
        reasoning: 'AI Culinary Pairing: Rich lamb, beef or fish dishes traditionally harmonize with hot Chitrali Qawa or Kashmiri Green Tea for optimal digestion in high-altitude mountain climate.',
      });
      continue;
    }

    // 2. Heavy Meat / Karahi -> Mint Chutney & Fresh Salad
    if (hasHeavyMeat && !hasSaladOrChutney && (cComp === 'chutney_salad' || cName.includes('chutney') || cName.includes('salad') || cName.includes('raita'))) {
      recommendations.push({
        item: candidate,
        score: 0.93,
        badge: 'Palate Cleanser',
        reasoning: 'AI Recommendation: Crisp valley mint chutney cuts through the rich spices and marination of Karahi and Kebab skewers.',
      });
      continue;
    }

    // 3. Karahi / Handi -> Tandoori Naan or Ghalmandi pairing
    if ((hasHeavyMeat || hasTraditionalDish) && !hasBread && (cComp === 'bread_naan' || cName.includes('naan') || cName.includes('roti') || cName.includes('ghalmandi'))) {
      recommendations.push({
        item: candidate,
        score: 0.91,
        badge: 'Essential Side',
        reasoning: 'AI Suggestion: Clay-oven baked Tandoori Naan or local walnut Ghalmandi is the quintessential accompaniment to gravies and Karahi.',
      });
      continue;
    }

    // 4. Fast Food (Burgers / Wings / Shawarma) -> Loaded Fries
    if (hasFastFood && !hasFries && (cComp === 'fries_sides' || cName.includes('fries') || cName.includes('wings') || cName.includes('cheese'))) {
      recommendations.push({
        item: candidate,
        score: 0.92,
        badge: 'Crispy Side',
        reasoning: 'AI Fast Food Pairing: Customers ordering burgers and wraps frequently complement their meal with seasoned loaded fries.',
      });
      continue;
    }

    // 5. Fast Food -> Cold Beverage / Shake / Cold Coffee
    if (hasFastFood && !hasTeaOrBeverage && (cComp === 'cold_beverage' || cName.includes('coffee') || cName.includes('shake') || cName.includes('coke') || cName.includes('drink'))) {
      recommendations.push({
        item: candidate,
        score: 0.88,
        badge: 'Chilled Drink',
        reasoning: 'AI Pairing: Chilled beverages and milkshakes enhance the savoriness of crispy fast food.',
      });
      continue;
    }

    // 6. Popular / Local Special items fallback
    if (candidate.tags && (candidate.tags.includes('Popular') || candidate.tags.includes('Local Special'))) {
      recommendations.push({
        item: candidate,
        score: 0.75,
        badge: candidate.tags.includes('Local Special') ? 'Chitral Special' : 'Popular Dish',
        reasoning: `Chitral Food Hub Highlight: "${candidate.name}" is one of the highest-rated favorites from this kitchen.`,
      });
    }
  }

  // Sort by score descending and take top 3
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, 3);
}
