import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';
import {
  X,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Smartphone,
  Bookmark,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut,
  User,
  ShieldCheck,
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

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'saved' | 'methods'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch buyer's live orders from backend
  const fetchBuyerOrders = async () => {
    setLoadingOrders(true);
    setErrorMsg('');
    try {
      // Backend scopes query to current authenticated buyer
      const res = await orderService.getOrders();
      const serverOrders = res.data?.results || res.data || [];
      // Combine server orders with locally stored orders (preventing duplicates)
      const combined = [...serverOrders];
      (orderHistory || []).forEach((localOrd) => {
        if (!combined.some((o) => o.order_number === localOrd.order_number)) {
          combined.push(localOrd);
        }
      });
      // Sort newest first
      combined.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
      setOrders(combined);
    } catch (err) {
      console.warn('Failed to load live orders from backend, using local order history:', err);
      setOrders(orderHistory || []);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBuyerOrders();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Calculate lifetime buyer metrics
  const totalOrdersCount = orders.length;
  const totalSpentBDT = orders.reduce((sum, ord) => sum + parseFloat(ord.total_amount || 0), 0);

  const getPaymentBadge = (method) => {
    switch (method?.toLowerCase()) {
      case 'bkash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pink-950/90 text-pink-300 border border-pink-500/40">
            <Smartphone className="w-3 h-3 text-pink-400" /> bKash API
          </span>
        );
      case 'nagad':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-950/90 text-orange-300 border border-orange-500/40">
            <Smartphone className="w-3 h-3 text-orange-400" /> Nagad API
          </span>
        );
      case 'rocket':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950/90 text-purple-300 border border-purple-500/40">
            <Smartphone className="w-3 h-3 text-purple-400" /> Rocket API
          </span>
        );
      case 'cod':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
            <Truck className="w-3 h-3 text-emerald-400" /> Cash on Delivery (COD)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Highlight line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Buyer Account Portal</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Verified Buyer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="font-semibold text-white">{user?.username}</span> ({user?.email || 'Registered Customer'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lifetime Buyer Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-6 bg-slate-950/50 border-b border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Orders</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>{totalOrdersCount}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Purchases</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              ৳ {totalSpentBDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Active Cart</span>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-0.5 flex items-center justify-between">
              <span>{cartItems.reduce((acc, i) => acc + i.quantity, 0)} items</span>
              {cartItems.length > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenCart) onOpenCart();
                    else openCart();
                  }}
                  className="text-[10px] text-cyan-300 underline font-normal"
                >
                  Checkout
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Saved Items</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>{savedItems.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders & Delivery Status ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Cart & History ({savedItems.length + cartHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('methods')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'methods'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Supported Payment Gateways</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400">
                  Track your book dispatches and download purchase receipts.
                </span>
                <button
                  onClick={fetchBuyerOrders}
                  disabled={loadingOrders}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-7 h-7 mx-auto animate-spin text-emerald-400" />
                  <p className="text-xs">Loading your order history from PostgreSQL...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800 p-8">
                  <Package className="w-10 h-10 mx-auto text-slate-600" />
                  <div>
                    <h4 className="text-base font-bold text-white">No Orders Placed Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      You haven't placed any book orders with this account yet. Browse our catalog and enjoy fast doorstep delivery!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      if (onBrowseCatalog) onBrowseCatalog();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md"
                  >
                    <span>Browse Book Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id || order.order_number}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5"
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-bold text-white">
                              {order.order_number}
                            </span>
                            {getPaymentBadge(order.payment_method)}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {order.created_at
                                ? new Date(order.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recent Order'}
                            </span>
                            {order.transaction_id && (
                              <span className="font-mono text-cyan-300">
                                TrxID: {order.transaction_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Order Total</span>
                          <span className="text-base sm:text-lg font-black text-emerald-400">
                            ৳ {parseFloat(order.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Purchased Books ({(order.items || []).length || 1})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(order.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-white truncate block">
                                  {item.title}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Qty: {item.quantity} × ৳{parseFloat(item.unit_price || 0).toFixed(2)}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-emerald-400 shrink-0">
                                ৳ {parseFloat(item.subtotal || (item.unit_price * item.quantity) || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                        <div className="flex items-start gap-1.5 text-slate-400 max-w-md">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] line-clamp-1">{order.shipping_address}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {order.status === 'confirmed'
                              ? 'Confirmed & Packing'
                              : order.status === 'shipped'
                              ? 'Out for Delivery'
                              : order.status === 'delivered'
                              ? 'Delivered'
                              : 'Order Confirmed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED CART & BOOKMARK HISTORY */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                <span className="font-bold">Cart History & Saved Books:</span> Any book you added to cart or saved for later is preserved in your buyer profile so you can checkout whenever ready.
              </div>

              {savedItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Saved for Later ({savedItems.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedItems.map((item) => (
                      <div
                        key={item.bookId}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                      >
                        <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                          {item.cover_image ? (
                            <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-cyan-400">FV</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white text-xs truncate">{item.title}</h5>
                          <p className="text-[11px] text-slate-400 truncate">{item.author}</p>
                          <span className="text-xs font-bold text-emerald-400 mt-1 block">
                            ৳ {item.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => moveToCartFromSaved(item.bookId)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => removeSavedItem(item.bookId)}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cartHistory.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Cart History ({cartHistory.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cartHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                      >
                        <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                          {h.cover_image ? (
                            <img src={h.cover_image} alt={h.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-cyan-400">FV</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white text-xs truncate">{h.title}</h5>
                          <p className="text-[11px] text-slate-400 truncate">{h.author}</p>
                          <span className="text-xs font-bold text-emerald-400 mt-1 block">
                            ৳ {parseFloat(h.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(h, 1);
                            openCart();
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors shrink-0"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedItems.length === 0 && cartHistory.length === 0 && (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No saved books yet. Use the "Save for Later" or "Add to Cart" button on any book card.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT METHODS */}
          {activeTab === 'methods' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Bangladeshi Payment Gateways (No Foreign Credit Card Needed)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  FolioVerse is natively designed for Bangladesh. Foreign card processors like Stripe have been completely removed.
                  All prices are in <strong className="text-white">Bangladeshi Taka (৳ BDT)</strong> and payments are handled via official API gateways or upon doorstep delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* bKash */}
                <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-400 text-sm">bKash (বিকাশ)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300">
                      API Instant
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Pay automatically with bKash API. Simply enter your bKash mobile number during checkout to verify and receive instant confirmation.
                  </p>
                </div>

                {/* Nagad */}
                <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-orange-400 text-sm">Nagad (নগদ)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300">
                      API Instant
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Pay via Bangladesh Post Office Nagad mobile banking API. No manual paperwork required.
                  </p>
                </div>

                {/* Rocket */}
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-400 text-sm">Rocket (রকেট)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      API Instant
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Dutch-Bangla Bank Rocket mobile payment API with instant transaction receipt generation.
                  </p>
                </div>

                {/* Cash on Delivery */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-400 text-sm">Cash on Delivery (COD)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Pay on Delivery
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Inspect your books first! Pay cash to the courier directly upon arrival at your doorstep anywhere in Bangladesh.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Need assistance with an order? Contact our support at <span className="text-cyan-400 font-medium">contact@folioverse.com</span>
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
