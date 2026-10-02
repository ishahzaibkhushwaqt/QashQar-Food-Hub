import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  MapPin, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  ChefHat, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CHITRAL_LOCALITY_PRESETS = [
  { name: 'Ataliq Bazaar, Chitral Town', lat: 35.8510, lng: 71.7864 },
  { name: 'Singoor (River Side & Suspension Bridge)', lat: 35.8655, lng: 71.7942 },
  { name: 'Bypass Road & Airport Sector', lat: 35.8450, lng: 71.7780 },
  { name: 'Main Shahi Bazaar & Polo Ground', lat: 35.8525, lng: 71.7872 },
  { name: 'Garam Chashma Road (Lower)', lat: 35.8720, lng: 71.7810 },
  { name: 'Birmugh Lasht Road', lat: 35.8610, lng: 71.7700 },
];

const CATEGORIES = [
  'Traditional Chitrali',
  'Fast Food & Pizzeria',
  'Hotel & Fine Dining',
  'BBQ & Karahi',
  'Fast Food & Cafe',
  'Continental & Traditional',
  'Cafe'
];

export default function RestaurantOnboardPage() {
  const router = useRouter();
  const { setUser } = useApp();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Traditional Chitrali');
  const [locality, setLocality] = useState(CHITRAL_LOCALITY_PRESETS[0].name);
  const [lat, setLat] = useState(CHITRAL_LOCALITY_PRESETS[0].lat);
  const [lng, setLng] = useState(CHITRAL_LOCALITY_PRESETS[0].lng);
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(120);
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80');
  const [logoImage, setLogoImage] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80');

  // Owner credentials
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('pass1234');
  const [ownerPhone, setOwnerPhone] = useState('+92 345 1122334');

  // Starter dishes
  const [dishes, setDishes] = useState([
    { name: '', price: '', category: 'Karahi', description: '', tags: ['Local Special'] }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLocalitySelect = (e) => {
    const locName = e.target.value;
    setLocality(locName);
    const matched = CHITRAL_LOCALITY_PRESETS.find(p => p.name === locName);
    if (matched) {
      setLat(matched.lat);
      setLng(matched.lng);
    }
  };

  const handleAddDish = () => {
    setDishes([...dishes, { name: '', price: '', category: 'Karahi', description: '', tags: ['Popular'] }]);
  };

  const handleRemoveDish = (index) => {
    setDishes(dishes.filter((_, idx) => idx !== index));
  };

  const handleDishChange = (index, field, value) => {
    const updated = [...dishes];
    updated[index][field] = value;
    setDishes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !ownerEmail) {
      setError('Restaurant name, street address, and owner email are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const filteredDishes = dishes.filter(d => d.name && d.price);

      const res = await fetch('/api/restaurants/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          category,
          address,
          locality,
          lat,
          lng,
          deliveryFee,
          bannerImage,
          logoImage,
          ownerName,
          ownerEmail,
          ownerPassword,
          ownerPhone,
          initialDishes: filteredDishes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Onboarding failed');
      }

      // Save user & token
      if (data.owner && data.token) {
        setUser(data.owner);
        localStorage.setItem('cfh_user', JSON.stringify(data.owner));
        localStorage.setItem('cfh_token', data.token);
        document.cookie = `cfh_token=${data.token}; path=/;`;
      }

      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (cErr) {}

      // Redirect directly to the KDS dashboard for this restaurant
      router.push(`/restaurant/dashboard?restaurantId=${data.restaurant._id}`);
    } catch (err) {
      console.error('Onboarding submit error:', err);
      setError(err.message || 'Failed to onboard restaurant.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8 text-center sm:text-left border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
          <Store className="w-3.5 h-3.5" /> Vendor Self-Service Registration
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Onboard Your Restaurant / Hotel in Chitral
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Join Chitral Food Hub to receive live digital orders, automated kitchen tickets, and smart AI rider dispatch across Chitral Valley.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: BUSINESS PROFILE */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-700" />
            1. Restaurant & Hotel Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restaurant / Hotel Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pamir View Dining"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Short Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Authentic River Trout & Mountain Mutton Karahi"
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Specialties
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your kitchen heritage, wood-fire preparation, or signature dishes..."
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 2: CHITRAL LOCATION & GEOLOCATION */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-700" />
            2. Chitral Valley Location & Coordinates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Locality / Sector Preset *
              </label>
              <select
                value={locality}
                onChange={handleLocalitySelect}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              >
                {CHITRAL_LOCALITY_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Exact Street / Commercial Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 4, Main Ataliq Bazaar, Near River Bridge"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Latitude (AI Dispatch)
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Longitude (AI Dispatch)
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Local Delivery Fee (PKR)
              </label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseInt(e.target.value, 10))}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: OWNER CREDENTIALS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-emerald-700" />
            3. Hotel / Restaurant Owner Credentials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner / General Manager Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Masood Ali"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Login Email *
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@pamirview.com"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: INITIAL MENU BUILDER */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                4. Initial Menu Dishes (Optional)
              </h2>
              <p className="text-xs text-slate-500">
                You can add more items or adjust pricing anytime via your Kitchen Dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDish}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Dish
            </button>
          </div>

          <div className="space-y-3">
            {dishes.map((dish, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Dish Name (e.g. Special Beef Mantou)"
                    value={dish.name}
                    onChange={(e) => handleDishChange(idx, 'name', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <input
                    type="number"
                    placeholder="Price (PKR)"
                    value={dish.price}
                    onChange={(e) => handleDishChange(idx, 'price', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={dish.category}
                    onChange={(e) => handleDishChange(idx, 'category', e.target.value)}
                    className="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Karahi">Karahi</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Trout & Fish">Trout & Fish</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="BBQ">BBQ</option>
                    <option value="Beverages">Beverages</option>
                  </select>

                  {dishes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDish(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center gap-2 active:scale-95 transition-all"
          >
            {submitting ? (
              <span>Registering Business...</span>
            ) : (
              <>
                <span>Complete Onboarding & Enter Kitchen KDS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
