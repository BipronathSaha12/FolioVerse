import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/Toast';
import { BookDetailPage } from './pages/BookDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { BuyerDashboardPage } from './pages/BuyerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { RefreshCw, BookOpen, ShoppingBag, ShieldCheck, Mail, Phone } from 'lucide-react';

function CatalogHome({
  totalBooks,
  setSellModalOpen,
  setAuthModal,
  setContactModalOpen,
  categoryFilter,
  setCategoryFilter,
  subcategoryFilter,
  setSubcategoryFilter,
  setCurrentPage,
  fetchBooks,
  loading,
  currentPage,
  totalPages,
  searchQuery,
  setSearchQuery,
  inStockOnly,
  setInStockOnly,
  ordering,
  setOrdering,
  handleResetFilters,
  books,
  onViewBook,
  onBuyBook,
  setBookModal,
  setDeleteModal,
  isAuthenticated,
  handleRequireAuth,
  handleSeedDatabase,
  isSeeding,
}) {
  return (
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
          onViewBook={onViewBook}
          onBuyBook={onBuyBook}
          onEditBook={(book) => setBookModal({ open: true, book })}
          onDeleteBook={(book) => setDeleteModal({ open: true, book })}
          isAuthenticated={isAuthenticated}
          onRequireAuth={handleRequireAuth}
          onResetFilters={handleResetFilters}
          onSeedDatabase={handleSeedDatabase}
          isSeeding={isSeeding}
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
  );
}

function FolioVerseContent() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSeller } = useAuth();
  const { openCart, addToCart } = useCart();

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
          'Request rate limit exceeded. Anonymous users are limited to 30 req/min, authenticated users to 60 req/min.',
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

  // Automated Database Seeding (No paid shell needed)
  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    addToast('Populating 2,000 books and demo accounts into database...', 'info', 'Seeding Started');
    try {
      const res = await bookService.seedDatabase();
      addToast(res.data?.message || 'Successfully seeded 2,000 books!', 'success', 'Catalog Ready');
      await fetchBooks();
    } catch (err) {
      console.error('Failed to seed database:', err);
      addToast('Failed to seed database. Check your backend status.', 'error', 'Seeding Error');
    } finally {
      setIsSeeding(false);
    }
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
        onOpenDashboard={() => navigate('/dashboard/admin')}
        onOpenBuyerDashboard={() => navigate('/dashboard/buyer')}
        onOpenSellerDashboard={() => navigate('/dashboard/seller')}
        onSelectCategory={(cat) => {
          setCategoryFilter(cat);
          setSubcategoryFilter('');
          setCurrentPage(1);
          navigate('/');
        }}
        onSelectSubcategory={(sub) => {
          setSubcategoryFilter(sub);
          setCurrentPage(1);
          navigate('/');
        }}
        selectedCategory={categoryFilter}
        selectedSubcategory={subcategoryFilter}
        apiConnected={apiConnected}
        bookCount={totalBooks}
      />

      {/* React Router Routes View Area */}
      <div className="flex-1">
        <Routes>
          {/* Main Catalog Home */}
          <Route
            path="/"
            element={
              <CatalogHome
                totalBooks={totalBooks}
                setSellModalOpen={setSellModalOpen}
                setAuthModal={setAuthModal}
                setContactModalOpen={setContactModalOpen}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                subcategoryFilter={subcategoryFilter}
                setSubcategoryFilter={setSubcategoryFilter}
                setCurrentPage={setCurrentPage}
                fetchBooks={fetchBooks}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                ordering={ordering}
                setOrdering={setOrdering}
                handleResetFilters={handleResetFilters}
                books={books}
                onViewBook={(book) => navigate(`/books/${book.id}`)}
                onBuyBook={(book) => {
                  addToCart(book, 1);
                  navigate('/checkout');
                }}
                setBookModal={setBookModal}
                setDeleteModal={setDeleteModal}
                isAuthenticated={isAuthenticated}
                handleRequireAuth={handleRequireAuth}
                handleSeedDatabase={handleSeedDatabase}
                isSeeding={isSeeding}
              />
            }
          />

          {/* Dedicated Book Detail Route (/books/:id) */}
          <Route
            path="/books/:id"
            element={
              <BookDetailPage
                onEditBook={(book) => setBookModal({ open: true, book })}
                onDeleteBook={(book) => setDeleteModal({ open: true, book })}
                addToast={addToast}
              />
            }
          />

          {/* Dedicated Cart Route (/cart) */}
          <Route path="/cart" element={<CartPage />} />

          {/* Dedicated Checkout Route (/checkout) */}
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                onOrderPlaced={(order) => {
                  addToast(`Order #${order.order_number} successfully placed!`, 'success', 'Order Confirmed');
                  fetchBooks();
                }}
                addToast={addToast}
              />
            }
          />

          {/* Dedicated Seller Portal Route (/dashboard/seller) */}
          <Route
            path="/dashboard/seller"
            element={
              <SellerDashboardPage
                onOpenAddBook={() => setSellModalOpen(true)}
                onEditBook={(book) => setBookModal({ open: true, book })}
                onRefreshCatalog={fetchBooks}
              />
            }
          />

          {/* Dedicated Buyer Dashboard Route (/dashboard/buyer) */}
          <Route path="/dashboard/buyer" element={<BuyerDashboardPage />} />

          {/* Dedicated Admin Dashboard Route (/dashboard/admin) */}
          <Route
            path="/dashboard/admin"
            element={
              <AdminDashboardPage
                onOpenAddBook={() => setSellModalOpen(true)}
                onEditBook={(book) => setBookModal({ open: true, book })}
                onDeleteBook={(book) => setDeleteModal({ open: true, book })}
                onRefreshCatalog={fetchBooks}
              />
            }
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Buy Book Instant Checkout Modal (Fallback) */}
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

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success', 'Message Prepared')}
      />

      {/* Book Detail Modal (Fallback for quick modal views) */}
      <BookDetailModal
        isOpen={detailModal.open}
        book={detailModal.book}
        onClose={() => setDetailModal({ open: false, book: null })}
        onBuy={(book) => {
          setDetailModal({ open: false, book: null });
          addToCart(book, 1);
          navigate('/checkout');
        }}
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

      {/* Slide-out Cart Drawer with Multi-Option Checkout */}
      <CartDrawer
        onOrderPlaced={(order) => {
          addToast(`Order #${order.order_number} successfully placed!`, 'success', 'Order Confirmed');
          fetchBooks();
        }}
      />

      {/* Professional Bookstore Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/95 pt-8 pb-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-slate-400">
            {/* Brand & Mission */}
            <div className="max-w-lg text-center md:text-left space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Link to="/" className="font-extrabold text-white text-base bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                  FolioVerse
                </Link>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-medium">Digital Book Shop</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Science, Technology, Fiction, Bengali & English Literature, and Music. Curated books delivered seamlessly with real-time inventory.
              </p>
            </div>

            {/* Direct Contact Info */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl text-xs w-full sm:w-auto justify-center">
              <a
                href="tel:+8801559503222"
                className="flex items-center gap-2.5 text-slate-300 hover:text-emerald-400 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 block uppercase font-semibold tracking-wider">Call Us</span>
                  <span className="font-mono text-slate-200 font-semibold text-xs sm:text-sm">+8801559503222</span>
                </div>
              </a>

              <div className="hidden sm:block w-px h-8 bg-slate-800"></div>

              <a
                href="mailto:contact@folioverse.com"
                className="flex items-center gap-2.5 text-slate-300 hover:text-cyan-400 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 block uppercase font-semibold tracking-wider">Email</span>
                  <span className="font-mono text-slate-200 font-semibold text-xs sm:text-sm">contact@folioverse.com</span>
                </div>
              </a>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-900/90 flex items-center justify-center text-[11px] text-slate-400 text-center">
            <p>© {new Date().getFullYear()} FolioVerse Book Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <FolioVerseContent />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
