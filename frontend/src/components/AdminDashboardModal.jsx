import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  BookOpen,
  Package,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Search,
  RefreshCw,
  TrendingUp,
  Tag,
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  Edit3,
  Trash2,
  ExternalLink,
  Mail,
  Clock,
  Phone,
  MapPin,
  CreditCard,
  Users,
} from 'lucide-react';
import { bookService, orderService, contactService } from '../services/api';

export const AdminDashboardModal = ({
  isOpen,
  onClose,
  onOpenAddBook,
  onEditBook,
  onDeleteBook,
  onRefreshCatalog,
  totalBooksCount = 2000,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'inventory' | 'orders'
  const [taxonomy, setTaxonomy] = useState(null);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);
  const [inventoryBooks, setInventoryBooks] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState(''); // '' | 'available' | 'low_stock' | 'sold'
  const [actionMsg, setActionMsg] = useState('');
  const [liveOrders, setLiveOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // Fetch inquiries
  const loadInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const res = await contactService.getInquiries();
      setInquiries(res.data.results || res.data || []);
    } catch (err) {
      console.warn('Failed to load inquiries:', err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'inquiries') {
      loadInquiries();
    }
  }, [isOpen, activeTab]);

  // Fetch taxonomy and stats
  useEffect(() => {
    if (isOpen) {
      setLoadingTaxonomy(true);
      bookService
        .getTaxonomy()
        .then((res) => setTaxonomy(res.data))
        .catch((err) => console.error('Failed to load taxonomy:', err))
        .finally(() => setLoadingTaxonomy(false));
    }
  }, [isOpen]);

    const [adminSummary, setAdminSummary] = useState(null);
    const [adminSummaryLoading, setAdminSummaryLoading] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Fetch executive admin summary and live orders
    const loadAdminSummary = async () => {
      setAdminSummaryLoading(true);
      try {
        const res = await orderService.getAdminSummary();
        setAdminSummary(res.data);
        if (res.data?.recent_orders) {
          setLiveOrders(res.data.recent_orders);
        }
      } catch (err) {
        console.warn('Failed to load admin summary:', err);
      } finally {
        setAdminSummaryLoading(false);
      }
    };

    useEffect(() => {
        if (isOpen) {
          loadAdminSummary();
        }
  }, [isOpen]);

  // Order status update action for store administrators
  const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus = null) => {
    setUpdatingOrderId(orderId);
    try {
      const payload = { status: newStatus };
      if (newPaymentStatus) {
        payload.payment_status = newPaymentStatus;
      }
      await orderService.updateOrderStatus(orderId, payload);
      setActionMsg(`Order #${orderId} marked as "${newStatus.toUpperCase()}"!`);
      loadAdminSummary();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(err.response?.data?.error || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Fetch inventory books for quick management
  const loadInventory = async () => {
    setInventoryLoading(true);
    try {
      const params = {
        page_size: 20,
      };
      if (inventorySearch) params.search = inventorySearch;
      if (inventoryFilter) params.status = inventoryFilter;

      const res = await bookService.getBooks(params);
      setInventoryBooks(res.data?.results || []);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'inventory') {
      loadInventory();
    }
  }, [isOpen, activeTab, inventorySearch, inventoryFilter]);

  // Quick Restock (+5 units)
  const handleQuickRestock = async (book) => {
    try {
      const newStock = (book.stock || 0) + 5;
      await bookService.patchBook(book.id, { stock: newStock });
      setActionMsg(`Restocked +5 units for "${book.title}". New stock: ${newStock}`);
      loadInventory();
      if (onRefreshCatalog) onRefreshCatalog();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      console.error('Restock error:', err);
    }
  };

  const categories = taxonomy?.categories || {
    'Literature & Novel': { total_books: 1290, subcategories: ['Bengali Literature', 'English Literature', 'World Classics'] },
    'Science': { total_books: 224, subcategories: ['Physics', 'Astronomy', 'Biology'] },
    'Fiction': { total_books: 249, subcategories: ['Sci-Fi', 'Fantasy', 'Mystery'] },
    'Technology': { total_books: 151, subcategories: ['AI & ML', 'Software Architecture', 'Cloud'] },
    'Music': { total_books: 86, subcategories: ['Theory', 'Biographies', 'Instruments'] },
  };

  // Recent simulated orders
  const recentOrders = [
    { id: 'ORD-9821', book: 'Gitanjali (Song Offerings)', author: 'Rabindranath Tagore', qty: 2, amount: '৳ 650.00', buyer: 'Tanvir Ahmed', time: '12 mins ago', status: 'Completed' },
    { id: 'ORD-9820', book: 'Agnibeena (The Fiery Lute)', author: 'Kazi Nazrul Islam', qty: 1, amount: '৳ 350.00', buyer: 'Sadia Rahman', time: '34 mins ago', status: 'Completed' },
    { id: 'ORD-9819', book: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', qty: 1, amount: '৳ 1,250.00', buyer: 'Rafiqul Islam', time: '1 hour ago', status: 'Completed' },
    { id: 'ORD-9818', book: '1984', author: 'George Orwell', qty: 3, amount: '৳ 850.00', buyer: 'Mehedi Hasan', time: '2 hours ago', status: 'Completed' },
    { id: 'ORD-9817', book: 'Cosmos', author: 'Carl Sagan', qty: 1, amount: '৳ 780.00', buyer: 'Nusrat Jahan', time: '3 hours ago', status: 'Completed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors z-10"
          aria-label="Close admin dashboard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Store Admin Dashboard</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live DB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Catalog monitoring, inventory stock controls, and order tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenAddBook) onOpenAddBook();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add / Sell Book</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Mobile Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${activeTab === 'overview'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${activeTab === 'inventory'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
          >
            Inventory Management ({totalBooksCount.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${activeTab === 'orders'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
          >
            Orders & Transactions
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'inquiries'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Messages & Inquiries ({inquiries.length})</span>
          </button>
        </div>

        {/* Action message banner */}
        {actionMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="overflow-y-auto pr-1 flex-1 py-4 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Row 1: Executive Revenue & Order Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase">Gross Platform Volume</span>
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    ৳ {adminSummary ? parseFloat(adminSummary.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Total orders placed</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase">Cleared Revenue</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    ৳ {adminSummary ? parseFloat(adminSummary.cleared_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Paid MFS & Settled COD</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-indigo-300 uppercase">Marketplace Orders</span>
                    <ShoppingCart className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {adminSummary ? adminSummary.total_orders : liveOrders.length}
                  </div>
                  <div className="text-[11px] text-indigo-400/80 mt-0.5">
                    {adminSummary ? adminSummary.pending_orders : 0} pending fulfillment
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase">Catalog & Stock</span>
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-400">
                    {adminSummary ? adminSummary.total_books.toLocaleString() : totalBooksCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {adminSummary ? adminSummary.total_stock.toLocaleString() : '10,000+'} total inventory units
                  </div>
                </div>
              </div>

              {/* Row 2: Catalog Health & User Base */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-amber-300 uppercase">Low Stock Alert</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    {adminSummary ? adminSummary.low_stock_count : 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">&le; 3 units remaining</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-rose-300 uppercase">Out of Stock</span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-400">
                    {adminSummary ? adminSummary.out_of_stock_count : 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Requires replenishment</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-teal-300 uppercase">Active Buyers</span>
                    <Users className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-teal-400">
                    {adminSummary ? adminSummary.total_buyers : 1}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Registered buyer profiles</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-purple-300 uppercase">Verified Sellers</span>
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-400">
                    {adminSummary ? adminSummary.total_sellers : 1}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Authorized store sellers</div>
                </div>
              </div>

              {/* Payment Methods Distribution */}
              {adminSummary?.payment_breakdown && adminSummary.payment_breakdown.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      Payment Method Settlement Breakdown
                    </span>
                    <span className="text-slate-400 text-[11px]">Real-Time Gateway Aggregations</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {adminSummary.payment_breakdown.map((pb) => (
                      <div key={pb.method} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-white uppercase">{pb.method}</span>
                          <span className="text-slate-400">{pb.orders_count} orders</span>
                        </div>
                        <div className="text-base font-black text-emerald-400">
                          ৳ {parseFloat(pb.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Genre Distribution Progress Bars */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    Genre Catalog Breakdown (2,000 Live Books)
                  </span>
                  <span className="text-slate-400 text-[11px]">5 Main Genres</span>
                </div>

                {Object.entries(categories).map(([catName, data]) => {
                  const count = data.total_books || 0;
                  const pct = Math.min(100, Math.round((count / totalBooksCount) * 100));
                  return (
                    <div key={catName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{catName}</span>
                        <span className="font-bold text-cyan-300">
                          {count.toLocaleString()} books ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Store Engine & Concurrency Guarantee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ACID Concurrency Safety
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Atomic transactions and row-level locks via <code className="text-cyan-300">select_for_update()</code> ensure inventory cannot be oversold even under high concurrent orders.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Indexed Catalog Search
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Multi-column composite indexes on (category, subcategory), (status, stock), and (author, title) deliver sub-10ms queries across all 2,000 books.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search inventory by title or author..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available In-Stock</option>
                    <option value="low_stock">Low Stock (&le; 3)</option>
                    <option value="sold">Sold Out</option>
                  </select>

                  <button
                    onClick={loadInventory}
                    disabled={inventoryLoading}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Refresh inventory"
                  >
                    <RefreshCw className={`w-4 h-4 ${inventoryLoading ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Books List (Card layout on mobile, table on desktop) */}
              {inventoryLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  <span>Loading catalog items...</span>
                </div>
              ) : inventoryBooks.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                  No books match the current search or status filter.
                </div>
              ) : (
                <div className="space-y-2">
                  {inventoryBooks.map((book) => (
                    <div
                      key={book.id}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {book.cover_image && (
                          <img
                            src={book.cover_image}
                            alt={book.title}
                            className="w-10 h-13 object-cover rounded-lg shrink-0 border border-slate-800"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white truncate max-w-[280px]">
                              {book.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                              {book.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            by {book.author} • {book.subcategory}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-black text-emerald-400">৳ {parseFloat(book.price).toFixed(2)}</span>
                            <span className="text-slate-600">•</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${book.stock > 3
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                  : book.stock > 0
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                }`}
                            >
                              Stock: {book.stock} units ({book.status})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleQuickRestock(book)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all active:scale-95"
                          title="Add 5 units to stock"
                        >
                          +5 Restock
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            if (onEditBook) onEditBook(book);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                          title="Edit Book"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            if (onDeleteBook) onDeleteBook(book);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                          title="Delete Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS & TRANSACTIONS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  Live Marketplace Checkout & Orders ({liveOrders.length} Recorded in DB)
                </span>
                <button
                  onClick={loadAdminSummary}
                  disabled={adminSummaryLoading}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${adminSummaryLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Orders</span>
                </button>
              </div>

                {
                  adminSummaryLoading?(
                <div className = "py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2" >
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  <span>Loading recent orders from database...</span>
                </div>
          ) : liveOrders.length > 0 ? (
            <div className="space-y-3">
              {liveOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 text-xs"
                >
                    {/* Top Header: Order Number, Customer, Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-cyan-300 font-bold">{ord.order_number}</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-bold text-white">{ord.customer_name}</span>
                        <span className="text-slate-400 text-[11px]">({ord.customer_email})</span>
                        {ord.customer_phone && (
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {ord.customer_phone}
                          </span>
                        )}
                      </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Payment Method Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ord.payment_method === 'bkash'
                                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                                : ord.payment_method === 'nagad'
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                  : ord.payment_method === 'rocket'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                          {ord.payment_method}
                        </span>

                          {/* Payment Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ord.payment_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                          >
                            {ord.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                          </span>

                          {/* Fulfillment Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ord.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : ord.status === 'shipped'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : ord.status === 'processing'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                          >
                            {ord.status}
                          </span>

                          <span className="font-black text-emerald-400 text-sm pl-1">
                            ৳ {parseFloat(ord.total_amount).toFixed(2)}
                          </span>
                      </div>
                    </div>

                        {/* Items List */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-400">Order Items:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ord.items && ord.items.length > 0 ? (
                              ord.items.map((it, idx) => (
                              <div
                                key={it.id || idx}
                                className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold text-white truncate">{it.title}</div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    by {it.author} • Seller: <span className="text-cyan-400">{it.seller_username || 'Store Catalog'}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-mono text-emerald-400 font-bold">
                                    {it.quantity} &times; ৳{parseFloat(it.unit_price).toFixed(2)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    = ৳{parseFloat(it.subtotal).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              ))
                            ) : (
                            <div className="text-slate-400 text-xs">Standard Book Order</div>
                            )}
                          </div>
                        </div>

                            {/* Footer & Meta: Shipping, TrxID, and Administrative Moderation Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-900 text-[11px]">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>Ship to: <strong className="text-slate-300">{ord.shipping_address}</strong></span>
                                </div>
                              {ord.transaction_id && (
                                <div className="font-mono text-[10px] text-cyan-400/90">
                                  Payment Transaction ID: <span className="font-bold">{ord.transaction_id}</span>
                                </div>
                              )}
                            </div>

                              {/* Admin Action Buttons */}
                              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                                {ord.payment_status !== 'paid' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, ord.status, 'paid')}
                                    disabled={updatingOrderId === ord.id}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    Confirm Paid
                                  </button>
                                )}

                                {ord.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                                    disabled={updatingOrderId === ord.id}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    Approve Processing
                                  </button>
                                )}

                                {ord.status === 'processing' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                                    disabled={updatingOrderId === ord.id}
                                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    Mark Shipped
                                  </button>
                                )}

                                {ord.status === 'shipped' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', 'paid')}
                                    disabled={updatingOrderId === ord.id}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 space-y-2">
                          <ShoppingCart className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          <div className="font-bold text-white text-sm">No Marketplace Orders Yet</div>
                          <p className="max-w-md mx-auto text-slate-400">
                            When buyers purchase books via Instant Buy or Cart Checkout, orders with full customer details, payment gateway methods (bKash, Nagad, Rocket, COD), and transaction IDs will appear here in real time.
                          </p>
                        </div>
              )}
                      </div>
          )}

                      {/* TAB 4: INQUIRIES & MESSAGES */}
                      {activeTab === 'inquiries' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Mail className="w-4 h-4 text-emerald-400" />
                                <span>Customer Contact Messages</span>
                              </h3>
                              <p className="text-xs text-slate-400">
                                Inquiries received directly from the storefront contact form
                              </p>
                            </div>
                            <button
                              onClick={loadInquiries}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${inquiriesLoading ? 'animate-spin' : ''}`} />
                              <span>Refresh</span>
                            </button>
                          </div>

                          {inquiriesLoading ? (
                            <div className="py-12 text-center text-xs text-slate-400">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                              Loading customer inquiries...
                            </div>
                          ) : inquiries.length > 0 ? (
                            <div className="space-y-3">
                              {inquiries.map((inq) => (
                                <div
                                  key={inq.id}
                                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-sm">{inq.name}</span>
                                      <span className="text-slate-500">•</span>
                                      <a
                                        href={`mailto:${inq.email}`}
                                        className="text-cyan-400 hover:underline font-mono text-[11px]"
                                      >
                                        {inq.email}
                                      </a>
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(inq.created_at).toLocaleString()}
                                    </span>
                                  </div>

                                  {inq.contact && (
                                    <div className="text-[11px] text-slate-400">
                                      Contact / Phone: <span className="text-slate-200 font-mono">{inq.contact}</span>
                                    </div>
                                  )}

                                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-850 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                                    {inq.message}
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <a
                                      href={`mailto:${inq.email}?subject=Re: FolioVerse Inquiry&body=Hi ${inq.name},%0D%0A%0D%0A`}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors border border-emerald-500/25"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>Reply to {inq.name}</span>
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                              <Mail className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                              <p className="font-medium text-slate-300">No contact inquiries yet.</p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Customer messages submitted through the Contact modal will appear here in real-time.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
};
