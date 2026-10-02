import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import { AlertCircle, LogIn, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      localStorage.setItem('cfh_user', JSON.stringify(data.user));
      localStorage.setItem('cfh_token', data.token);
      document.cookie = `cfh_token=${data.token}; path=/;`;

      if (data.user.role === 'admin' || data.user.role === 'restaurant_owner') {
        router.push('/restaurant/dashboard');
      } else if (data.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex">

      {/* ── Left Panel — Brand / Visual ──────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #1a1208 0%, #3d2d1d 60%, #5a3e1a 100%)',
        }}
      >
        {/* Background food image overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-500/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-500/10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gold-400 text-2xl">👑</span>
            <span className="font-serif font-bold text-2xl text-white">
              Qashqar<span className="text-gold-400">FoodHub</span>
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-dark-400 font-semibold">
            Fine Dining · Chitral Valley
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="font-serif text-4xl font-bold text-white leading-tight">
              Welcome Back to<br />
              <span className="text-gold-400 italic">Fine Dining</span>
            </h2>
            <p className="text-sm text-cream-400 mt-3 leading-relaxed">
              Sign in to order from Chitral Valley's finest restaurants, track your deliveries, and manage your account.
            </p>
          </div>

          {/* Testimonial */}
          <div className="p-5 rounded-2xl border border-dark-600 bg-dark-700/50 backdrop-blur-sm">
            <p className="text-sm text-cream-300 italic leading-relaxed">
              "The Shinwari Karahi from Qashqar Food Hub is absolutely incredible — authentic flavors, fast delivery!"
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-sm">
                🧑‍🍳
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ahmad Karim</p>
                <p className="text-[10px] text-dark-400">Regular Customer · Chitral Town</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-3">
            {['🥟', '🐟', '🍕', '☕'].map((emoji, i) => (
              <div key={i} className="w-12 h-12 rounded-xl bg-dark-700/60 border border-dark-600 flex items-center justify-center text-xl">
                {emoji}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-dark-500 mt-2 font-medium">Mantou · River Trout · Pizza · Qawa</p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-100">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-gold-500 text-xl">👑</span>
            <span className="font-serif font-bold text-xl text-dark-800">
              Qashqar<span className="text-gold-500">FoodHub</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-dark-800">Sign In</h1>
            <p className="text-sm text-dark-500 mt-1.5">
              Welcome back to Qashqar Food Hub
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-dark-700 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-cream-300 rounded-lg text-sm text-dark-800 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all font-medium"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-dark-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 bg-white border border-cream-300 rounded-lg text-sm text-dark-800 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all font-medium"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gold-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password link */}
            <div className="flex justify-end">
              <Link
                href="/change-password"
                className="text-xs font-semibold text-gold-600 hover:text-gold-700 hover:underline transition-colors"
              >
                Forgot / Change Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-cream-200 space-y-3 text-center">
            <p className="text-sm text-dark-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-gold-600 hover:text-gold-700 hover:underline">
                Sign up as Customer
              </Link>
            </p>
            <p className="text-sm text-dark-600">
              Restaurant owner?{' '}
              <Link href="/restaurant/onboard" className="font-bold text-gold-600 hover:text-gold-700 hover:underline">
                Register here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
