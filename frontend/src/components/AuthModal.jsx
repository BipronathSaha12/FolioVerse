import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Store,
  CheckCircle2,
  Shield,
} from 'lucide-react';

export const AuthModal = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'buyer',
  onSuccess,
}) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [role, setRole] = useState(initialRole); // 'buyer' or 'seller'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(username, password);
        onSuccess(`Welcome back, ${username}! Authenticated successfully.`);
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match.');
          setSubmitting(false);
          return;
        }
        await register(username, email, password, passwordConfirm);
        onSuccess(
          `Account created as Book ${role === 'seller' ? 'Seller' : 'Buyer'}! Welcome to FolioVerse, ${username}.`
        );
      }
      onClose();
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setError(data);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors.join(' '));
        } else if (typeof data === 'object') {
          const msgs = Object.entries(data)
            .map(([field, errList]) => `${field}: ${Array.isArray(errList) ? errList.join(' ') : errList}`)
            .join(' | ');
          setError(msgs);
        } else {
          setError('An unexpected error occurred during authentication.');
        }
      } else {
        setError('Network error. Please make sure the Django backend is running.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (type) => {
    if (type === 'admin') {
      setUsername('admin');
      setPassword('admin12345');
      setRole('seller');
    } else if (type === 'buyer') {
      setUsername('buyer_demo');
      setPassword('buyer12345');
      setRole('buyer');
    } else if (type === 'seller') {
      setUsername('seller_demo');
      setPassword('seller12345');
      setRole('seller');
    }
    setMode('login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors z-10"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* Sign In / Register Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Choice: Join as Book Buyer or Seller */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              {mode === 'register' ? 'Select Your Account Type:' : 'Sign in as:'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === 'buyer'
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`p-1.5 rounded-lg ${role === 'buyer' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  {role === 'buyer' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="font-bold text-xs text-white">Book Buyer</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Buy 2,000+ books</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === 'seller'
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`p-1.5 rounded-lg ${role === 'seller' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Store className="w-4 h-4" />
                  </div>
                  {role === 'seller' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="font-bold text-xs text-white">Book Seller</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">List & sell books</div>
              </button>
            </div>
          </div>

          {/* Header Title */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {mode === 'login'
                ? `Sign In as ${role === 'seller' ? 'Seller' : 'Buyer'}`
                : `Join as Book ${role === 'seller' ? 'Seller' : 'Buyer'}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {role === 'seller'
                ? 'Sell books, manage stock inventory, and reach readers'
                : 'Browse, buy, and check stock across all 5 curated catalogs'}
            </p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full mt-2 py-3 px-4 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 shadow-cyan-600/25'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-600/25'
              }`}
            >
              {submitting
                ? 'Processing...'
                : mode === 'login'
                ? `Sign In as ${role === 'seller' ? 'Seller' : 'Buyer'}`
                : `Complete Registration as ${role === 'seller' ? 'Seller' : 'Buyer'}`}
            </button>
          </form>

          {/* 1-Click Fast Demo Accounts Selector */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center">
              1-Click Demo Accounts (For Testing & Review):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-rose-300 transition-all hover:border-rose-500/40"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('buyer')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-cyan-300 transition-all hover:border-cyan-500/40"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Buyer Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('seller')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-emerald-300 transition-all hover:border-emerald-500/40"
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>Seller Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
