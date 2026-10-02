import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../../context/AppContext';
import { playOrderChime } from '../../lib/chime';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bike, 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Store, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, socket } = useApp();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kds'); // 'kds' | 'orders' | 'menu' | 'analytics'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dispatchingOrderId, setDispatchingOrderId] = useState(null);
  const [dispatchResult, setDispatchResult] = useState(null);

  // New Dish Modal / State
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Karahi');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishTags, setNewDishTags] = useState('Popular');

  // Load restaurants — a restaurant_owner only ever sees their own restaurant;
  // only an admin gets the full list with a switcher.
  useEffect(() => {
    async function loadRestaurants() {
      try {
        const res = await fetch('/api/restaurants');
        const data = await res.json();
        if (data.success && data.restaurants.length > 0) {
          const visibleRestaurants =
            user?.role === 'restaurant_owner'
              ? data.restaurants.filter((r) => r._id === user?.restaurantId)
              : data.restaurants;

          setRestaurants(visibleRestaurants);

          if (user?.role === 'restaurant_owner') {
            // Locked to their own restaurant — no switching allowed.
            setSelectedRestaurant(visibleRestaurants[0] || null);
          } else {
            const queryRestId = router.query.restaurantId;
            const matched =
              visibleRestaurants.find((r) => r._id === queryRestId) || visibleRestaurants[0];
            setSelectedRestaurant(matched);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      }
    }
    loadRestaurants();
  }, [router.query.restaurantId, user?.restaurantId, user?.role]);

  // Load orders & menu for selected restaurant
  useEffect(() => {
    if (!selectedRestaurant?._id) return;

    fetchOrders();
    fetchMenuItems();

    // Socket.io real-time connection to restaurant KDS room
    if (socket) {
      socket.emit('join_restaurant', selectedRestaurant._id);

      const handleNewOrder = (newOrder) => {
        if (newOrder.restaurantId?._id === selectedRestaurant._id || newOrder.restaurantId === selectedRestaurant._id) {
          setOrders((prev) => [newOrder, ...prev]);
          if (soundEnabled) {
            playOrderChime();
          }
        }
      };

      const handleStatusUpdate = (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      };

      socket.on('order:created', handleNewOrder);
      socket.on('order:status_update', handleStatusUpdate);

      return () => {
        socket.off('order:created', handleNewOrder);
        socket.off('order:status_update', handleStatusUpdate);
      };
    }
  }, [selectedRestaurant, socket, soundEnabled]);

  const fetchOrders = async () => {
    if (!selectedRestaurant?._id) return;
    try {
      const res = await fetch(`/api/orders?restaurantId=${selectedRestaurant._id}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    if (!selectedRestaurant?._id) return;
    try {
      const res = await fetch(`/api/restaurants/${selectedRestaurant._id}/menu`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, prepTimeMinutes) => {
    try {
      const body = { status: newStatus };
      if (prepTimeMinutes) body.prepTimeMinutes = prepTimeMinutes;

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
      }
    } catch (err) {
      console.error('Update order status error:', err);
    }
  };

  const handleSmartDispatch = async (orderId) => {
    setDispatchingOrderId(orderId);
    setDispatchResult(null);
    try {
      const res = await fetch('/api/drivers/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(data);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
      } else {
        alert(data.message || 'Dispatch failed');
      }
    } catch (err) {
      console.error('Smart dispatch error:', err);
    } finally {
      setDispatchingOrderId(null);
    }
  };

  const handleToggleStock = async (item) => {
    try {
      const res = await fetch(`/api/restaurants/${selectedRestaurant._id}/menu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item._id,
          isAvailable: !item.isAvailable,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) =>
          prev.map((i) => (i._id === item._id ? data.item : i))
        );
      }
    } catch (err) {
      console.error('Stock toggle failed:', err);
    }
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice) return;

    try {
      const res = await fetch(`/api/restaurants/${selectedRestaurant._id}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDishName,
          price: parseFloat(newDishPrice),
          category: newDishCategory,
          description: newDishDescription,
          tags: [newDishTags],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems([data.item, ...menuItems]);
        setIsAddDishOpen(false);
        setNewDishName('');
        setNewDishPrice('');
        setNewDishDescription('');
      }
    } catch (err) {
      console.error('Failed to create dish:', err);
    }
  };

  const handleDeleteDish = async (itemId) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      const res = await fetch(`/api/restaurants/${selectedRestaurant._id}/menu?itemId=${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems(menuItems.filter((i) => i._id !== itemId));
      }
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  // Analytics calculation
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter((o) => ['placed', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)).length;
  const completedOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  // Route guard: only restaurant owners and admins may view this dashboard at all.
  if (user && user.role !== 'restaurant_owner' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-elevated p-8 max-w-md text-center border border-slate-200">
          <Store className="w-10 h-10 text-qashqar-600 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900 mb-1">Restaurant access only</h1>
          <p className="text-sm text-slate-500">
            This dashboard is only available to restaurant owner accounts. Log in with a
            restaurant owner account to manage your kitchen, menu, and orders.
          </p>
        </div>
      </div>
    );
  }

  if (user?.role === 'restaurant_owner' && !loading && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-elevated p-8 max-w-md text-center border border-slate-200">
          <Store className="w-10 h-10 text-qashqar-600 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900 mb-1">No restaurant linked to this account</h1>
          <p className="text-sm text-slate-500">
            Your account isn't linked to a restaurant yet. Contact an admin to get your
            restaurant set up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      
      {/* Top Banner & Restaurant Switcher */}
      <div className="bg-qashqar-950 text-white py-6 border-b border-qashqar-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-saffron-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg">
              👨‍🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">
                  Qashqar Kitchen Display System (QFH KDS)
                </h1>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time kitchen flow & Haversine AI rider dispatch • Support: <b className="text-saffron-400">03426522787</b>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Restaurant Selector — owners are locked to their own restaurant;
                only admins can switch between restaurants. */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <Store className="w-4 h-4 text-amber-400" />
              {user?.role === 'admin' ? (
                <select
                  value={selectedRestaurant?._id || ''}
                  onChange={(e) => {
                    const r = restaurants.find(x => x._id === e.target.value);
                    setSelectedRestaurant(r);
                  }}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id} className="bg-slate-900 text-white">
                      {r.name} ({r.locality})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-white">
                  {selectedRestaurant
                    ? `${selectedRestaurant.name} (${selectedRestaurant.locality})`
                    : 'No restaurant assigned to this account'}
                </span>
              )}
            </div>

            {/* Audio Chime Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Toggle kitchen bell audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
            </button>

            {/* Manual test sound button */}
            <button
              onClick={() => playOrderChime()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              title="Test audio chime"
            >
              🔔 Test Bell
            </button>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('kds')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'kds'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Kitchen KDS View
            {activeOrdersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Incoming Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Menu & Stock Inventory ({menuItems.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Sales Analytics
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dispatch Result Notification Banner */}
        {dispatchResult && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-blue-950">
                  AI Nearest Rider Assigned!
                </p>
                <p className="mt-0.5">{dispatchResult.dispatchMetrics?.aiExplanation}</p>
              </div>
            </div>
            <button
              onClick={() => setDispatchResult(null)}
              className="text-blue-500 hover:text-blue-700 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. KITCHEN DISPLAY SYSTEM (KDS) VIEW */}
        {activeTab === 'kds' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Active Kitchen Orders Board</span>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    {activeOrdersCount} in progress
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-contrast digital view for chefs and preparation staff.
                </p>
              </div>

              <button
                onClick={fetchOrders}
                className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {orders.filter((o) => ['placed', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)).length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3">
                  ✓
                </div>
                <h3 className="text-base font-bold text-slate-800">Kitchen is All Clear!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No active orders waiting for preparation. New orders from customers will appear here automatically with sound alerts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders
                  .filter((o) => ['placed', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status))
                  .map((order) => {
                    const isNew = order.status === 'placed';
                    const isPreparing = order.status === 'preparing';

                    return (
                      <div
                        key={order._id}
                        className={`rounded-3xl border-2 flex flex-col justify-between p-5 shadow-md transition-all ${
                          isNew
                            ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300'
                            : isPreparing
                            ? 'bg-blue-50/70 border-blue-300'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Ticket Header */}
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                            <div>
                              <span className="font-extrabold text-base text-slate-900 block">
                                #{order.orderNumber}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {order.customerName} • {order.customerAddress?.locality}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isNew
                                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                                  : isPreparing
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-white'
                              }`}
                            >
                              {order.status?.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Items Checklist for Kitchen */}
                          <div className="space-y-2 mb-4">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white/90 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <span className="font-black text-emerald-800 text-sm w-6">
                                  {item.quantity}×
                                </span>
                                <span className="flex-1 font-bold text-slate-900">
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.customerAddress?.notes && (
                            <div className="p-2 bg-amber-100/70 rounded-lg text-[11px] text-amber-900 font-medium mb-3">
                              Note: {order.customerAddress.notes}
                            </div>
                          )}
                        </div>

                        {/* Ticket Footer Action Controls */}
                        <div className="pt-3 border-t border-slate-200/80 space-y-2">
                          {isNew && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1 active:scale-95"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Accept Order
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                                className="py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          )}

                          {order.status === 'accepted' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'preparing', 25)}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <ChefHat className="w-4 h-4" /> Start Cooking (25m Timer)
                            </button>
                          )}

                          {isPreparing && (
                            <div className="space-y-2">
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'ready_for_pickup')}
                                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <CheckCircle className="w-4 h-4" /> Mark Ready for Pickup
                              </button>

                              {/* AI Smart Dispatch Trigger */}
                              <button
                                onClick={() => handleSmartDispatch(order._id)}
                                disabled={dispatchingOrderId === order._id}
                                className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {dispatchingOrderId === order._id
                                  ? 'Evaluating Haversine GPS...'
                                  : '🤖 AI Dispatch Nearest Chitral Rider'}
                              </button>
                            </div>
                          )}

                          {order.status === 'ready_for_pickup' && (
                            <button
                              onClick={() => handleSmartDispatch(order._id)}
                              disabled={dispatchingOrderId === order._id}
                              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <Bike className="w-4 h-4" />
                              {dispatchingOrderId === order._id
                                ? 'Connecting Rider...'
                                : '🤖 Dispatch Nearest Rider'}
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 2. ALL ORDERS TABLE */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">
                All Orders History ({orders.length})
              </h3>
              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Order #</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Locality</th>
                    <th className="px-6 py-3">Items</th>
                    <th className="px-6 py-3">Total (PKR)</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        #{o.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{o.customerName}</div>
                        <div className="text-[11px] text-slate-400">{o.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {o.customerAddress?.locality}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {o.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-800">
                        Rs. {o.totalAmount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {o.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/order/${o._id}`)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[11px] font-bold text-slate-700"
                        >
                          View Tracker
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. MENU BUILDER & INVENTORY MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">
                  Dynamic Menu Builder & Inventory Toggle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update prices in PKR and flip items In Stock or Out of Stock with 1-click.
                </p>
              </div>

              <button
                onClick={() => setIsAddDishOpen(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" /> Add New Dish
              </button>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Dish Name</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Price (PKR)</th>
                      <th className="px-6 py-3">Tags</th>
                      <th className="px-6 py-3">Inventory Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menuItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">
                          Rs. {item.price}
                        </td>
                        <td className="px-6 py-4">
                          {item.tags?.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold mr-1">
                              {t}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStock(item)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-colors ${
                              item.isAvailable !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${item.isAvailable !== false ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            <span>{item.isAvailable !== false ? 'In Stock' : 'Out of Stock'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteDish(item._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Remove Dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ADD DISH MODAL */}
            {isAddDishOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Add Dish to {selectedRestaurant?.name} Menu
                  </h3>

                  <form onSubmit={handleCreateDish} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dish Name *</label>
                      <input
                        type="text"
                        required
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        placeholder="e.g. Chitrali Walnut Ghalmandi"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Price in PKR *</label>
                        <input
                          type="number"
                          required
                          value={newDishPrice}
                          onChange={(e) => setNewDishPrice(e.target.value)}
                          placeholder="850"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={newDishCategory}
                          onChange={(e) => setNewDishCategory(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        >
                          <option value="Traditional">Traditional</option>
                          <option value="Karahi">Karahi</option>
                          <option value="Trout & Fish">Trout & Fish</option>
                          <option value="Fast Food">Fast Food</option>
                          <option value="BBQ">BBQ</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Sides & Salads">Sides & Salads</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newDishDescription}
                        onChange={(e) => setNewDishDescription(e.target.value)}
                        placeholder="Ingredients, preparation style..."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Highlight Tag</label>
                      <select
                        value={newDishTags}
                        onChange={(e) => setNewDishTags(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="Popular">Popular</option>
                        <option value="Local Special">Local Special</option>
                        <option value="Chef Choice">Chef Choice</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsAddDishOpen(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                      >
                        Save Dish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 4. SALES & PEAK HOUR ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-xl text-slate-900">
              Kitchen Performance & Sales Insights
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Gross Sales
                </span>
                <span className="text-3xl font-black text-emerald-800 mt-2 block">
                  Rs. {totalRevenue.toLocaleString()}
                </span>
                <p className="text-xs text-slate-500 mt-1">Across all confirmed customer orders</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Deliveries
                </span>
                <span className="text-3xl font-black text-slate-900 mt-2 block">
                  {completedOrdersCount}
                </span>
                <p className="text-xs text-slate-500 mt-1">Fulfilled by Chitral rider pool</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Average Prep Time
                </span>
                <span className="text-3xl font-black text-amber-600 mt-2 block">
                  24 mins
                </span>
                <p className="text-xs text-slate-500 mt-1">From order placement to rider pickup</p>
              </div>
            </div>

            {/* Peak Order Hours Insight */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h4 className="font-extrabold text-base text-slate-900 mb-3">
                Chitral Valley Peak Order Hours
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Dinner Rush (7:00 PM – 10:00 PM)</span>
                    <span className="text-emerald-700">65% of orders</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Lunch & Tea (12:30 PM – 3:30 PM)</span>
                    <span className="text-amber-600">25% of orders</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Late Evening Tea & Desserts (10:00 PM – 11:30 PM)</span>
                    <span className="text-blue-600">10% of orders</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
