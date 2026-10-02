import '../styles/globals.css';
import { AppProvider, useApp } from '../context/AppContext';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import NotificationToast from '../components/NotificationToast';
import QfhGptWidget from '../components/QfhGptWidget';
import Head from 'next/head';
import Link from 'next/link';
import { Phone, MapPin, Mail, Facebook, Instagram, Twitter, Sparkles, ChevronRight } from 'lucide-react';

function AppContent({ Component, pageProps }) {
  const { t, language } = useApp();

  return (
    <div className={`min-h-screen flex flex-col bg-cream-100 text-dark-800 ${language === 'kh' || language === 'ur' ? 'font-sans' : ''}`}>

      {/* ── Thin Top Announcement Bar ──────────────────────────────────── */}
      <div className="bg-dark-800 text-white text-[11px] py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">

          {/* Left — contact details */}
          <div className="flex items-center gap-4 text-cream-300">
            <a href="tel:03426522787" className="flex items-center gap-1.5 hover:text-gold-400 transition-colors font-medium">
              <Phone className="w-3 h-3" />
              +92 342 6522787
            </a>
            <span className="hidden sm:inline text-dark-600">•</span>
            <a href="mailto:hello@qfhchitral.com" className="hidden sm:flex items-center gap-1.5 hover:text-gold-400 transition-colors font-medium">
              <Mail className="w-3 h-3" />
              hello@qfhchitral.com
            </a>
          </div>

          {/* Center — promo message */}
          <span className="hidden md:inline text-cream-300 font-medium tracking-wide">
            {t('announcement')}
          </span>

          {/* Right — social links */}
          <div className="flex items-center gap-3 text-cream-400">
            <span className="text-dark-500 font-medium">{t('followUs')}:</span>
            <a href="#" className="hover:text-gold-400 transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-gold-400 transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
            <a href="#" className="hover:text-gold-400 transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      </div>

      {/* ── Global Navbar ──────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Page Content ───────────────────────────────────────────────── */}
      <main className="flex-1">
        <Component {...pageProps} />
      </main>

      {/* ── Cart Drawer ────────────────────────────────────────────────── */}
      <CartDrawer />

      {/* ── Notifications ──────────────────────────────────────────────── */}
      <NotificationToast />

      {/* ── AI Floating Widget ─────────────────────────────────────────── */}
      <QfhGptWidget />

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER — Dark editorial, multi-column
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-dark-800 text-cream-300">

        {/* Top footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand column */}
            <div className="space-y-4 lg:col-span-1">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-gold-400 text-xl">👑</span>
                  <span className="font-serif font-bold text-xl text-white">
                    Qashqar<span className="text-gold-400">FoodHub</span>
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-dark-400">
                  QFH · Chitral Valley
                </p>
              </div>
              <p className="text-xs text-dark-400 leading-relaxed">
                Celebrating the culinary heritage of Qashqar — connecting homes, hotels, and travellers to authentic mountain dining since 2024.
              </p>
              <a
                href="tel:03426522787"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {t('riderHotline')}: 03426522787
              </a>
            </div>

            {/* Signature Dishes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
                Signature Dishes
              </h4>
              <ul className="space-y-2.5 text-xs text-dark-400">
                {[
                  '🥟 Chitrali Special Mantou',
                  '🐟 Pan-Fried River Trout',
                  '🫓 Ghalmandi Walnut Bread',
                  '🍲 Shinwari Mutton Karahi',
                  '☕ Cardamom Saffron Qawa',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 hover:text-gold-400 transition-colors cursor-pointer">
                    <ChevronRight className="w-3 h-3 text-gold-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform Portals */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
                Platform Portals
              </h4>
              <ul className="space-y-2.5 text-xs text-dark-400">
                {[
                  { label: t('exploreMenu'), href: '/' },
                  { label: t('onboardEatery'), href: '/restaurant/onboard' },
                  { label: t('kitchenKds'), href: '/restaurant/dashboard' },
                  { label: t('riderPortal'), href: '/driver' },
                  { label: t('signIn'), href: '/login' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="flex items-center gap-2 hover:text-gold-400 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 text-gold-600 shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Delivery Coverage */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
                Delivery Coverage
              </h4>
              <p className="text-xs text-dark-400 leading-relaxed mb-4">
                Ataliq Bazaar, Singoor, Suspension Bridge, Bypass Road, Main Shahi Bazaar, Polo Ground, Garam Chashma Road, Birmugh Lasht Road, Chew Bridge, and Danin.
              </p>
              <div className="p-3 rounded-lg bg-dark-700 border border-dark-600 text-[11px] text-dark-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <span>Powered by Haversine Mountain AI Dispatch</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dark-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-500">
            <p>
              © 2026 Qashqar Food Hub (QFH). All rights reserved. Hotline:{' '}
              <a href="tel:03426522787" className="text-gold-400 font-bold hover:text-gold-300">
                03426522787
              </a>
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-700 border border-dark-600">
              <span>Engineered with pride by</span>
              <span className="font-bold text-gold-400">Khushwaqt Developers</span>
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <Head>
        <title>Qashqar Food Hub (QFH) | Fine Dining & Delivery in Chitral Valley</title>
        <meta name="description" content="Qashqar Food Hub — Order authentic Mantou, River Trout, Ghalmandi, Shinwari Karahi, and gourmet cuisine across Chitral Valley. Rider dispatch: 03426522787." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👑</text></svg>" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </Head>

      <AppContent Component={Component} pageProps={pageProps} />
    </AppProvider>
  );
}
