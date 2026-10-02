import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../../context/AppContext';
import { 
  Star, 
  Clock, 
  MapPin, 
  Bike, 
  Sparkles, 
  Plus, 
  Check, 
  ShoppingBag, 
  ArrowLeft,
  Share2,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, cart, setIsCartOpen, cartItemCount, totalAmount } = useApp();

  const [restaurant, setRestaurant] = useState(null);
  const [categorizedMenu, setCategorizedMenu] = useState({});
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedItemIds, setAddedItemIds] = useState(new Set());

  useEffect(() => {
    if (!id) return;

    async function fetchRestaurantDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        const data = await res.json();
        if (data.success) {
          setRestaurant(data.restaurant);
          setCategorizedMenu(data.categorizedMenu || {});
          const categories = Object.keys(data.categorizedMenu || {});
          if (categories.length > 0) {
            setActiveCategory(categories[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurant:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantDetails();
  }, [id]);

  const handleAdd = (item) => {
    addToCart(item, restaurant);
    setAddedItemIds((prev) => new Set(prev).add(item._id));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    }, 1200);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Restaurant Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested dining spot in Chitral could not be located.</p>
        <Link href="/" className="mt-4 inline-block px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold">
          Return to All Eateries
        </Link>
      </div>
    );
  }

  const categories = Object.keys(categorizedMenu);

  return (
    <div className="min-h-screen pb-24">
      
      {/* Back button link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Chitral Dining
        </Link>
      </div>

      {/* RESTAURANT HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <div className="relative rounded-3xl overflow-hidden shadow-lg bg-slate-900 text-white">
          <img
            src={restaurant.bannerImage}
            alt={restaurant.name}
            className="w-full h-64 sm:h-80 object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Banner Details Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white font-extrabold text-xs">
                  {restaurant.category}
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {restaurant.locality}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {restaurant.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                {restaurant.description}
              </p>

              {/* Badges: Rating, Delivery time, Delivery fee */}
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{restaurant.rating?.toFixed(1) || '4.8'}</span>
                  <span className="text-[10px] font-medium text-slate-800">
                    ({restaurant.reviewCount || 140}+ reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax} min</span>
                </div>

                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
                  <Bike className="w-3.5 h-3.5 text-amber-300" />
                  <span>Delivery: Rs. {restaurant.deliveryFee}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS NAVIGATION */}
      <section className="sticky top-18 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 mt-6 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  const el = document.getElementById(`category-${cat}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat} ({categorizedMenu[cat]?.length || 0})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* DISHES LIST BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {categories.map((cat) => (
          <div key={cat} id={`category-${cat}`} className="scroll-mt-36">
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {cat}
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                • {categorizedMenu[cat]?.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categorizedMenu[cat].map((dish) => {
                const isJustAdded = addedItemIds.has(dish._id);
                const isAvailable = dish.isAvailable !== false;

                return (
                  <div
                    key={dish._id}
                    className={`bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                      !isAvailable ? 'opacity-60 bg-slate-50' : ''
                    }`}
                  >
                    <div>
                      {/* Dish Image */}
                      {dish.image && (
                        <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-100">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Local Special Tag */}
                          {dish.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-800/90 text-white font-bold text-[10px] backdrop-blur-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900">
                          {dish.name}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-slate-900">
                          Rs. {dish.price}
                        </span>
                        {!isAvailable && (
                          <span className="block text-[10px] font-bold text-red-600">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAdd(dish)}
                        disabled={!isAvailable}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : isAvailable
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added!
                          </>
                        ) : isAvailable ? (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add to Cart
                          </>
                        ) : (
                          'Unavailable'
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </section>

      {/* FLOATING CART BAR ON MOBILE */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-800 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs">
                {cartItemCount}
              </span>
              <span>View Cart & Checkout</span>
            </div>
            <span>Rs. {totalAmount}</span>
          </button>
        </div>
      )}

    </div>
  );
}
