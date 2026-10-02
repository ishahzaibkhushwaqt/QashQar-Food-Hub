import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import LanguageToggle from './LanguageToggle';
import {
  ShoppingBag,
  Store,
  ChefHat,
  Bike,
  Menu,
  X,
  Phone,
  Search,
  User,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { cartItemCount, setIsCartOpen, user, signOut, t, language } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => router.pathname === path;

  const navLinks = [
    { label: t('home'), path: '/' },
    { label: t('menu'), path: '/' },
    { label: t('about'), path: '/' },
  ];

  const rightLinks = [
    { label: t('reservation'), path: '/' },
    { label: t('kitchenKds'), path: '/restaurant/dashboard', icon: ChefHat },
    { label: t('riderPortal'), path: '/driver', icon: Bike },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/98 backdrop-blur-lg shadow-soft border-b border-cream-300'
          : 'bg-white border-b border-cream-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* ── Left Navigation ───────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map(({ label, path }) => (
              <Link
                key={label}
                href={path}
                className={`relative text-sm font-semibold tracking-wide transition-colors group ${
                  isActive(path) && path === '/'
                    ? 'text-gold-500'
                    : 'text-dark-700 hover:text-gold-500'
                }`}
              >
                {label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-0.5 bg-gold-500 transition-all duration-200 ${
                    isActive(path) && path === '/' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* ── Center — Brand Logo ───────────────────────────────────── */}
          <Link href="/" className="flex flex-col items-center group">
            <span className="text-gold-500 text-xl mb-0.5 group-hover:scale-110 transition-transform">
              👑
            </span>
            <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-dark-800 leading-none">
              Qashqar<span className="text-gold-500">FoodHub</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-dark-400 mt-0.5">
              Fine Dining · Delivery
            </span>
          </Link>

          {/* ── Right Navigation + Actions ────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-6">
            {rightLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={label}
                href={path}
                className={`relative text-sm font-semibold tracking-wide transition-colors group flex items-center gap-1.5 ${
                  router.pathname.startsWith(path) && path !== '/'
                    ? 'text-gold-500'
                    : 'text-dark-700 hover:text-gold-500'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-0.5 bg-gold-500 transition-all duration-200 ${
                    router.pathname.startsWith(path) && path !== '/' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}

            {/* Language Switcher (Khowar / Urdu / English toggle — Chitral ki apni zabaan) */}
            <LanguageToggle variant="dropdown" />

            {/* User / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-dark-700 hover:text-gold-500 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-gold-600" />
                  </div>
                  <span className="hidden xl:inline">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-elevated border border-cream-300 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-cream-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-dark-400">{t('signedInAs')}</p>
                      <p className="text-xs font-semibold text-dark-700 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {(user.role === 'admin' || user.role === 'restaurant_owner') && (
                        <Link
                          href="/restaurant/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-dark-700 hover:bg-cream-100 hover:text-gold-600 transition-colors"
                        >
                          {t('dashboard')}
                        </Link>
                      )}
                      <button
                        onClick={() => { setIsUserMenuOpen(false); signOut(router); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {t('signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-semibold text-dark-700 hover:text-gold-500 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-bold">{t('signIn')}</span>
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-md font-bold text-xs tracking-wide transition-all shadow-gold hover:shadow-lg active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('basket')}</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-dark-800 text-white text-[10px] font-black flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Mobile: Language + Cart + Hamburger ──────────────────────────────── */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageToggle variant="dropdown" />
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-dark-700 hover:text-gold-500 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-gold-500 text-white text-[9px] font-black flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-dark-700 hover:text-gold-500 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* ── Mobile Menu Drawer ─────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-cream-200 animate-slide-up">
            <nav className="flex flex-col gap-1">
              {[...navLinks, ...rightLinks].map(({ label, path, icon: Icon }) => (
                <Link
                  key={label}
                  href={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-dark-700 hover:bg-cream-100 hover:text-gold-600 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4 text-gold-500" />}
                  {label}
                </Link>
              ))}

              <Link
                href="/restaurant/onboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-dark-700 hover:bg-cream-100 hover:text-gold-600 transition-colors"
              >
                <Store className="w-4 h-4 text-gold-500" />
                {t('onboardEatery')}
              </Link>

              <div className="pt-3 border-t border-cream-200 mt-1">
                <a
                  href="tel:03426522787"
                  className="flex items-center gap-2 px-3 text-sm font-bold text-gold-600"
                >
                  <Phone className="w-4 h-4" />
                  {t('riderHotline')}: 03426522787
                </a>
              </div>

              {!user ? (
                <div className="pt-2 px-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-gold w-full justify-center mt-1"
                  >
                    {t('signIn')}
                  </Link>
                </div>
              ) : (
                <div className="pt-2 px-3">
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); signOut(router); }}
                    className="text-sm font-semibold text-red-600 px-3 py-2"
                  >
                    {t('signOut')}
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
