import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Store,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { orderService, bookService } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * SellerDashboardModal — Dedicated Seller Operations Portal
 * Enables sellers to:
 * 1. Inspect incoming customer orders (who ordered their books, quantities, and payment status).
 * 2. Approve and fulfill orders (transition from confirmed -> processing -> shipped -> delivered).
 * 3. Moderate book catalog listings: edit prices, adjust stock, review conditions, and delete listings.
 * 4. Add new books to the store catalog.
 */
export function SellerDashboardModal({
  isOpen,
  onClose,
  onOpenAddBook,
  onEditBook,
  onRefreshCatalog,
}) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'catalog'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Seller summary data
  const [sellerData, setSellerData] = useState({
    seller_username: '',
    seller_email: '',
    total_listed_books: 0,
    active_stock: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_sold_units: 0,
    total_revenue: '0.00',
    pending_fulfillments: 0,
    incoming_orders: [],
    catalog_books: [],
  });

  // Filter states
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'shipped' | 'delivered'
  const [bookSearch, setBookSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  
  // Quick price editing state
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStock, setNewStock] = useState('');

  // Fetch seller summary
  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await orderService.getSellerSummary({
        username: user?.username || 'seller_demo',
      });
      setSellerData(res.data);
    } catch (err) {
      console.error('Failed to load seller summary:', err);
      setErrorMsg(
        err.response?.data?.error ||
          'Unable to load seller data. Please verify network and authentication.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchSellerData();
    }
  }, [isOpen, fetchSellerData]);

  // Order status update / approval handler
  const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus = null) => {
    setUpdatingOrderId(orderId);
    try {
      const payload = { status: newStatus };
      if (newPaymentStatus) {
        payload.payment_status = newPaymentStatus;
      }

      await orderService.updateOrderStatus(orderId, payload);
      setSuccessToast(`Order #${orderId} marked as "${newStatus.toUpperCase()}"!`);
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchSellerData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(err.response?.data?.error || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Quick Price update handler
  const handleSavePrice = async (bookId) => {
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 180) {
      alert('Price must be a valid number of at least ৳180.00.');
      return;
    }

    try {
      await bookService.patchBook(bookId, { price: parsedPrice.toFixed(2) });
      setSuccessToast(`Book price updated to ৳${parsedPrice.toFixed(2)}`);
      setTimeout(() => setSuccessToast(''), 3000);
      setEditingPriceId(null);
      await fetchSellerData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      console.error('Failed to update price:', err);
      alert(err.response?.data?.price?.[0] || 'Price update failed.');
    }
  };

  // Quick Stock update handler
  const handleSaveStock = async (bookId) => {
    const parsedStock = parseInt(newStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      alert('Stock quantity must be a non-negative integer.');
      return;
    }

    try {
      await bookService.patchBook(bookId, { stock: parsedStock });
      setSuccessToast(`Stock updated to ${parsedStock} units.`);
      setTimeout(() => setSuccessToast(''), 3000);
      setEditingStockId(null);
      await fetchSellerData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      console.error('Failed to update stock:', err);
      alert('Stock update failed.');
    }
  };

  // Delete book handler
  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your seller listings?`)) {
      return;
    }

    try {
      await bookService.patchBook(bookId, { stock: 0, status: 'sold' });
      setSuccessToast(`"${title}" delisted from store.`);
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchSellerData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err) {
      console.error('Failed to delist book:', err);
      alert('Failed to delist book.');
    }
  };

  if (!isOpen) return null;

  // Filtered incoming orders
  const filteredOrders = (sellerData.incoming_orders || []).filter((ord) => {
    if (orderFilter === 'pending') {
      return ord.status === 'confirmed' || ord.status === 'processing';
    }
    if (orderFilter === 'shipped') {
      return ord.status === 'shipped';
    }
    if (orderFilter === 'delivered') {
      return ord.status === 'delivered';
    }
    return true;
  });

  // Filtered catalog books
  const filteredBooks = (sellerData.catalog_books || []).filter((book) => {
    if (!bookSearch.trim()) return true;
    const query = bookSearch.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      (book.category && book.category.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-4 sm:p-6 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-2xl shadow-inner">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">Seller Operations Portal</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider backdrop-blur-sm border border-white/30">
                  Seller Portal
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5 flex items-center gap-2">
                <span>Store Partner: <strong>{sellerData.seller_username || user?.username || 'seller_demo'}</strong></span>
                <span>•</span>
                <span>FolioVerse Verified Merchant</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenAddBook) onOpenAddBook();
              }}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-amber-50 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>List New Book</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Metrics KPI Cards Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Total Revenue */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">Sales Revenue</span>
                <span className="text-base sm:text-lg font-black text-amber-400">৳ {sellerData.total_revenue}</span>
              </div>
            </div>

            {/* KPI 2: Books Sold */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">Units Sold</span>
                <span className="text-base sm:text-lg font-black text-cyan-300">{sellerData.total_sold_units} copies</span>
              </div>
            </div>

            {/* KPI 3: Awaiting Fulfillment */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">Needs Action</span>
                <span className="text-base sm:text-lg font-black text-rose-400">{sellerData.pending_fulfillments} orders</span>
              </div>
            </div>

            {/* KPI 4: Active Listings */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">Catalog Listings</span>
                <span className="text-base sm:text-lg font-black text-emerald-300">{sellerData.total_listed_books} titles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Incoming Buyer Orders ({sellerData.incoming_orders?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catalog Management & Prices ({sellerData.total_listed_books})</span>
            </button>
          </div>

          <button
            onClick={fetchSellerData}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh Seller Portal"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading && !sellerData.total_listed_books ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Loading seller dashboard & incoming orders...</p>
            </div>
          ) : activeTab === 'orders' ? (
            /* TAB 1: INCOMING BUYER ORDERS & FULFILLMENT */
            <div className="space-y-4">
              
              {/* Order Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Orders ({sellerData.incoming_orders?.length || 0})
                  </button>
                  <button
                    onClick={() => setOrderFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Awaiting Action ({sellerData.pending_fulfillments})
                  </button>
                  <button
                    onClick={() => setOrderFilter('shipped')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'shipped' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    In Transit
                  </button>
                  <button
                    onClick={() => setOrderFilter('delivered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === 'delivered' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Completed
                  </button>
                </div>

                <div className="text-xs text-slate-400">
                  Showing <strong>{filteredOrders.length}</strong> customer order(s)
                </div>
              </div>

              {/* Order Cards List */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-slate-950/60 border border-slate-800/80 p-6 space-y-2">
                  <Truck className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Orders in this Status</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When buyers purchase books listed by you, their shipping information, payment clearance, and line items will appear here for immediate approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord) => {
                    const isPaid = ord.payment_status === 'paid' || ['bkash', 'nagad', 'rocket'].includes(ord.payment_method?.toLowerCase());
                    const isUpdating = updatingOrderId === ord.order_id;

                    return (
                      <div
                        key={ord.order_id}
                        className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                      >
                        {/* Order Top Meta */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-extrabold text-amber-400">
                              #{ord.order_number}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(ord.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Payment Status Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wide border ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {isPaid ? 'Payment Cleared' : 'Pending Payment'} ({ord.payment_method.toUpperCase()})
                            </span>

                            {/* Fulfillment Status Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                                ord.status === 'delivered'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : ord.status === 'shipped'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : ord.status === 'processing'
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Shipping Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/60">
                          {/* Buyer Info */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                              Customer Information
                            </span>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{ord.customer_name}</span>
                            </div>
                            <div className="text-slate-300 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ord.customer_email}</span>
                            </div>
                            <div className="text-slate-300 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{ord.customer_phone || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                              Delivery Destination
                            </span>
                            <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{ord.shipping_address || 'Standard Address'}</span>
                            </div>
                            {ord.transaction_id && (
                              <div className="font-mono text-[11px] text-cyan-400 pt-1">
                                TrxID: {ord.transaction_id}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ordered Books by this Seller */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                            Your Books Ordered ({ord.seller_items?.length} title(s))
                          </span>
                          <div className="space-y-2">
                            {ord.seller_items?.map((item) => (
                              <div
                                key={item.item_id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                              >
                                <div>
                                  <h5 className="font-bold text-white">{item.title}</h5>
                                  <p className="text-slate-400 text-[11px]">
                                    by {item.author} • <span className="text-amber-400">{item.category}</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400">{item.quantity} x ৳{item.unit_price}</span>
                                  <span className="font-bold text-white block">৳ {item.subtotal}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Actions Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-xs text-slate-400">Your Share: </span>
                            <span className="text-base font-extrabold text-amber-400">৳ {ord.seller_subtotal}</span>
                          </div>

                          {/* Status Progression Buttons */}
                          <div className="flex items-center gap-2">
                            {ord.status === 'confirmed' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'processing')}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                              >
                                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Approve & Prepare Shipment
                              </button>
                            )}

                            {ord.status === 'processing' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'shipped')}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                              >
                                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                                Dispatch with Courier (Mark Shipped)
                              </button>
                            )}

                            {ord.status === 'shipped' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateOrderStatus(ord.order_id, 'delivered', 'paid')}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                              >
                                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Confirm Delivery & Settle Funds
                              </button>
                            )}

                            {ord.status === 'delivered' && (
                              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Order Successfully Fulfilled
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: CATALOG MANAGEMENT & PRICE MODERATION */
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search your titles, author, genre..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Total: <strong>{filteredBooks.length}</strong> listed book(s)
                  </span>
                  <button
                    onClick={() => {
                      if (onOpenAddBook) onOpenAddBook();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Book</span>
                  </button>
                </div>
              </div>

              {/* Books Moderation Table / Cards */}
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-slate-950/60 border border-slate-800/80 p-6 space-y-2">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Books Found</h4>
                  <p className="text-xs text-slate-500">
                    You have not listed any books matching this search query. Click "Add Book" to list a new title.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBooks.map((book) => {
                    const isEditingPrice = editingPriceId === book.id;
                    const isEditingStock = editingStockId === book.id;

                    return (
                      <div
                        key={book.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Book Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {book.cover_image ? (
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className="font-bold text-white text-sm truncate">{book.title}</h5>
                            <p className="text-slate-400 text-xs">by {book.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                                {book.category}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {book.condition || 'New'} • {book.language || 'English'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Stock Moderation Controls */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs shrink-0">
                          {/* Price Moderation */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-medium block">Price (BDT)</span>
                            {isEditingPrice ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="180"
                                  step="10"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  className="w-20 px-2 py-1 bg-slate-900 border border-amber-500 rounded-lg text-white font-mono text-xs focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSavePrice(book.id)}
                                  className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                  title="Save Price"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingPriceId(null)}
                                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-emerald-400 font-mono">
                                  ৳ {book.price}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingPriceId(book.id);
                                    setNewPrice(book.price);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-amber-400 transition-all"
                                  title="Moderate Price"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stock Moderation */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-medium block">Inventory</span>
                            {isEditingStock ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  value={newStock}
                                  onChange={(e) => setNewStock(e.target.value)}
                                  className="w-16 px-2 py-1 bg-slate-900 border border-cyan-500 rounded-lg text-white font-mono text-xs focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSaveStock(book.id)}
                                  className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                  title="Save Stock"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingStockId(null)}
                                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    book.stock === 0
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : book.stock <= 3
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {book.stock} in stock
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingStockId(book.id);
                                    setNewStock(book.stock);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-all"
                                  title="Adjust Stock"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                            <button
                              onClick={() => {
                                if (onEditBook) onEditBook(book);
                              }}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
                              title="Edit Full Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                              title="Delist Book"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>FolioVerse Verified Marketplace • Instant Order Approval Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
}
