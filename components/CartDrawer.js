import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Sparkles, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CHITRAL_LOCALITIES = [
  'Ataliq Bazaar, Chitral Town',
  'Singoor (River Side & Suspension Bridge)',
  'Bypass Road & Airport Area',
  'Main Shahi Bazaar & Polo Ground',
  'Garam Chashma Road (Lower)',
  'Birmugh Lasht Road & Denin',
  'Chew Bridge & Danin Suburb',
  'Bakrabad / Jughoor Sector'
];

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    cartRestaurant,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    tax,
    totalAmount,
    user,
    addToCart,
    t,
    language,
  } = useApp();

  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-order scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('Tomorrow (Kal)');
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('☀️ Lunch (12:30 PM – 01:30 PM)');

  // Checkout form fields
  const [customerName, setCustomerName] = useState(user?.name || 'Sohail Ahmad');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '03426522787');
  const [locality, setLocality] = useState(CHITRAL_LOCALITIES[0]);
  const [streetAddress, setStreetAddress] = useState('House 24, Near Shahi Masjid Road');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'Easypaisa' | 'JazzCash'
  const [walletPhone, setWalletPhone] = useState('+92 345 9876543');

  // Fetch AI complementary recommendations when cart changes
  useEffect(() => {
    if (!isCartOpen || cart.length === 0 || !cartRestaurant?._id) {
      setAiRecommendations([]);
      return;
    }

    async function fetchAiRecommendations() {
      setLoadingAi(true);
      try {
        const res = await fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: cart,
            restaurantId: cartRestaurant._id,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAiRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.warn('AI recommend fetch error:', err);
      } finally {
        setLoadingAi(false);
      }
    }

    fetchAiRecommendations();
  }, [cart, cartRestaurant, isCartOpen]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !streetAddress) {
      setErrorMessage('Please fill in your name, phone, and delivery address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: cartRestaurant._id,
          customerName,
          customerPhone,
          customerAddress: {
            locality,
            streetAddress,
            notes: orderNotes,
          },
          items: cart,
          subtotal,
          deliveryFee,
          paymentMethod,
          isScheduled,
          scheduledDate: isScheduled ? scheduledDate : null,
          scheduledTimeSlot: isScheduled ? scheduledTimeSlot : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place order');
      }

      // Success celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (cErr) {}

      const createdOrder = data.order;
      clearCart();
      setIsCartOpen(false);
      setStep('cart');
      router.push(`/order/${createdOrder._id || createdOrder.orderNumber}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-qashqar-950 to-qashqar-900 text-white flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <span>{step === 'cart' ? 'Your Qashqar Order' : 'QFH Checkout & Delivery'}</span>
              </h2>
              {cartRestaurant && (
                <p className="text-xs text-qashqar-200 mt-0.5">
                  Ordering from: <span className="font-bold text-saffron-400">{cartRestaurant.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (step === 'checkout') setStep('cart');
                else setIsCartOpen(false);
              }}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-3">
                  🍲
                </div>
                <h3 className="font-bold text-slate-800 text-base">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Explore Chitral’s restaurants and traditional dishes like Mantou, Trout, and Lamb Karahi to add items to your basket.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
                >
                  Browse Chitral Dining
                </button>
              </div>
            ) : step === 'cart' ? (
              
              /* CART ITEMS VIEW */
              <div className="space-y-4">
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item._id || item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-emerald-700 font-bold">
                          Rs. {item.price} each
                        </p>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-red-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:text-emerald-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">
                          Rs. {item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear cart action */}
                <div className="flex justify-end">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Cart
                  </button>
                </div>

                {/* EMBEDDED AI MENU RECOMMENDATIONS */}
                {aiRecommendations.length > 0 && (
                  <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200/80 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                      <span>Chitral AI Complementary Suggestions</span>
                    </div>

                    <div className="space-y-2.5">
                      {aiRecommendations.map((rec) => (
                        <div
                          key={rec.item._id}
                          className="p-2.5 bg-white rounded-lg border border-amber-100 shadow-xs flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {rec.badge}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {rec.item.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                              {rec.reasoning}
                            </p>
                            <span className="text-xs font-black text-emerald-700">
                              Rs. {rec.item.price}
                            </span>
                          </div>

                          <button
                            onClick={() => addToCart(rec.item, cartRestaurant)}
                            className="shrink-0 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (

              /* CHECKOUT DETAILS VIEW */
              <form onSubmit={handlePlaceOrder} className="space-y-4">

                {/* ── Scheduled Pre-Orders Section ("Kal ke lunch ka order aaj hi") ── */}
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-cream-100 rounded-2xl border border-amber-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-dark-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gold-600" />
                      {t('orderType')}
                    </span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-gold-500 text-white tracking-wider">
                      {isScheduled ? 'Pre-Order Active' : 'Express Delivery'}
                    </span>
                  </div>

                  {/* Toggle Pills */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-amber-200">
                    <button
                      type="button"
                      onClick={() => setIsScheduled(false)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        !isScheduled
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-dark-600 hover:text-dark-900'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t('deliverNow')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsScheduled(true)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        isScheduled
                          ? 'bg-gold-500 text-white shadow-xs'
                          : 'text-dark-600 hover:text-dark-900'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t('schedulePreOrder')}</span>
                    </button>
                  </div>

                  {/* Scheduled Pre-Order Options Dropdown/Tabs */}
                  {isScheduled && (
                    <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-3 animate-fade-in">
                      <div className="p-2.5 bg-gold-50/80 rounded-xl border border-gold-200 text-[11px] text-gold-900 font-medium leading-relaxed">
                        💡 <b>Chitral Pre-Order Special:</b> {t('scheduleSubtext')}
                      </div>

                      {/* Date Tabs */}
                      <div>
                        <label className="block text-[11px] font-black text-dark-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gold-600" />
                          {t('selectDate')}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'Today', label: t('today') },
                            { id: 'Tomorrow (Kal)', label: t('tomorrow') },
                            { id: 'Day After Tomorrow (Parso)', label: t('dayAfterTomorrow') },
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setScheduledDate(d.id)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                                scheduledDate === d.id
                                  ? 'bg-gold-500 text-white border-gold-500 shadow-xs'
                                  : 'bg-white text-dark-700 border-cream-300 hover:border-gold-300'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Meal Time Slot Selection */}
                      <div>
                        <label className="block text-[11px] font-black text-dark-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gold-600" />
                          {t('selectTimeSlot')}
                        </label>
                        <div className="space-y-1.5">
                          {[
                            { slot: '☀️ Lunch (12:30 PM – 01:30 PM)', label: t('lunchSlot') },
                            { slot: '☀️ Afternoon Lunch (01:30 PM – 02:30 PM)', label: t('afternoonSlot') },
                            { slot: '☕ High Tea & Evening (04:30 PM – 05:30 PM)', label: t('highTeaSlot') },
                            { slot: '🌙 Early Dinner (07:30 PM – 08:30 PM)', label: t('dinnerEarlySlot') },
                            { slot: '🌙 Prime Dinner (08:30 PM – 09:30 PM)', label: t('dinnerPrimeSlot') },
                          ].map((item) => (
                            <button
                              key={item.slot}
                              type="button"
                              onClick={() => setScheduledTimeSlot(item.slot)}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition-all ${
                                scheduledTimeSlot === item.slot
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                                  : 'bg-white border-cream-300 text-dark-700 hover:border-gold-300'
                              }`}
                            >
                              <span>{item.label}</span>
                              {scheduledTimeSlot === item.slot && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="e.g. Sohail Ahmad"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('contactPhone')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="+92 345 1234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('localityLabel')}
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  >
                    {CHITRAL_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('streetAddressLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Near Polo Ground, Ataliq Street 4, House 12"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('specialNotes')}
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Extra mint chutney, leave at gate, ring bell"
                  />
                </div>

                {/* Payment method selection */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t('paymentMethod')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4 mb-1 text-emerald-700" />
                      <div className="text-[11px] leading-tight">Cash on Delivery</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Easypaisa')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        paymentMethod === 'Easypaisa'
                          ? 'border-green-600 bg-green-50 text-green-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mb-1 text-green-600" />
                      <div className="text-[11px] leading-tight">Easypaisa</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('JazzCash')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        paymentMethod === 'JazzCash'
                          ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mb-1 text-red-600" />
                      <div className="text-[11px] leading-tight">JazzCash</div>
                    </button>
                  </div>

                  {paymentMethod !== 'COD' && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                      <p className="font-semibold text-amber-900">
                        {paymentMethod} Direct Wallet Express
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        You will receive an in-app prompt or OTP to approve Rs. {totalAmount}.
                      </p>
                      <input
                        type="text"
                        value={walletPhone}
                        onChange={(e) => setWalletPhone(e.target.value)}
                        className="mt-2 w-full text-xs px-2.5 py-1.5 border border-amber-300 rounded bg-white"
                        placeholder="Easypaisa/JazzCash Mobile Number"
                      />
                    </div>
                  )}
                </div>
              </form>
            )}

          </div>

          {/* Footer with Calculations & CTA */}
          {cart.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>{t('subtotal')}</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  {t('deliveryFee')}
                  <span className="text-[10px] text-emerald-700 font-bold">({locality.split('(')[0].trim()})</span>
                </span>
                <span>Rs. {deliveryFee}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{t('tax')}</span>
                <span>Rs. {tax}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
                <span>{t('totalDue')}</span>
                <span className="text-emerald-800">Rs. {totalAmount}</span>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="mt-3 w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {t('proceedCheckout')} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    {isSubmitting ? (
                      <span>{t('placingOrder')}</span>
                    ) : (
                      <>
                        <span>{t('confirmPlaceOrder')} (Rs. {totalAmount})</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
