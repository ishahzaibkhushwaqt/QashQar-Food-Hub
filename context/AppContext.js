import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { getTranslation } from '../lib/translations';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const [language, setLanguageState] = useState('en');

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('qfh_language', lang);
    } catch (e) {}
  };

  const t = (key) => getTranslation(language, key);

  // Initialize Socket.io and restore persisted user on mount
  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to Chitral Food Hub real-time socket:', socketInstance.id);
    });

    // Listen to global order notifications
    socketInstance.on('order:created', (order) => {
      setActiveNotification({
        title: 'New Order Placed!',
        message: `Order #${order.orderNumber} for Rs. ${order.totalAmount} was placed at ${order.restaurantId?.name || 'Kitchen'}.`,
        type: 'info',
      });
      setTimeout(() => setActiveNotification(null), 5000);
    });

    socketInstance.on('order:status_update', (data) => {
      const displayStatus = data.status?.replace(/_/g, ' ').toUpperCase();
      setActiveNotification({
        title: `Order Update: #${data.orderNumber}`,
        message: `Status changed to: ${displayStatus}`,
        type: 'success',
      });
      setTimeout(() => setActiveNotification(null), 5000);
    });

    // Restore persisted user & cart from localStorage
    try {
      const storedCart = localStorage.getItem('cfh_cart');
      const storedRest = localStorage.getItem('cfh_cart_restaurant');
      const storedUser = localStorage.getItem('cfh_user');
      const storedLang = localStorage.getItem('qfh_language');

      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedRest) setCartRestaurant(JSON.parse(storedRest));
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedLang) setLanguageState(storedLang);
    } catch (e) {
      console.warn('Storage sync error:', e);
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cfh_cart', JSON.stringify(cart));
      if (cartRestaurant) {
        localStorage.setItem('cfh_cart_restaurant', JSON.stringify(cartRestaurant));
      }
    } catch (e) {}
  }, [cart, cartRestaurant]);

  // ─── Cart operations ───────────────────────────────────────────────────────

  const addToCart = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant._id !== restaurant._id && cart.length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart contains items from "${cartRestaurant.name}". Clear your current cart to order from "${restaurant.name}"?`
      );
      if (!confirmSwitch) return;
      setCart([]);
    }

    setCartRestaurant(restaurant);

    setCart((prev) => {
      const existing = prev.find((i) => (i._id || i.id) === (item._id || item.id));
      if (existing) {
        return prev.map((i) =>
          (i._id || i.id) === (item._id || item.id)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const updated = prev.filter((i) => (i._id || i.id) !== itemId);
      if (updated.length === 0) setCartRestaurant(null);
      return updated;
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        (i._id || i.id) === itemId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartRestaurant(null);
    try {
      localStorage.removeItem('cfh_cart');
      localStorage.removeItem('cfh_cart_restaurant');
    } catch (e) {}
  };

  // ─── Auth helpers ──────────────────────────────────────────────────────────

  /**
   * signOut: clears user state and all persisted tokens, then redirects.
   * Pass the Next.js router instance to redirect after sign-out.
   */
  const signOut = (router) => {
    // Clear storage BEFORE updating state so there's no window where the
    // dashboard re-mounts with a null user and crashes.
    try {
      localStorage.removeItem('cfh_user');
      localStorage.removeItem('cfh_token');
      document.cookie = 'cfh_token=; Max-Age=0; path=/;';
    } catch (e) {}

    // Navigate first, then clear the user so the dashboard unmounts cleanly
    if (router) {
      router.push('/login').then(() => setUser(null));
    } else {
      setUser(null);
    }
  };

  // Switch demo user role (kept for development convenience)
  const switchRole = async (role) => {
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('cfh_user', JSON.stringify(data.user));
        localStorage.setItem('cfh_token', data.token);
        document.cookie = `cfh_token=${data.token}; path=/;`;
        return data.user;
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  // ─── Derived cart values ───────────────────────────────────────────────────

  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const deliveryFee = cartRestaurant?.deliveryFee || 120;
  const tax = Math.round(subtotal * 0.05);
  const totalAmount = subtotal > 0 ? subtotal + deliveryFee + tax : 0;
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        cartRestaurant,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        cartItemCount,
        user,
        setUser,
        signOut,
        switchRole,
        socket,
        activeNotification,
        setActiveNotification,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
