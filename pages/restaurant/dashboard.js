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
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Calendar,
  Check,
  Wand2
} from 'lucide-react';

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, socket, t, language } = useApp();

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

  // Photograph & AI Photoshoot Studio states
  const [dishPhoto, setDishPhoto] = useState('');
  const [photoTab, setPhotoTab] = useState('ai'); // 'upload' | 'ai'
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiStyle, setAiStyle] = useState('gourmet_studio');

  // Edit photo for existing dish
  const [editingPhotoItem, setEditingPhotoItem] = useState(null);
  const [editingDishPhoto, setEditingDishPhoto] = useState('');
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  // Redirect if not logged in or missing permissions
  useEffect(() => {
    // Wait for client-side to check localStorage or context
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  // Load all restaurants
  useEffect(() => {
    if (!user) return; // Don't fetch if no user

    async function loadRestaurants() {
      try {
        const res = await fetch('/api/restaurants');
        const data = await res.json();
        if (data.success && data.restaurants.length > 0) {
          let visibleRestaurants = data.restaurants;
          
          // Only show owner's own restaurant unless they are an admin
          if (user?.role === 'restaurant_owner' && user.restaurantId) {
            visibleRestaurants = data.restaurants.filter(r => r._id === user.restaurantId);
          }
          
          setRestaurants(visibleRestaurants);
          // Match query param or owner restaurant or default
          const queryRestId = router.query.restaurantId;
          const matched = visibleRestaurants.find(r => r._id === queryRestId || r._id === user?.restaurantId) || visibleRestaurants[0];
          setSelectedRestaurant(matched);
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      }
    }
    loadRestaurants();
  }, [router.query.restaurantId, user?.restaurantId]);

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

  const handlePhotoUpload = (e, forEditing = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (forEditing) {
          setEditingDishPhoto(reader.result);
        } else {
          setDishPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAiPhotoshoot = async (forEditing = false) => {
    const dishToUse = forEditing ? editingPhotoItem?.name : newDishName;
    const catToUse = forEditing ? editingPhotoItem?.category : newDishCategory;
    const descToUse = forEditing ? editingPhotoItem?.description : newDishDescription;

    if (!dishToUse) {
      alert('Please enter a dish name first (e.g. Special Chicken Tikka Pizza)');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/photoshoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dishToUse,
          category: catToUse,
          description: descToUse,
          style: aiStyle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data);
        if (forEditing) {
          setEditingDishPhoto(data.primaryPhoto);
        } else {
          setDishPhoto(data.primaryPhoto);
        }
      }
    } catch (err) {
      console.error('AI photoshoot error:', err);
    } finally {
      setIsGeneratingAi(false);
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
          image: dishPhoto || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems([data.item, ...menuItems]);
        setIsAddDishOpen(false);
        setNewDishName('');
        setNewDishPrice('');
        setNewDishDescription('');
        setDishPhoto('');
        setAiResult(null);
      }
    } catch (err) {
      console.error('Failed to create dish:', err);
    }
  };

  const handleSaveEditedPhoto = async () => {
    if (!editingPhotoItem?._id || !editingDishPhoto) return;
    setIsUpdatingPhoto(true);
    try {
      const res = await fetch(`/api/restaurants/${selectedRestaurant._id}/menu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingPhotoItem._id,
          image: editingDishPhoto,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems(menuItems.map(i => i._id === editingPhotoItem._id ? data.item : i));
        setEditingPhotoItem(null);
        setEditingDishPhoto('');
        setAiResult(null);
      }
    } catch (err) {
      console.error('Failed to update dish photo:', err);
    } finally {
      setIsUpdatingPhoto(false);
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

  // While redirect to /login is in-flight, show nothing (prevents crash on user=null)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400 text-sm font-semibold">Redirecting…</p>
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
            {/* Restaurant Selector */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <Store className="w-4 h-4 text-amber-400" />
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

                          {/* Pre-Order Scheduled Alert for Kitchen */}
                          {order.isScheduled && (
                            <div className="mb-3 p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 flex items-center justify-between text-[11px] font-bold shadow-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>📅 PRE-ORDER: {order.scheduledDate || 'Upcoming'}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-amber-300 text-slate-950 font-black text-[10px]">
                                {order.scheduledTimeSlot || 'Lunch'}
                              </span>
                            </div>
                          )}

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
                      <th className="px-6 py-3">Photo</th>
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
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => {
                                setEditingPhotoItem(item);
                                setEditingDishPhoto(item.image || '');
                                setAiResult(null);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200 flex items-center gap-1 transition-all"
                              title="Update Photo with AI Photoshoot or Upload"
                            >
                              <Camera className="w-3 h-3 text-amber-600" />
                              <span>Photo</span>
                            </button>
                          </div>
                        </td>
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

                    {/* PHOTOGRAPH SECTION: UPLOAD OR AI GENERATE */}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{t('dishPhotoOption')}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {dishPhoto ? '✓ Photo Ready' : 'AI Photoshoot or Upload'}
                        </span>
                      </div>

                      {/* Dual Mode Switcher Tabs */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-3">
                        <button
                          type="button"
                          onClick={() => setPhotoTab('ai')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                            photoTab === 'ai'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('aiPhotoshootTab')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPhotoTab('upload')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                            photoTab === 'upload'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t('uploadPhotoTab')}</span>
                        </button>
                      </div>

                      {/* TAB 1: AI STUDIO PHOTOSHOOT */}
                      {photoTab === 'ai' && (
                        <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5 mb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-extrabold text-amber-950 block">
                                {t('aiPhotoshootTab')} Studio
                              </span>
                              <p className="text-[11px] text-amber-800">
                                {t('aiPhotoshootPrompt')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-amber-900 mb-1">
                                {t('photoStylePreset')}
                              </label>
                              <select
                                value={aiStyle}
                                onChange={(e) => setAiStyle(e.target.value)}
                                className="w-full text-xs px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white text-slate-800 font-medium"
                              >
                                <option value="gourmet_studio">{t('styleGourmet')}</option>
                                <option value="mountain_rustic">{t('styleMountainRustic')}</option>
                                <option value="dark_luxury">{t('styleDarkMoody')}</option>
                                <option value="top_down_flatlay">{t('styleTopDown')}</option>
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => handleGenerateAiPhotoshoot(false)}
                                disabled={isGeneratingAi || !newDishName}
                                className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>{isGeneratingAi ? t('generatingAiPhoto') : t('generateWithAi')}</span>
                              </button>
                            </div>
                          </div>

                          {/* AI Photoshoot Results & Angles */}
                          {aiResult?.variations && (
                            <div className="pt-2 border-t border-amber-200 space-y-2">
                              <span className="text-[10px] font-black uppercase text-amber-900 block">
                                Select Photo Angle / Variation:
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                {aiResult.variations.map((v, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setDishPhoto(v.url)}
                                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                                      dishPhoto === v.url
                                        ? 'border-emerald-600 ring-2 ring-emerald-400'
                                        : 'border-amber-200 hover:border-amber-400'
                                    }`}
                                  >
                                    <img src={v.url} alt={v.angle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] font-bold p-1 text-center truncate">
                                      {v.angle}
                                    </span>
                                    {dishPhoto === v.url && (
                                      <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[10px]">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 2: UPLOAD PHOTO */}
                      {photoTab === 'upload' && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 mb-3">
                          <p className="text-[11px] text-slate-600 font-medium">
                            {t('uploadPhotoPrompt')}
                          </p>

                          <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all">
                              <Upload className="w-3.5 h-3.5 text-slate-500" />
                              <span>Upload Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, false)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                              Or Paste Image Link
                            </label>
                            <input
                              type="url"
                              value={dishPhoto}
                              onChange={(e) => setDishPhoto(e.target.value)}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-xl bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Live Selected Photo Preview */}
                      {dishPhoto && (
                        <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-emerald-300 shrink-0 shadow-xs">
                            <img src={dishPhoto} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase text-emerald-800 px-2 py-0.5 rounded bg-emerald-200/80 inline-block mb-0.5">
                              {t('photoReady')}
                            </span>
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {newDishName || 'Dish Photo Preview'}
                            </p>
                            <p className="text-[10px] text-slate-500">Ready to save on menu</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDishPhoto('')}
                            className="text-[11px] text-red-600 hover:underline font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
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

            {/* EDIT DISH PHOTO MODAL (FOR EXISTING ITEMS) */}
            {editingPhotoItem && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Product Studio</span>
                      <h3 className="font-extrabold text-base text-slate-900">
                        Update Photo: {editingPhotoItem.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => { setEditingPhotoItem(null); setEditingDishPhoto(''); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Dual Mode Switcher Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPhotoTab('ai')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        photoTab === 'ai'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('aiPhotoshootTab')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhotoTab('upload')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        photoTab === 'upload'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('uploadPhotoTab')}</span>
                    </button>
                  </div>

                  {/* TAB 1: AI STUDIO PHOTOSHOOT */}
                  {photoTab === 'ai' && (
                    <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
                      <p className="text-[11px] text-amber-800">
                        Generate a fresh professional studio photoshoot for <b>{editingPhotoItem.name}</b>:
                      </p>

                      <div className="flex gap-2">
                        <select
                          value={aiStyle}
                          onChange={(e) => setAiStyle(e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white"
                        >
                          <option value="gourmet_studio">{t('styleGourmet')}</option>
                          <option value="mountain_rustic">{t('styleMountainRustic')}</option>
                          <option value="dark_luxury">{t('styleDarkMoody')}</option>
                          <option value="top_down_flatlay">{t('styleTopDown')}</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleGenerateAiPhotoshoot(true)}
                          disabled={isGeneratingAi}
                          className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>{isGeneratingAi ? 'Generating...' : 'Generate'}</span>
                        </button>
                      </div>

                      {/* AI Variations */}
                      {aiResult?.variations && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200">
                          {aiResult.variations.map((v, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setEditingDishPhoto(v.url)}
                              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                                editingDishPhoto === v.url
                                  ? 'border-emerald-600 ring-2 ring-emerald-400'
                                  : 'border-amber-200 hover:border-amber-400'
                              }`}
                            >
                              <img src={v.url} alt={v.angle} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[8px] font-bold p-0.5 text-center truncate">
                                {v.angle}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: UPLOAD PHOTO */}
                  {photoTab === 'upload' && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                      <label className="cursor-pointer w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload Photograph File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, true)}
                          className="hidden"
                        />
                      </label>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                          Or Direct Image URL
                        </label>
                        <input
                          type="url"
                          value={editingDishPhoto}
                          onChange={(e) => setEditingDishPhoto(e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Photo Preview */}
                  {editingDishPhoto && (
                    <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-emerald-300 shrink-0 shadow-xs">
                        <img src={editingDishPhoto} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase text-emerald-800 px-2 py-0.5 rounded bg-emerald-200/80 inline-block mb-0.5">
                          New Photo Selected
                        </span>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {editingPhotoItem.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setEditingPhotoItem(null); setEditingDishPhoto(''); }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditedPhoto}
                      disabled={isUpdatingPhoto || !editingDishPhoto}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isUpdatingPhoto ? 'Updating...' : 'Save New Photo'}</span>
                    </button>
                  </div>
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
