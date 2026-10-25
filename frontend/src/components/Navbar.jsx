import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import folioverseLogo from '../assets/projects/folioverse_logo.jpg';
import {
  BookOpen,
  PlusCircle,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Tag,
  CheckCircle2,
  Mail,
  Shield,
  Store,
  Layers,
} from 'lucide-react';

export const Navbar = ({
  onOpenAuth,
  onOpenSellBook,
  onOpenContact,
  onOpenDashboard,
  onSelectCategory,
  onSelectSubcategory,
  selectedCategory,
  selectedSubcategory,
  apiConnected,
  bookCount,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, subtotal, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setCategoryDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const categories = [
    {
      name: 'Literature & Novel',
      icon: '📖',
      subcategories: ['Bengali Literature', 'English Literature', 'World Classics', 'Poetry & Plays'],
    },
    {
      name: 'Science',
      icon: '🔬',
      subcategories: ['Physics', 'Astronomy & Cosmology', 'Biology & Genetics', 'Computer Science'],
    },
    {
      name: 'Technology',
      icon: '💻',
      subcategories: ['Artificial Intelligence & ML', 'Software Architecture', 'Web & Cloud Engineering'],
    },
    {
      name: 'Fiction',
      icon: '✨',
      subcategories: ['Fantasy & Magic', 'Science Fiction', 'Mystery & Detective', 'Psychological Thriller'],
    },
    {
      name: 'Music',
      icon: '🎵',
      subcategories: ['Music Theory & Composition', 'Biographies & Memoirs', 'Instruments & Performance'],
    },
  ];

  const handleCategoryClick = (catName, subcat = '') => {
    if (onSelectCategory) onSelectCategory(catName);
    if (onSelectSubcategory) onSelectSubcategory(subcat);
    setCategoryDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleClearFilters = (e) => {
    e.stopPropagation();
    if (onSelectCategory) onSelectCategory('');
    if (onSelectSubcategory) onSelectSubcategory('');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Branding (Left) */}
          <a
            href="#"
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-2xl p-1 shrink-0"
          >
            <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 shadow-md sm:shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all duration-300 shrink-0">
              <img
                src={folioverseLogo}
                alt="FolioVerse Logo"
                className="w-full h-full object-cover object-[center_35%] rounded-[10px] sm:rounded-[14px] bg-slate-950"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500 border border-slate-950" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent truncate">
                  FolioVerse
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-wide shrink-0">
                  Shop
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-400 truncate hidden min-[380px]:inline">Buy & Sell</span>
                <span className="text-slate-600 hidden min-[480px]:inline">•</span>
                <span className="text-cyan-400 font-medium hidden min-[480px]:inline">
                  {bookCount ? bookCount.toLocaleString() : '2,000'} In Stock
                </span>
              </div>
            </div>
          </a>

          {/* Desktop Decongested Navigation Links (Center) */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
            {/* Catalog Mega-Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  selectedCategory || selectedSubcategory
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="truncate max-w-[140px]">
                  {selectedSubcategory || selectedCategory || 'Browse Genres'}
                </span>
                {selectedCategory || selectedSubcategory ? (
                  <span
                    onClick={handleClearFilters}
                    className="p-0.5 rounded hover:bg-cyan-500/30 text-cyan-300"
                    title="Clear filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      categoryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Mega Dropdown Menu */}
              {categoryDropdownOpen && (
                <div className="absolute left-0 mt-2 w-[520px] rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      Browse by Genre & Subcategory
                    </span>
                    <button
                      onClick={() => handleCategoryClick('', '')}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Show All Books
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <div
                        key={cat.name}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <button
                          onClick={() => handleCategoryClick(cat.name, '')}
                          className="w-full text-left font-bold text-xs text-white hover:text-cyan-400 transition-colors flex items-center justify-between mb-1.5"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{cat.icon}</span>
                            <span className="truncate">{cat.name}</span>
                          </span>
                        </button>
                        <div className="space-y-1 pl-4 border-l border-slate-800">
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => handleCategoryClick(cat.name, sub)}
                              className={`w-full text-left text-[11px] truncate transition-colors block py-0.5 ${
                                selectedSubcategory === sub
                                  ? 'text-cyan-300 font-bold'
                                  : 'text-slate-400 hover:text-cyan-300'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Genre Switcher Pills */}
            <button
              onClick={() => handleCategoryClick('Literature & Novel', 'Bengali Literature')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedSubcategory === 'Bengali Literature'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              🇧🇩 Bengali Lit.
            </button>

            <button
              onClick={() => handleCategoryClick('Literature & Novel', 'English Literature')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedSubcategory === 'English Literature'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              🇬🇧 English Classics
            </button>

            {/* Store Dashboard link */}
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dashboard</span>
            </button>

            {/* Contact link */}
            <button
              onClick={onOpenContact}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact</span>
            </button>
          </nav>

          {/* Desktop Right Actions: Cart, Sell CTA & Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Prominent Cart Trigger Pill */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/30 hover:border-cyan-400 text-white transition-all shadow-sm active:scale-95 group relative"
              aria-label="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-950 shadow-md animate-in zoom-in">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-200">Cart</span>
              {totalItems > 0 && (
                <span className="text-xs font-extrabold text-emerald-400 pl-1 border-l border-slate-700">
                  ${subtotal.toFixed(2)}
                </span>
              )}
            </button>

            {/* Sell a Book Button */}
            <button
              onClick={onOpenSellBook}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Sell a Book</span>
            </button>

            {/* User Profile / Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                  title="Open Admin Dashboard"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate max-w-[100px]">
                    <div className="text-xs font-semibold text-white truncate leading-tight">
                      {user?.username}
                    </div>
                    <div className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => onOpenAuth && onOpenAuth('login', 'buyer')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  Sign In
                </button>

                <button
                  onClick={() => onOpenAuth && onOpenAuth('register', 'buyer')}
                  className="px-3 py-2 text-xs font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all"
                >
                  Join Store
                </button>
              </div>
            )}
          </div>

          {/* Small Device Top Bar Controls (< 1024px) */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Cart Trigger */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 hover:border-cyan-500/40"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Quick Sell Button */}
            <button
              onClick={onOpenSellBook}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-sm active:scale-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Sell</span>
            </button>

            {/* Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-cyan-400 transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="w-5 h-5 text-slate-300 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Small Device Toggleable Mobile Drawer & Backdrop (< 1024px) */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 sm:top-20 bg-slate-950/85 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-x-0 top-16 sm:top-20 z-50 lg:hidden border-b border-slate-800 bg-slate-950/98 backdrop-blur-2xl shadow-2xl overflow-y-auto max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] p-4 sm:p-6 animate-in slide-in-from-top-4 duration-200">
            <div className="max-w-lg mx-auto space-y-4">
              {/* Bookstore Status & Stock Count */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Digital Book Shop Open</span>
                </div>
                <span className="text-xs text-cyan-400 font-bold">
                  {bookCount ? bookCount.toLocaleString() : '2,000'} Books
                </span>
              </div>

              {/* Mobile Cart Direct Summary */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCart();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">View Shopping Cart</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs">
                    {totalItems} items
                  </span>
                  <span className="text-xs font-bold text-emerald-400">${subtotal.toFixed(2)}</span>
                </div>
              </button>

              {/* Onboarding Role Choice Cards for Mobile */}
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth && onOpenAuth('register', 'buyer');
                    }}
                    className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Join as Buyer</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Order from 2,000+ books</div>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth && onOpenAuth('register', 'seller');
                    }}
                    className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
                      <Store className="w-3.5 h-3.5" />
                      <span>Join as Seller</span>
                    </div>
                    <div className="text-[10px] text-slate-400">List books to readers</div>
                  </button>
                </div>
              )}

              {/* Quick Actions in Mobile Drawer */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDashboard();
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 font-bold text-xs"
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Admin Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenContact();
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-xs hover:text-emerald-400"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>Contact Authority</span>
                </button>
              </div>

              {/* Genre & Subcategory Selector for Mobile */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    Browse Catalog Genres:
                  </span>
                  {(selectedCategory || selectedSubcategory) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCategoryClick('Literature & Novel', 'Bengali Literature')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                      selectedSubcategory === 'Bengali Literature'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>🇧🇩 Bengali Literature</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Rabindranath, Nazrul</span>
                  </button>

                  <button
                    onClick={() => handleCategoryClick('Literature & Novel', 'English Literature')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                      selectedSubcategory === 'English Literature'
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>🇬🇧 English Literature</span>
                    <span className="text-[10px] text-indigo-400 font-normal">Shakespeare, Orwell</span>
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat.name, '')}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                        selectedCategory === cat.name
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons in Mobile */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSellBook();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  List / Sell a Book
                </button>

                {isAuthenticated ? (
                  <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{user?.username}</div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Signed In
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('login', 'buyer');
                      }}
                      className="py-2.5 text-xs sm:text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-xl text-center border border-slate-800"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('register', 'buyer');
                      }}
                      className="py-2.5 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
