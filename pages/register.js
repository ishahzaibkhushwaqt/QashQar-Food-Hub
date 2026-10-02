import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import { AlertCircle, UserPlus, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      setUser(data.user);
      localStorage.setItem('cfh_user', JSON.stringify(data.user));
      localStorage.setItem('cfh_token', data.token);
      document.cookie = `cfh_token=${data.token}; path=/;`;

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex">

      {/* ── Left Panel — Brand Visual ─────────────────────────────────── */}
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
            backgroundImage: "url('https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80')",
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

        <div className="relative z-10 space-y-5">
          <h2 className="font-serif text-4xl font-bold text-white leading-tight">
            Join the Finest<br />
            <span className="text-gold-400 italic">Food Community</span>
          </h2>
          <p className="text-sm text-cream-400 leading-relaxed">
            Create your account and start exploring Chitral Valley's best restaurants, from traditional Mantou to gourmet pizzas.
          </p>

          {/* Benefits list */}
          <ul className="space-y-3">
            {[
              '🥟 Order from 7+ partner restaurants',
              '🚴 Track your rider in real-time',
              '⭐ Save favourites & order history',
              '🎁 Exclusive offers for members',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-cream-300">
                <span className="text-base">{item.substring(0, 2)}</span>
                <span>{item.substring(3)}</span>
              </li>
            ))}
          </ul>
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

      {/* ── Right Panel — Register Form ───────────────────────────────── */}
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
            <h1 className="font-serif text-3xl font-bold text-dark-800">Create Account</h1>
            <p className="text-sm text-dark-500 mt-1.5">
              Join Qashqar Food Hub today — it&apos;s free
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-dark-700 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-cream-300 rounded-lg text-sm text-dark-800 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all font-medium"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

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
                  placeholder="Choose a secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gold-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-dark-500 mt-1.5 font-medium">Minimum 6 characters</p>
            </div>

            {/* Terms */}
            <p className="text-xs text-dark-500">
              By creating an account you agree to our{' '}
              <span className="text-gold-600 font-semibold cursor-pointer hover:underline">Terms of Service</span>{' '}
              and{' '}
              <span className="text-gold-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-cream-200 text-center">
            <p className="text-sm text-dark-600">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-gold-600 hover:text-gold-700 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
