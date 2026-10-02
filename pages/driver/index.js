import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../../context/AppContext';
import { calculateHaversineDistance } from '../../lib/aiDispatch';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Package, 
  Navigation, 
  Clock, 
  Banknote, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DriverPortal() {
  const router = useRouter();
  const { user, socket } = useApp();

  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    fetchDriversAndOrders();

    if (socket) {
      socket.emit('join_driver_pool');

      const handleOrderCreated = () => fetchOrders();
      const handleStatusUpdate = () => fetchOrders();

      socket.on('order:created', handleOrderCreated);
      socket.on('order:status_update', handleStatusUpdate);

      return () => {
        socket.off('order:created', handleOrderCreated);
        socket.off('order:status_update', handleStatusUpdate);
      };
    }
  }, [socket]);

  const fetchDriversAndOrders = async () => {
    setLoading(true);
    try {
      // Fetch drivers
      const dRes = await fetch('/api/drivers');
      const dData = await dRes.json();
      if (dData.success && dData.drivers.length > 0) {
        setDrivers(dData.drivers);
        setSelectedDriver(dData.drivers[0]); // Default to Karim Ullah
      }

      await fetchOrders();
    } catch (err) {
      console.error('Failed to load driver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const oRes = await fetch('/api/orders?limit=30');
      const oData = await oRes.json();
      if (oData.success) {
        setOrders(oData.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (!selectedDriver) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/drivers/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          driverId: selectedDriver._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh
        await fetchDriversAndOrders();
      } else {
        alert(data.message || 'Could not accept order');
      }
    } catch (err) {
      console.error('Accept order error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateDeliveryStep = async (orderId, nextStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (nextStatus === 'delivered') {
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          } catch (cErr) {}
        }
        await fetchDriversAndOrders();
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDriverStatus = async () => {
    if (!selectedDriver) return;
    const nextStatus = selectedDriver.status === 'available' ? 'offline' : 'available';
    try {
      const res = await fetch('/api/drivers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriver._id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedDriver(data.driver);
        setDrivers(drivers.map(d => d._id === data.driver._id ? data.driver : d));
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Find active in-flight order for this driver
  const activeOrder = orders.find(
    (o) =>
      o.assignedDriverId?._id === selectedDriver?._id &&
      ['out_for_delivery', 'ready_for_pickup'].includes(o.status)
  );

  // Pool of orders needing delivery (status: accepted, preparing, ready_for_pickup) without driver assigned
  const availableOrderPool = orders.filter(
    (o) =>
      !o.assignedDriverId &&
      ['accepted', 'preparing', 'ready_for_pickup'].includes(o.status)
  );

  // While redirect to /login is in-flight, show nothing (prevents crash on user=null)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400 text-sm font-semibold">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 pb-20">
      
      {/* Top Banner */}
      <div className="bg-qashqar-950 text-white py-6 border-b border-qashqar-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-saffron-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">
                  Qashqar Rider Dispatch Portal (QFH)
                </h1>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                  GPS Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time valley delivery dispatch • Dispatch Hotline: <b className="text-saffron-400">03426522787</b>
              </p>
            </div>
          </div>

          {/* Rider Selector & Availability Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:03426522787"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-saffron-500 hover:bg-saffron-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Hotline: 03426522787</span>
            </a>

            <div className="flex items-center gap-2 bg-qashqar-900 px-3 py-1.5 rounded-xl border border-qashqar-700">
              <span className="text-xs text-slate-300 font-bold">Rider:</span>
              <select
                value={selectedDriver?._id || ''}
                onChange={(e) => {
                  const d = drivers.find(x => x._id === e.target.value);
                  setSelectedDriver(d);
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {drivers.map((d) => (
                  <option key={d._id} value={d._id} className="bg-slate-900 text-white">
                    {d.name} ({d.vehicleType} - 03426522787)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleToggleDriverStatus}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedDriver?.status === 'available'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedDriver?.status === 'available' ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              <span>{selectedDriver?.status === 'available' ? 'Online / Available' : 'Offline'}</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* RIDER METRICS ROW */}
        {selectedDriver && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-sand-200 p-4 shadow-soft">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Station & Locality</span>
              <p className="font-extrabold text-sm text-slate-900 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-qashqar-600" />
                {selectedDriver.currentLocation?.localityName || 'Qashqar Town'}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sand-200 p-4 shadow-soft">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Rider Phone & Vehicle</span>
              <p className="font-extrabold text-sm text-slate-900 mt-1 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-saffron-600" />
                03426522787 ({selectedDriver.vehicleType})
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sand-200 p-4 shadow-soft">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Lifetime Deliveries</span>
              <p className="font-extrabold text-sm text-slate-900 mt-1">
                {selectedDriver.totalDeliveries || 95} Orders Delivered
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sand-200 p-4 shadow-soft">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Rider Rating</span>
              <p className="font-extrabold text-sm text-slate-900 mt-1">
                ⭐ {selectedDriver.rating} / 5.0 (Top Valley Rider)
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE ASSIGNED ORDER */}
        {activeOrder ? (
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold">
                  Active In-Flight Delivery
                </span>
                <h2 className="text-2xl font-black mt-2">
                  Order #{activeOrder.orderNumber}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Current Status: <b className="uppercase text-amber-400">{activeOrder.status?.replace(/_/g, ' ')}</b>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block">Collect from Customer:</span>
                <span className="text-2xl font-black text-amber-400">
                  Rs. {activeOrder.totalAmount}
                </span>
                <span className="text-[11px] text-slate-400 block">via {activeOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Pickup info */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  1. Restaurant Pickup
                </span>
                <h4 className="text-base font-extrabold text-white mt-1">
                  {activeOrder.restaurantId?.name}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {activeOrder.restaurantId?.address}
                </p>
              </div>

              {/* Delivery info */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  2. Customer Drop-off
                </span>
                <h4 className="text-base font-extrabold text-white mt-1">
                  {activeOrder.customerName} ({activeOrder.customerPhone})
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {activeOrder.customerAddress?.streetAddress}, {activeOrder.customerAddress?.locality}
                </p>
                {activeOrder.customerAddress?.notes && (
                  <p className="text-[11px] text-amber-300 mt-1 italic">
                    Note: "{activeOrder.customerAddress.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Progression Action Controls */}
            <div className="pt-2 flex flex-wrap gap-3">
              {activeOrder.status === 'ready_for_pickup' && (
                <button
                  onClick={() => handleUpdateDeliveryStep(activeOrder._id, 'out_for_delivery')}
                  disabled={isUpdating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <Bike className="w-4 h-4" /> Picked Up & Start Driving
                </button>
              )}

              {activeOrder.status === 'out_for_delivery' && (
                <button
                  onClick={() => handleUpdateDeliveryStep(activeOrder._id, 'delivered')}
                  disabled={isUpdating}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" /> Delivered & Cash Collected (Rs. {activeOrder.totalAmount})
                </button>
              )}

              <a
                href={`tel:${activeOrder.customerPhone}`}
                className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" /> Call Customer
              </a>

              <button
                onClick={() => router.push(`/order/${activeOrder._id}`)}
                className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                View Live Customer Map
              </button>
            </div>
          </div>
        ) : null}

        {/* OPEN ORDER POOL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Chitral Valley Order Dispatch Pool</span>
                <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  {availableOrderPool.length} Ready for Pickup
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proximity calculated using the Haversine formula from {selectedDriver?.currentLocation?.localityName}.
              </p>
            </div>

            <button
              onClick={fetchOrders}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Pool
            </button>
          </div>

          {availableOrderPool.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="text-3xl mb-2">🛵</div>
              <h3 className="text-sm font-bold text-slate-800">No Pending Orders Waiting in Pool</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All restaurant orders in Chitral are currently assigned or completed. When a customer places an order, it will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableOrderPool.map((order) => {
                // Calculate Haversine distance from driver station to restaurant
                const driverLat = selectedDriver?.currentLocation?.lat || 35.8510;
                const driverLng = selectedDriver?.currentLocation?.lng || 71.7864;
                const restLat = order.restaurantId?.location?.lat || 35.8510;
                const restLng = order.restaurantId?.location?.lng || 71.7864;

                const distanceKm = calculateHaversineDistance(driverLat, driverLng, restLat, restLng);
                const estPickupMin = Math.max(3, Math.round((distanceKm / 25) * 60) + 2);

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <span className="font-extrabold text-sm text-slate-900">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Pickup & Drop Details */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Pickup From:
                          </span>
                          <span className="font-bold text-slate-900">
                            {order.restaurantId?.name}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {order.restaurantId?.locality}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Deliver To:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {order.customerName}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {order.customerAddress?.locality}
                          </p>
                        </div>

                        {/* Haversine Proximity Telemetry */}
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between text-[11px]">
                          <span className="text-blue-900 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            AI Proximity:
                          </span>
                          <span className="text-blue-800 font-extrabold">
                            {distanceKm} km (~{estPickupMin} mins away)
                          </span>
                        </div>
                      </div>

                      {/* Dish Summary */}
                      <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span>Items: </span>
                        <span className="font-semibold">
                          {order.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Accept Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Payment ({order.paymentMethod}):</span>
                        <span className="text-sm font-black text-emerald-800">
                          Rs. {order.totalAmount}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAcceptOrder(order._id)}
                        disabled={isUpdating || selectedDriver?.status !== 'available'}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Accept Delivery</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
