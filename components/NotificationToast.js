import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, CheckCircle, Info } from 'lucide-react';

export default function NotificationToast() {
  const { activeNotification, setActiveNotification } = useApp();

  if (!activeNotification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-emerald-100 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900">
            {activeNotification.title}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            {activeNotification.message}
          </p>
        </div>
        <button
          onClick={() => setActiveNotification(null)}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
