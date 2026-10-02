import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Plus, 
  ShoppingBag, 
  ArrowUpRight, 
  Check, 
  HelpCircle,
  Compass,
  MapPin,
  ExternalLink
} from 'lucide-react';

const SUGGESTED_CHIPS = [
  '🥟 Where can I get Mantou?',
  '🐟 Fresh River Trout in Chitral',
  '🍲 Shinwari Mutton Karahi',
  '📞 Rider Hotline: 03426522787',
  '💰 Dishes under Rs. 800',
  '💳 Payment & Delivery Areas'
];

export default function QfhGptWidget() {
  const { addToCart, setIsCartOpen } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState(new Set());
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Salaam! I'm **QFH GPT**, developed by **Khushwaqt Developers** as your official AI guide to dining across **Qashqar (Chitral Valley)**.\n\nAsk me about traditional delicacies like *Mantou*, *River Trout*, or *Ghalmandi*, fast-food, or connect with our rider dispatch hotline at **03426522787**!",
      dishes: [],
      quickActions: []
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || loading) return;

    // Add user message
    const userMsg = { role: 'user', text: message };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/qfh-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages.slice(-4),
        }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || "I'm here to help you explore dining across Qashqar!",
          dishes: data.dishes || [],
          quickActions: data.quickActions || [],
          supportPhone: data.supportPhone || '03426522787'
        }
      ]);
    } catch (err) {
      console.error('QFH GPT failed:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I couldn't reach the database, but our live rider desk is available at **03426522787** for instant support!",
          dishes: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDishToCart = (dish) => {
    const restaurantObj = dish.restaurant?._id ? {
      _id: dish.restaurant._id,
      name: dish.restaurant.name,
      locality: dish.restaurant.locality,
      deliveryFee: dish.restaurant.deliveryFee || 120,
    } : {
      _id: 'default_rest',
      name: dish.restaurant?.name || 'Qashqar Eatery',
      locality: 'Qashqar Town',
      deliveryFee: 120,
    };

    addToCart(dish, restaurantObj);
    setAddedItems(prev => new Set(prev).add(dish._id));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(dish._id);
        return next;
      });
    }, 1500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-full shadow-2xl hover:shadow-emerald-900/40 border border-emerald-400/30 hover:scale-105 active:scale-95 transition-all"
          title="Open QFH GPT AI Food Guide & Support"
        >
          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-emerald-950 animate-spin" />
          </div>
          <div className="text-left pr-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-tight">QFH GPT</span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded">
                AI
              </span>
            </div>
            <span className="text-[10px] text-emerald-200 block font-medium">
              Search Dishes & Support
            </span>
          </div>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                🏔️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm tracking-tight text-white">QFH GPT</h3>
                  <span className="text-[10px] bg-emerald-700/80 text-emerald-100 font-bold px-1.5 py-0.5 rounded">
                    Qashqar AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                  <span>Helpline:</span>
                  <a href="tel:03426522787" className="font-bold underline text-amber-300 hover:text-amber-200">
                    03426522787
                  </a>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-800 text-white font-medium rounded-tr-xs shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Quick Actions if any */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                    {msg.quickActions.map((action, aIdx) => (
                      action.action?.startsWith('tel:') || action.action?.startsWith('http') ? (
                        <a
                          key={aIdx}
                          href={action.action}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {action.label}
                        </a>
                      ) : (
                        <button
                          key={aIdx}
                          onClick={() => handleSendMessage(action.query || action.label)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
                        >
                          {action.label}
                        </button>
                      )
                    ))}
                  </div>
                )}

                {/* INLINE DISH PRODUCT CARDS */}
                {msg.dishes && msg.dishes.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[95%]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                      Matched Dishes in Qashqar:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.dishes.map((dish) => {
                        const isAdded = addedItems.has(dish._id);
                        return (
                          <div
                            key={dish._id}
                            className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-500/50 transition-colors"
                          >
                            {dish.image && (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-slate-900 truncate">
                                {dish.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 truncate">
                                {dish.restaurant?.name} • {dish.restaurant?.locality}
                              </p>
                              <span className="text-xs font-black text-emerald-700 block mt-0.5">
                                Rs. {dish.price}
                              </span>
                            </div>

                            <button
                              onClick={() => handleAddDishToCart(dish)}
                              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3" /> Added
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" /> Add
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-2 rounded-xl border border-slate-200 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>QFH GPT is searching Qashqar kitchens...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-1.5">
            {SUGGESTED_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input & Send Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about Mantou, Trout, Karahi, or dial 03426522787..."
              className="flex-1 text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Hotline Bar */}
          <div className="px-3.5 py-1.5 bg-slate-100 text-slate-600 text-[10px] flex items-center justify-between border-t border-slate-200">
            <span className="flex items-center gap-1 font-semibold">
              <Phone className="w-3 h-3 text-emerald-700 inline" /> Hotline:
              <a href="tel:03426522787" className="text-emerald-800 font-extrabold hover:underline">
                03426522787
              </a>
            </span>
            <span className="text-[9px] text-slate-500 font-bold">
              Built by <span className="text-qashqar-900 font-extrabold">Khushwaqt Developers</span>
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
