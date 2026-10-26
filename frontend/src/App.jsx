import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { bookService } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FilterBar } from './components/FilterBar';
import { BookGrid } from './components/BookGrid';
import { Pagination } from './components/Pagination';
import { AuthModal } from './components/AuthModal';
import { BookModal } from './components/BookModal';
import { BookDetailModal } from './components/BookDetailModal';
import { BuyBookModal } from './components/BuyBookModal';
import { SellBookModal } from './components/SellBookModal';
import { ContactModal } from './components/ContactModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/Toast';
import { RefreshCw, BookOpen, ShoppingBag, ShieldCheck, Mail, Shield, Phone } from 'lucide-react';

function FolioVerseContent() {
  const { isAuthenticated } = useAuth();

  // Books state
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search & Taxonomy Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [ordering, setOrdering] = useState('');

  // Health & connection state
  const [apiConnected, setApiConnected] = useState(true);

  // Modals state
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login', role: 'buyer' });
  const [bookModal, setBookModal] = useState({ open: false, book: null });
  const [detailModal, setDetailModal] = useState({ open: false, book: null });
  const [buyModal, setBuyModal] = useState({ open: false, book: null });
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, book: null });

  // Cart toast sync
  const { toastMessage } = useCart();

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type, title }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (toastMessage) {
      addToast(toastMessage.text, toastMessage.type || 'info');
    }
  }, [toastMessage, addToast]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch books from Django REST Framework (10 items per page)
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: 10,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      if (subcategoryFilter) {
        params.subcategory = subcategoryFilter;
      }
      if (inStockOnly) {
        params.in_stock = true;
      }
      if (ordering) {
        params.ordering = ordering;
      }

      const res = await bookService.getBooks(params);
      const data = res.data;

      if (data && data.results) {
        setBooks(data.results);
        setTotalBooks(data.count || 0);
        setTotalPages(data.total_pages || Math.ceil((data.count || 1) / 10));
      } else if (Array.isArray(data)) {
        setBooks(data);
        setTotalBooks(data.length);
        setTotalPages(1);
      }

      setApiConnected(true);
    } catch (err) {
      console.error('Error fetching books:', err);
      if (err.response?.status === 429) {
        addToast(
          'Request rate limit exceeded. Anonymous users are limited to 20 req/min, authenticated users to 50 req/min.',
          'warning',
          'Rate Throttled (429)'
        );
      } else {
        setApiConnected(false);
        addToast(
          'Unable to communicate with Django REST Framework backend. Ensure the server is running on port 8000.',
          'error',
          'API Offline'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, categoryFilter, subcategoryFilter, inStockOnly, ordering, addToast]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Check health on startup
  useEffect(() => {
    bookService
      .checkHealth()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setSubcategoryFilter('');
    setInStockOnly(false);
    setOrdering('');
    setCurrentPage(1);
  };

  // Require Auth guard
  const handleRequireAuth = (customMsg) => {
    addToast(customMsg || 'Authentication required for this operation.', 'warning', 'Auth Required');
    setAuthModal({ open: true, mode: 'login', role: 'seller' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Book Store Navbar with FolioVerse Logo, Dashboard, Contact & Role CTAs */}
      <Navbar
        onOpenAuth={(mode = 'login', role = 'buyer') => setAuthModal({ open: true, mode, role })}
        onOpenSellBook={() => setSellModalOpen(true)}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenDashboard={() => setAdminDashboardOpen(true)}
        onSelectCategory={(cat) => {
          setCategoryFilter(cat);
          setSubcategoryFilter('');
          setCurrentPage(1);
        }}
        onSelectSubcategory={(sub) => {
          setSubcategoryFilter(sub);
          setCurrentPage(1);
        }}
        selectedCategory={categoryFilter}
        selectedSubcategory={subcategoryFilter}
        apiConnected={apiConnected}
        bookCount={totalBooks}
      />

      {/* Main Bookstore Container */}
      <main className="flex-1">
        {/* Bookstore Hero Section */}
        <HeroSection
          totalBooks={totalBooks}
          onOpenSellBook={() => setSellModalOpen(true)}
          onOpenAuth={(mode = 'register', role = 'buyer') => setAuthModal({ open: true, mode, role })}
          onOpenContact={() => setContactModalOpen(true)}
          onSelectCategory={(cat) => {
            setCategoryFilter(cat);
            setSubcategoryFilter('');
            setCurrentPage(1);
          }}
          onSelectSubcategory={(sub) => {
            setSubcategoryFilter(sub);
            setCurrentPage(1);
          }}
        />

        {/* Catalog Section */}
        <section id="catalog" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                  <span>Available Books Catalog</span>
                </h2>
                <button
                  onClick={fetchBooks}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                  title="Refresh books list from PostgreSQL"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Browse, buy, and inspect verified books with live stock and multi-language support.
              </p>
            </div>

            {/* Pagination & Active Filter Status */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {categoryFilter && (
                <div className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold">
                  {categoryFilter} {subcategoryFilter ? `• ${subcategoryFilter}` : ''}
                </div>
              )}
              <div>
                Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                <span className="font-semibold text-white">{totalPages || 1}</span>
              </div>
            </div>
          </div>

          {/* Filter Bar with Categories & Subcategories */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            categoryFilter={categoryFilter}
            onCategoryChange={(cat) => {
              setCategoryFilter(cat);
              setCurrentPage(1);
            }}
            subcategoryFilter={subcategoryFilter}
            onSubcategoryChange={(sub) => {
              setSubcategoryFilter(sub);
              setCurrentPage(1);
            }}
            inStockOnly={inStockOnly}
            onInStockToggle={(val) => {
              setInStockOnly(val);
              setCurrentPage(1);
            }}
            ordering={ordering}
            onOrderingChange={(val) => {
              setOrdering(val);
              setCurrentPage(1);
            }}
            onResetFilters={handleResetFilters}
            totalResults={totalBooks}
          />

          {/* Book Cards Grid (10 books per page) */}
          <BookGrid
            books={books}
            loading={loading}
            onViewBook={(book) => setDetailModal({ open: true, book })}
            onBuyBook={(book) => setBuyModal({ open: true, book })}
            onEditBook={(book) => setBookModal({ open: true, book })}
            onDeleteBook={(book) => setDeleteModal({ open: true, book })}
            isAuthenticated={isAuthenticated}
            onRequireAuth={handleRequireAuth}
            onResetFilters={handleResetFilters}
          />

          {/* Pagination Controls (10 items per page with sliding window for 200+ pages) */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalBooks}
            pageSize={10}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        </section>
      </main>

      {/* Buy Book Instant Checkout Modal */}
      <BuyBookModal
        isOpen={buyModal.open}
        book={buyModal.book}
        onClose={() => setBuyModal({ open: false, book: null })}
        onSuccess={(msg) => {
          addToast(msg, 'success', 'Order Confirmed');
          fetchBooks();
        }}
      />

      {/* Sell a Book Listing Modal */}
      <SellBookModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        onSuccess={(msg) => {
          addToast(msg, 'success', 'Book Listed for Sale');
          fetchBooks();
        }}
      />

      {/* Contact Modal (direct to bipronathsaha@gmail.com) */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success', 'Message Prepared')}
      />

      {/* Store Admin & Seller Dashboard (Mobile Responsive) */}
      <AdminDashboardModal
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
        onOpenAddBook={() => setSellModalOpen(true)}
        onEditBook={(book) => setBookModal({ open: true, book })}
        onDeleteBook={(book) => setDeleteModal({ open: true, book })}
        onRefreshCatalog={fetchBooks}
        totalBooksCount={totalBooks}
      />

      {/* Book Detail Modal with Instant Buy Button */}
      <BookDetailModal
        isOpen={detailModal.open}
        book={detailModal.book}
        onClose={() => setDetailModal({ open: false, book: null })}
        onBuy={(book) => setBuyModal({ open: true, book })}
        onEdit={(book) => {
          setDetailModal({ open: false, book: null });
          setBookModal({ open: true, book });
        }}
        onDelete={(book) => {
          setDetailModal({ open: false, book: null });
          setDeleteModal({ open: true, book });
        }}
        isAuthenticated={isAuthenticated}
        onRequireAuth={handleRequireAuth}
      />

      {/* Edit / Add Book Modal */}
      <BookModal
        isOpen={bookModal.open}
        bookToEdit={bookModal.book}
        onClose={() => setBookModal({ open: false, book: null })}
        onSuccess={(msg) => {
          addToast(msg, 'success');
          fetchBooks();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        book={deleteModal.book}
        onClose={() => setDeleteModal({ open: false, book: null })}
        onSuccess={(msg) => {
          addToast(msg, 'success', 'Book Removed');
          fetchBooks();
        }}
      />

      {/* Authentication Modal with Role Selection (Buyer vs Seller) and Demo Logins */}
      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        initialRole={authModal.role}
        onClose={() => setAuthModal({ open: false, mode: 'login', role: 'buyer' })}
        onSuccess={(msg) => addToast(msg, 'success', 'Authenticated')}
      />

      {/* Slide-out Cart Drawer with Multi-Option Checkout (Stripe, bKash, Nagad, Rocket, COD) */}
      <CartDrawer
        onOrderPlaced={(order) => {
          addToast(`Order #${order.order_number} successfully placed!`, 'success', 'Order Confirmed');
          fetchBooks();
        }}
      />

      {/* Professional Bookstore Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/95 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 text-xs text-slate-400">
            {/* Brand & Mission */}
            <div className="max-w-md text-center lg:text-left space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <span className="font-extrabold text-white text-base bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                  FolioVerse
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-medium">Digital Book Shop</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Science, Technology, Fiction, Bengali & English Literature, and Music. Curated books delivered seamlessly with real-time inventory.
              </p>
            </div>

            {/* Direct Contact Info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl text-xs">
              <a
                href="tel:+8801559503222"
                className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Call Us</span>
                  <span className="font-mono text-slate-200 font-semibold">+8801559503222</span>
                </div>
              </a>

              <div className="hidden sm:block w-px h-8 bg-slate-800"></div>

              <a
                href="mailto:contact@folioverse.com"
                className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Email</span>
                  <span className="font-mono text-slate-200 font-semibold">contact@folioverse.com</span>
                </div>
              </a>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 font-medium">
              <button
                onClick={() => setSellModalOpen(true)}
                className="hover:text-emerald-400 transition-colors font-bold text-emerald-300 flex items-center gap-1 text-xs"
              >
                List a Book
              </button>
              <span className="text-slate-700">•</span>
              <a href="#catalog" className="hover:text-white transition-colors text-xs">
                Buy Books
              </a>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => setContactModalOpen(true)}
                className="hover:text-emerald-400 text-slate-300 transition-colors flex items-center gap-1.5 font-semibold text-xs"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact</span>
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => setAdminDashboardOpen(true)}
                className="hover:text-cyan-400 text-slate-300 transition-colors flex items-center gap-1.5 font-semibold text-xs"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Store Dashboard</span>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
            <p>© {new Date().getFullYear()} FolioVerse Book Store. All rights reserved.</p>
            <p className="text-slate-400">Direct inquiries routed to <span className="text-emerald-400 font-mono">bipronathsaha@gmail.com</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FolioVerseContent />
      </CartProvider>
    </AuthProvider>
  );
}
