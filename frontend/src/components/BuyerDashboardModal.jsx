import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';
import {
  X,
  ShoppingBag,
  Package,
  CheckCircle2,
  Truck,
  Smartphone,
  Bookmark,
  RefreshCw,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  LogOut,
  User,
  ShieldCheck,
  Check,
  Layers,
  CreditCard,
  BookOpen,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const BuyerDashboardModal = ({
  isOpen,
  onClose,
  onOpenCart,
  onBrowseCatalog,
}) => {
  const { user, logout } = useAuth();
  const {
    cartItems,
    savedItems,
    cartHistory,
    orderHistory,
    moveToCartFromSaved,
    removeSavedItem,
    addToCart,
    openCart,
  } = useCart();

  // Active view: 'analytics' (Categorized Orders & Cleared Payments) | 'orders' (Order History) | 'saved' (Saved for Later)
  const [activeTab, setActiveTab] = useState('analytics');
  const [summaryData, setSummaryData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch dynamic buyer analytics & order records scoped to this buyer
  const fetchBuyerData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch dynamic buyer summary analytics
      const summaryRes = await orderService.getBuyerSummary({
        username: user?.username,
        email: user?.email,
      });
      if (summaryRes.data) {
        setSummaryData(summaryRes.data);
        if (summaryRes.data.recent_orders) {
          setOrders(summaryRes.data.recent_orders);
        }
      }
    } catch (err) {
      console.warn('API buyer-summary fetch failed, computing from local store:', err);
      // Fallback: Compute dynamic analytics from local orderHistory
      computeFallbackSummary(orderHistory || []);
    } finally {
      setLoading(false);
    }
  };

  const computeFallbackSummary = (orderList) => {
    let totalSpent = 0;
    let clearedSpent = 0;
    let totalBooks = 0;
    let clearedBooks = 0;
    const catOrders = {};
    const catCleared = {};
    const payMap = {
      bkash: { label: 'bKash Mobile Banking', orders: 0, books: 0, amount: 0, is_cleared: true },
      nagad: { label: 'Nagad Mobile Banking', orders: 0, books: 0, amount: 0, is_cleared: true },
      rocket: { label: 'Rocket Mobile Banking', orders: 0, books: 0, amount: 0, is_cleared: true },
      cod: { label: 'Cash on Delivery (COD)', orders: 0, books: 0, amount: 0, is_cleared: false },
    };

    orderList.forEach((ord) => {
      const amt = parseFloat(ord.total_amount || 0);
      totalSpent += amt;
      const method = (ord.payment_method || 'cod').toLowerCase();
      const isCleared = ord.payment_status === 'paid' || ['bkash', 'nagad', 'rocket'].includes(method);
      if (isCleared) clearedSpent += amt;

      if (!payMap[method]) {
        payMap[method] = { label: method.toUpperCase(), orders: 0, books: 0, amount: 0, is_cleared: isCleared };
      }
      payMap[method].orders += 1;
      payMap[method].amount += amt;

      (ord.items || []).forEach((itm) => {
        const cat = itm.category || itm.book?.category || 'Literature & Novel';
        const qty = itm.quantity || 1;
        const sub = parseFloat(itm.subtotal || itm.unit_price || 0) * qty;

        totalBooks += qty;
        payMap[method].books += qty;
        catOrders[cat] = (catOrders[cat] || 0) + qty;

        if (isCleared) {
          clearedBooks += qty;
          catCleared[cat] = (catCleared[cat] || 0) + qty;
        }
      });
    });

    setSummaryData({
      buyer_username: user?.username || 'Buyer',
      buyer_email: user?.email || '',
      total_orders: orderList.length,
      total_books_ordered: totalBooks,
      total_spent: totalSpent.toFixed(2),
      cleared_payment_amount: clearedSpent.toFixed(2),
      cleared_books_count: clearedBooks,
      categories_ordered: Object.entries(catOrders).map(([category, count]) => ({
        category,
        count,
        percentage: totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0,
      })),
      cleared_categories: Object.entries(catCleared).map(([category, count]) => ({
        category,
        count,
        percentage: clearedBooks > 0 ? Math.round((count / clearedBooks) * 100) : 0,
      })),
      payment_methods_breakdown: Object.entries(payMap)
        .filter(([_, v]) => v.orders > 0)
        .map(([k, v]) => ({
          method: k,
          label: v.label,
          orders: v.orders,
          books: v.books,
          amount: v.amount.toFixed(2),
          is_cleared: v.is_cleared,
        })),
      recent_orders: orderList,
    });
    setOrders(orderList);
  };

  useEffect(() => {
    if (isOpen) {
      fetchBuyerData();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Category Theme Mapper
  const getCategoryTheme = (category) => {
    switch (category) {
      case 'Science':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
          bar: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      case 'Technology':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
          bar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'Literature & Novel':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'Fiction':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
          bar: 'bg-gradient-to-r from-purple-500 to-pink-500',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'Music':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          bg: 'bg-slate-800/50 border-slate-700 text-slate-300',
          bar: 'bg-gradient-to-r from-slate-500 to-slate-400',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  // Payment Badge Helper
  const getPaymentBadge = (method) => {
    switch (method?.toLowerCase()) {
      case 'bkash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-pink-950/90 text-pink-300 border border-pink-500/40">
            <Smartphone className="w-3 h-3 text-pink-400" /> bKash API (Cleared)
          </span>
        );
      case 'nagad':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-950/90 text-orange-300 border border-orange-500/40">
            <Smartphone className="w-3 h-3 text-orange-400" /> Nagad API (Cleared)
          </span>
        );
      case 'rocket':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-950/90 text-purple-300 border border-purple-500/40">
            <Smartphone className="w-3 h-3 text-purple-400" /> Rocket API (Cleared)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
            <Truck className="w-3 h-3 text-amber-400" /> Cash on Delivery (COD)
          </span>
        );
    }
  };

  const totalBooksOrdered = summaryData?.total_books_ordered ?? 0;
  const totalSpentBDT = summaryData?.total_spent ?? '0.00';
  const clearedPaymentAmount = summaryData?.cleared_payment_amount ?? '0.00';
  const clearedBooksCount = summaryData?.cleared_books_count ?? 0;
  const categoriesOrdered = summaryData?.categories_ordered || [];
  const clearedCategories = summaryData?.cleared_categories || [];
  const paymentBreakdown = summaryData?.payment_methods_breakdown || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Buyer Account Portal
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Verified Buyer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <span className="text-white font-semibold">{user?.username || 'Buyer'}</span>
                {user?.email ? ` (${user.email})` : ''} • Dynamic personal dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBuyerData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh dynamic order analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Metric Overview Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80">
          {/* Metric 1: Categorized Books Ordered */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Total Books Ordered</span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {totalBooksOrdered}{' '}
              <span className="text-xs font-semibold text-slate-400">
                copies ({summaryData?.total_orders || orders.length} orders)
              </span>
            </div>
            <div className="text-[11px] text-cyan-400 mt-0.5 truncate">
              {categoriesOrdered.length} categories explored
            </div>
          </div>

          {/* Metric 2: Total Spent (BDT) */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Total Purchase Value</span>
              <span className="text-xs font-bold text-emerald-400">BDT</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ৳ {parseFloat(totalSpentBDT).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across all bookstore orders
            </div>
          </div>

          {/* Metric 3: Cleared Payments */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Cleared Payments</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              ৳ {parseFloat(clearedPaymentAmount).toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              {clearedBooksCount} books paid via Mobile Banking
            </div>
          </div>

          {/* Metric 4: Active Cart & Wishlist */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Cart & Saved Items</span>
              <Bookmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              {cartItems.length}{' '}
              <span className="text-xs font-semibold text-slate-400">active</span>
              {' • '}
              <span className="text-white">{savedItems.length}</span>{' '}
              <span className="text-xs font-semibold text-slate-400">saved</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              <button
                onClick={() => {
                  onClose();
                  openCart();
                }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Open shopping cart →
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Categorized Books & Payment Clearance
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            My Order History ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'saved'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved for Later ({savedItems.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* TAB 1: DYNAMIC CATEGORIZED ORDERS & PAYMENT CLEARANCE */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Dynamic Categorized Books Ordered Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <BookOpen className="w-4.5 h-4.5 text-cyan-400" />
                      How Many & What Categorized Books You Ordered
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dynamically aggregated across all confirmed orders placed by your account
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {totalBooksOrdered} Total Copies
                  </span>
                </div>

                {categoriesOrdered.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
                    <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-slate-300 font-semibold">
                      No categorized books ordered yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                      When you order books from Bengali Literature, Science, Technology, Fiction, or Music, your dynamic categorized breakdown will appear here.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        if (onBrowseCatalog) onBrowseCatalog();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:brightness-110 transition-all shadow-md"
                    >
                      Browse Bookstore Catalog <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {categoriesOrdered.map((catItem) => {
                      const theme = getCategoryTheme(catItem.category);
                      return (
                        <div
                          key={catItem.category}
                          className={`p-4 rounded-xl border ${theme.bg} space-y-2.5 transition-all`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                              {catItem.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${theme.badge}`}>
                              {catItem.count} {catItem.count === 1 ? 'Book' : 'Books'}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>Reading Share</span>
                              <span className="font-bold text-white">{catItem.percentage}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${theme.bar} transition-all duration-500`}
                                style={{ width: `${Math.min(catItem.percentage || 10, 100)}%` }}
                              />
                            </div>
                          </div>

                          {catItem.total_amount && (
                            <div className="text-[11px] text-slate-300 flex justify-between pt-1 border-t border-slate-800/60">
                              <span>Total Category Spend:</span>
                              <span className="font-bold text-emerald-400">
                                ৳ {parseFloat(catItem.total_amount).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Cleared Payments & Payment Methods Breakdown */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
                      How You Cleared Payments (Mobile Banking vs COD)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct automated mobile banking verification via bKash, Nagad, Rocket, or Cash on Delivery
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ৳ {parseFloat(clearedPaymentAmount).toFixed(2)} Cleared
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* bKash */}
                  <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-pink-400" /> bKash API
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                        Instant
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">
                      ৳{' '}
                      {parseFloat(
                        paymentBreakdown.find((p) => p.method === 'bkash')?.amount || 0
                      ).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {paymentBreakdown.find((p) => p.method === 'bkash')?.orders || 0} orders •{' '}
                      {paymentBreakdown.find((p) => p.method === 'bkash')?.books || 0} books
                    </div>
                  </div>

                  {/* Nagad */}
                  <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-orange-400" /> Nagad API
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                        Instant
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">
                      ৳{' '}
                      {parseFloat(
                        paymentBreakdown.find((p) => p.method === 'nagad')?.amount || 0
                      ).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {paymentBreakdown.find((p) => p.method === 'nagad')?.orders || 0} orders •{' '}
                      {paymentBreakdown.find((p) => p.method === 'nagad')?.books || 0} books
                    </div>
                  </div>

                  {/* Rocket */}
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-purple-400" /> Rocket API
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                        Instant
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">
                      ৳{' '}
                      {parseFloat(
                        paymentBreakdown.find((p) => p.method === 'rocket')?.amount || 0
                      ).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {paymentBreakdown.find((p) => p.method === 'rocket')?.orders || 0} orders •{' '}
                      {paymentBreakdown.find((p) => p.method === 'rocket')?.books || 0} books
                    </div>
                  </div>

                  {/* COD */}
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-400" /> Cash on Delivery
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        On Arrival
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">
                      ৳{' '}
                      {parseFloat(
                        paymentBreakdown.find((p) => p.method === 'cod')?.amount || 0
                      ).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {paymentBreakdown.find((p) => p.method === 'cod')?.orders || 0} orders •{' '}
                      {paymentBreakdown.find((p) => p.method === 'cod')?.books || 0} books
                    </div>
                  </div>
                </div>

                {/* Categorized Books That Cleared Payment */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">
                    What Types of Books Cleared Payment:
                  </h4>
                  {clearedCategories.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">
                      No cleared payments yet. Complete a checkout using bKash, Nagad, Rocket, or COD upon arrival.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {clearedCategories.map((cc) => (
                        <span
                          key={cc.category}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          {cc.category}: <span className="text-white">{cc.count} books cleared</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DETAILED ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No Bookstore Orders Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                    Your personal orders, delivery tracking, and cleared receipts will be listed here after you place your first order.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onBrowseCatalog) onBrowseCatalog();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Start Shopping Books <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                orders.map((ord) => {
                  const method = (ord.payment_method || 'cod').toLowerCase();
                  const isPaid = ord.payment_status === 'paid' || ['bkash', 'nagad', 'rocket'].includes(method);
                  const orderDate = ord.created_at
                    ? new Date(ord.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent Order';

                  return (
                    <div
                      key={ord.order_number || ord.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300">
                              #{ord.order_number}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isPaid ? 'Payment Cleared' : 'Payment Pending'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-slate-500" /> {orderDate}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base sm:text-lg font-black text-white">
                            ৳ {parseFloat(ord.total_amount || 0).toFixed(2)}
                          </div>
                          <div>{getPaymentBadge(ord.payment_method)}</div>
                        </div>
                      </div>

                      {/* Items List Inside Order */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Ordered Books & Categories:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(ord.items || []).map((itm, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3"
                            >
                              {itm.cover_image ? (
                                <img
                                  src={itm.cover_image}
                                  alt={itm.title}
                                  className="w-10 h-14 object-cover rounded-md shrink-0 border border-slate-700"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-14 rounded-md bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-white truncate">
                                  {itm.title}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  by {itm.author || 'Author'}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold truncate border border-slate-700">
                                    {itm.category || 'Literature & Novel'}
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-400">
                                    {itm.quantity}x ৳{parseFloat(itm.unit_price || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping & Delivery Footer */}
                      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">
                            Shipping to: <span className="text-white">{ord.shipping_address}</span>
                          </span>
                        </div>
                        {ord.transaction_id && (
                          <div className="text-[11px] font-mono text-slate-400">
                            TrxID: <span className="text-cyan-300">{ord.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: SAVED FOR LATER */}
          {activeTab === 'saved' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {savedItems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">Your Saved Cart is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                    Click "Save for Later" on any item in your cart to keep it here without losing it between sessions.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onBrowseCatalog) onBrowseCatalog();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                  >
                    Browse Catalog <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {savedItems.map((item) => (
                    <div
                      key={item.bookId || item.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        {item.cover_image && (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            className="w-12 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 truncate">by {item.author}</p>
                          <div className="text-xs font-black text-emerald-400 mt-1">
                            ৳ {parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => moveToCartFromSaved(item.bookId || item.id)}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all"
                        >
                          Move to Active Cart
                        </button>
                        <button
                          onClick={() => removeSavedItem(item.bookId || item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Remove from saved"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>FolioVerse Buyer Account • Dynamic personal reading & purchase analytics</span>
          </div>
          <button
            onClick={() => {
              onClose();
              if (onBrowseCatalog) onBrowseCatalog();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};
