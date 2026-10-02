import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Bike,
  SlidersHorizontal,
  ChevronRight,
  Phone,
  ArrowRight,
  Leaf,
  Award,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'allCategories', label: 'All',                     emoji: '🍽️', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80' },
  { key: 'traditionalChitrali', label: 'Traditional Chitrali',    emoji: '🥟', img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=300&q=80' },
  { key: 'fastFoodPizzeria', label: 'Fast Food & Pizzeria',    emoji: '🍕', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80' },
  { key: 'hotelFineDining', label: 'Hotel & Fine Dining',     emoji: '🍽️', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=300&q=80' },
  { key: 'bbqKarahi', label: 'BBQ & Karahi',            emoji: '🍲', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80' },
  { key: 'fastFoodCafe', label: 'Fast Food & Cafe',        emoji: '☕', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80' },
  { key: 'continentalTraditional', label: 'Continental & Traditional', emoji: '🌍', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=80' },
];

const QASHQAR_LOCALITIES = [
  'All Localities',
  'Ataliq Bazaar',
  'Singoor',
  'Bypass Road',
  'Main Shahi Bazaar',
  'Garam Chashma Road',
  'Birmugh Lasht Road',
];

const OFFICIAL_PHONE = '03426522787';

const FEATURES = [
  { icon: Leaf,    label: 'Fresh Ingredients',  sub: 'Valley to table' },
  { icon: Award,   label: 'Expert Chefs',        sub: 'Passionate & experienced' },
  { icon: '🏔️',   label: 'Mountain Ambiance',   sub: 'Chitral Valley charm' },
  { icon: Bike,    label: 'Fast Delivery',       sub: 'On time, every time' },
];

export default function Home() {
  const { t, language } = useApp();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocality, setSelectedLocality] = useState('All Localities');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCategory, selectedLocality, sortBy]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      let url = `/api/restaurants?sort=${sortBy}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedLocality !== 'All Localities') url += `&locality=${encodeURIComponent(selectedLocality)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setRestaurants(data.restaurants);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="min-h-screen bg-cream-100">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Split layout (text left | food image right)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-cream-100">

        {/* Decorative botanical blobs */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-cream-200/60 rounded-bl-[120px] pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-32 h-32 bg-gold-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[520px] items-center py-12 lg:py-20">

            {/* Left — Text block */}
            <div className="relative z-10 space-y-6 animate-slide-up">
              <p className="section-eyebrow">{t('heroEyebrow')}</p>

              <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl font-bold text-dark-800 leading-[1.15] tracking-tight">
                {t('heroTitlePart1')}{' '}
                <span className="text-gold-500 italic">{t('heroTitleHighlight')}</span>
                <br />{t('heroTitlePart2')}
              </h1>

              <p className="text-sm sm:text-base text-dark-500 leading-relaxed max-w-md font-normal">
                {t('heroSubtitle')}
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-md bg-white border border-cream-300 text-sm text-dark-800 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent shadow-soft font-medium"
                  />
                </div>
                <button type="submit" className="btn-gold whitespace-nowrap">
                  {t('findFood')}
                </button>
              </form>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a href={`tel:${OFFICIAL_PHONE}`} className="btn-outline-gold text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  {t('bookTable')}
                </a>
                <button
                  onClick={() => document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-outline-gold text-xs"
                >
                  {t('exploreMenu')}
                </button>
              </div>

              {/* Quick Trust Signals */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { val: '7+',    label: t('partnerRestaurants') },
                  { val: '500+',  label: t('menuItemsCount') },
                  { val: '25min', label: t('avgDeliveryTime') },
                ].map(({ val, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-serif text-2xl font-bold text-gold-500">{val}</p>
                    <p className="text-xs text-dark-500 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero food image */}
            <div className="relative lg:flex items-center justify-center hidden">
              <div className="relative w-full max-w-[460px] aspect-square animate-float">
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-300/50 scale-105" />
                <div className="absolute inset-4 rounded-full border border-gold-200/60" />

                <img
                  src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80"
                  alt="Signature Chitral dish"
                  className="w-full h-full object-cover rounded-full shadow-[0_20px_80px_-20px_rgba(139,98,48,0.35)] border-4 border-white"
                />

                {/* Floating badge — rating */}
                <div className="absolute bottom-8 -left-4 bg-white rounded-xl shadow-elevated px-4 py-3 flex items-center gap-2.5 border border-cream-200 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-dark-800">Top Rated</p>
                    <p className="text-[10px] text-dark-500">4.9 · 200+ reviews</p>
                  </div>
                </div>

                {/* Floating badge — delivery */}
                <div className="absolute top-10 -right-4 bg-white rounded-xl shadow-elevated px-4 py-3 flex items-center gap-2.5 border border-cream-200 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
                    <Bike className="w-4 h-4 text-gold-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-dark-800">Fast Delivery</p>
                    <p className="text-[10px] text-dark-500">20–35 min dispatch</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CATEGORY CIRCLES — "OUR MENU CATEGORIES"
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-dark-800">Our Menu Categories</h2>
            <div className="gold-divider mt-3">
              <span className="text-gold-500 text-sm">👑</span>
            </div>
          </div>

          <div className="flex items-start justify-center gap-6 sm:gap-10 overflow-x-auto pb-4 scrollbar-none flex-wrap sm:flex-nowrap">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`category-circle flex-shrink-0 ${isActive ? 'active' : ''}`}
                >
                  <div className="ring">
                    <img src={cat.img} alt={cat.label} />
                  </div>
                  <span
                    className={`text-xs font-semibold text-center leading-tight max-w-[80px] transition-colors ${
                      isActive ? 'text-gold-600 font-bold' : 'text-dark-600'
                    }`}
                  >
                    {t(cat.key) || cat.label}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          RESTAURANT / DINING LISTINGS — "CHEF'S RECOMMENDATIONS"
      ═══════════════════════════════════════════════════════════════ */}
      <section id="restaurants" className="py-16 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-dark-800">
              {selectedCategory === 'All' ? "Chef's Recommendations" : selectedCategory}
            </h2>
            <div className="gold-divider mt-3">
              <span className="text-gold-500 text-sm">👑</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-xl border border-cream-300 p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-500 shrink-0" />
              <span className="text-xs font-bold text-dark-700">Locality:</span>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="text-xs font-semibold text-dark-800 bg-cream-100 border border-cream-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400 cursor-pointer"
              >
                {QASHQAR_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-dark-500" />
              <span className="text-xs font-bold text-dark-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold text-dark-800 bg-cream-100 border border-cream-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400 cursor-pointer"
              >
                <option value="rating">Top Rated ⭐</option>
                <option value="delivery_time">Fastest Delivery</option>
                <option value="delivery_fee">Lowest Delivery Fee</option>
              </select>

              <span className="text-xs font-semibold text-dark-500 bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-200 ml-2">
                {restaurants.length} {restaurants.length === 1 ? 'Eatery' : 'Eateries'}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-cream-200">
                  <div className="h-52 bg-cream-200" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-cream-200 rounded w-3/4" />
                    <div className="h-3 bg-cream-200 rounded w-1/2" />
                    <div className="h-3 bg-cream-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-200 p-16 text-center shadow-soft">
              <div className="text-5xl mb-4">🍽️</div>
              <h3 className="font-serif text-xl font-bold text-dark-800">No Dining Spots Found</h3>
              <p className="text-sm text-dark-500 mt-2 max-w-sm mx-auto">
                Try resetting your filters to discover all restaurants in Qashqar Valley.
              </p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedLocality('All Localities'); setSearchQuery(''); }}
                className="btn-gold mt-6 mx-auto"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {restaurants.map((restaurant, idx) => (
                <Link
                  key={restaurant._id}
                  href={`/restaurant/${restaurant._id}`}
                  className="group bg-white rounded-2xl border border-cream-200 hover:border-gold-400/60 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Banner */}
                  <div className="relative h-52 overflow-hidden bg-cream-200 flex-shrink-0">
                    <img
                      src={restaurant.bannerImage}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-800/60 via-transparent to-transparent" />

                    {/* Bestseller badge (for first 2) */}
                    {idx < 2 && (
                      <span className="absolute top-3 left-3 badge-gold">
                        {idx === 0 ? '🏆 Bestseller' : '✨ New'}
                      </span>
                    )}

                    {/* Rating */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-500 text-white font-bold text-xs shadow">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span>{restaurant.rating?.toFixed(1) || '4.8'}</span>
                      <span className="text-white/80 font-normal text-[10px]">({restaurant.reviewCount || 140}+)</span>
                    </div>

                    {/* Delivery time */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800/70 backdrop-blur-sm text-white font-semibold text-xs">
                      <Clock className="w-3 h-3 text-gold-300" />
                      <span>{restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax}m</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-dark-800 group-hover:text-gold-600 transition-colors leading-tight">
                        {restaurant.name}
                      </h3>

                      <p className="text-xs text-dark-500 mt-1.5 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-gold-500 shrink-0" />
                        <span className="truncate">{restaurant.address}</span>
                      </p>

                      <p className="text-xs text-dark-500 mt-2 line-clamp-2 leading-relaxed">
                        {restaurant.description}
                      </p>

                      {/* Cuisine tags */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {restaurant.cuisineTags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] font-semibold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="mt-4 pt-3.5 border-t border-cream-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-dark-600 font-semibold">
                        <Bike className="w-3.5 h-3.5 text-gold-500" />
                        <span>Delivery: <b className="text-dark-800">Rs. {restaurant.deliveryFee}</b></span>
                      </div>
                      <span className="text-gold-600 font-bold flex items-center gap-0.5 group-hover:gap-2 transition-all">
                        Order Now <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROMO BANNER — "Get 20% Off On Your First Order"
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-promo py-20 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <p className="section-eyebrow text-gold-400 mb-3">Special Offer</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
            Get 20% Off On Your First Order
          </h2>
          <p className="text-sm text-white/70 mt-3 mb-8">
            Use code <span className="font-bold text-gold-400">QFH20</span> at checkout. Valid for all restaurants in Chitral Valley.
          </p>
          <a href={`tel:${OFFICIAL_PHONE}`} className="btn-gold text-sm px-8 py-3.5 inline-flex">
            <Phone className="w-4 h-4" />
            Order Now: {OFFICIAL_PHONE}
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES BAR — Fresh Ingredients / Expert Chefs / etc.
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-t border-cream-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gold-50 border border-gold-100 flex items-center justify-center">
                  {typeof Icon === 'string' ? (
                    <span className="text-2xl">{Icon}</span>
                  ) : (
                    <Icon className="w-6 h-6 text-gold-500" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <p className="font-serif font-bold text-sm text-dark-800">{label}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
