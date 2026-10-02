import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Bike, 
  Store, 
  ChefHat, 
  PackageCheck, 
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

const LiveTrackingMap = dynamic(() => import('../../components/LiveTrackingMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-72 bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-bold text-xs">
      Loading Chitral Valley GPS Map...
    </div>
  )
});

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Clock, desc: 'Sent to restaurant kitchen' },
  { key: 'accepted', label: 'Accepted', icon: Store, desc: 'Kitchen acknowledged order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, desc: 'Chef cooking fresh dishes' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Bike, desc: 'Chitral rider on the road' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { socket, t, language } = useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Socket.io Real-time listener for this order
    if (socket) {
      socket.emit('join_order', id);

      const handleUpdate = (updatedOrder) => {
        if (updatedOrder._id === id || updatedOrder.orderNumber === id) {
          setOrder(updatedOrder);
        }
      };

      socket.on('order:status_update', handleUpdate);

      return () => {
        socket.off('order:status_update', handleUpdate);
      };
    }
  }, [id, socket]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">We could not locate this order in Chitral Food Hub.</p>
        <Link href="/" className="mt-4 inline-block px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  // Calculate current stage index
  let currentStepIdx = 0;
  if (order.status === 'accepted') currentStepIdx = 1;
  else if (order.status === 'preparing') currentStepIdx = 2;
  else if (order.status === 'ready_for_pickup') currentStepIdx = 2;
  else if (order.status === 'out_for_delivery') currentStepIdx = 3;
  else if (order.status === 'delivered') currentStepIdx = 4;

  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Back & Order Number */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dining
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Order ID:</span>
          <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
            #{order.orderNumber}
          </span>
        </div>
      </div>

      {/* Pre-Order Scheduled Banner (If order was pre-scheduled) */}
      {order.isScheduled && (
        <div className="mb-6 p-4.5 rounded-3xl bg-gradient-to-r from-amber-50 to-cream-100 border-2 border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-xs">
              📅
            </div>
            <div>
              <span className="font-black text-sm block text-amber-950">
                {t('scheduledForBadge')}: {order.scheduledDate || 'Upcoming Date'}
              </span>
              <span className="text-xs text-amber-800 mt-0.5 block">
                Meal Slot: <b>{order.scheduledTimeSlot || 'Lunch / Dinner'}</b> • Fresh ingredients reserved in advance!
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider self-start sm:self-auto shadow-xs">
            Pre-Order Confirmed
          </span>
        </div>
      )}

      {/* Main Status Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {t('liveTrackingTitle')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 capitalize">
              {isCancelled ? t('cancelled') : (t(order.status) || order.status?.replace(/_/g, ' '))}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Estimated Delivery: <b>{order.prepTimeMinutes || 25}–35 minutes</b> to {order.customerAddress?.locality}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">{t('totalDue')} via {order.paymentMethod}</span>
            <span className="text-2xl font-black text-emerald-800">
              Rs. {order.totalAmount}
            </span>
          </div>
        </div>

        {/* STEPPER PIPELINE */}
        {!isCancelled ? (
          <div className="py-8">
            <div className="grid grid-cols-5 gap-2 relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${(currentStepIdx / 4) * 100}%` }}
                />
              </div>

              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center z-10">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isPassed
                          ? 'bg-emerald-700 text-white ring-4 ring-emerald-100'
                          : 'bg-white text-slate-400 border-2 border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] mt-2 font-bold leading-tight ${isCurrent ? 'text-emerald-800' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {t(step.key) || step.label}
                    </span>
                    <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-red-600 font-bold text-sm">
            This order was cancelled by the kitchen or user.
          </div>
        )}

      </div>

      {/* ── LIVE ORDER TRACKING MAP (Rider ka live location dikhna jaisa Uber mein hota hai) ── */}
      <div className="mb-8">
        <LiveTrackingMap order={order} socket={socket} t={t} />
      </div>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Ordered Items */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6">
          <h3 className="font-bold text-base text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>Ordered Dishes</span>
            <span className="text-xs text-slate-400">({order.items?.length} items)</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">
                    Quantity: <b>{item.quantity}</b> × Rs. {item.price}
                  </p>
                </div>
                <span className="font-extrabold text-slate-900">
                  Rs. {item.quantity * item.price}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Dishes Subtotal</span>
              <span>Rs. {order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Chitral Valley Delivery Fee</span>
              <span>Rs. {order.deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Hospitality Tax (5%)</span>
              <span>Rs. {order.tax}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Paid</span>
              <span className="text-emerald-800">Rs. {order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Delivery Address & Kitchen */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-700" /> Restaurant
            </h3>
            <p className="font-bold text-sm text-slate-900">
              {order.restaurantId?.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {order.restaurantId?.address}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" /> Delivery Address
            </h3>
            <p className="font-bold text-xs text-slate-800">
              {order.customerName} ({order.customerPhone})
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {order.customerAddress?.streetAddress}
            </p>
            <p className="text-xs text-emerald-800 font-bold mt-0.5">
              {order.customerAddress?.locality}
            </p>
            {order.customerAddress?.notes && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-2">
                Note: {order.customerAddress?.notes}
              </p>
            )}
          </div>

          <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-5 text-center">
            <Sparkles className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
            <h4 className="font-bold text-xs text-emerald-900">Live WebSockets Active</h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              This page will automatically advance stages as the kitchen cooks and rider delivers.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
