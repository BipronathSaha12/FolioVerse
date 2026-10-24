import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { bookService } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FilterBar } from './components/FilterBar';
import { BookGrid } from './components/BookGrid';
import { Pagination } from './components/Pagination';
import { AuthModal } from './components/AuthModal';
import { BookModal } from './components/BookModal';
import { BookDetailModal } from './components/BookDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { ToastContainer } from './components/Toast';
import { RefreshCw } from 'lucide-react';

function FolioVerseContent() {
  const { isAuthenticated } = useAuth();

  // Books state
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter, search & ordering states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [ordering, setOrdering] = useState('');
  const [allAuthors, setAllAuthors] = useState(['J.K. Rowling', 'George Orwell', 'F. Scott Fitzgerald', 'J.R.R. Tolkien', 'Harper Lee', 'Agatha Christie']);

  // Health & connection state
  const [apiConnected, setApiConnected] = useState(true);

  // Modals state
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [bookModal, setBookModal] = useState({ open: false, book: null });
  const [detailModal, setDetailModal] = useState({ open: false, book: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, book: null });
  const [apiDocsOpen, setApiDocsOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type, title }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch books from Django REST Framework
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (authorFilter) {
        params.author = authorFilter;
      }
      if (ordering) {
        params.ordering = ordering;
      }

      const res = await bookService.getBooks(params);
      const data = res.data;

      // When paginated by DRF PageNumberPagination
      if (data && data.results) {
        setBooks(data.results);
        setTotalBooks(data.count || 0);
        setTotalPages(data.total_pages || Math.ceil((data.count || 1) / 5));
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
  }, [currentPage, debouncedSearch, authorFilter, ordering, addToast]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Check health and seed authors list
  useEffect(() => {
    bookService
      .checkHealth()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setAuthorFilter('');
    setOrdering('');
    setCurrentPage(1);
  };

  // Download Postman Collection
  const handleDownloadPostman = () => {
    // Read the static JSON file and trigger browser download
    fetch('/FolioVerse_BookStore.postman_collection.json')
      .then((res) => {
        if (!res.ok) throw new Error('File not found in public folder');
        return res.blob();
      })
      .catch(() => {
        // Fallback: construct Postman collection blob on the fly
        const collectionData = {
          info: {
            name: "FolioVerse Book Store REST API",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
          },
          item: [
            { name: "POST Register", request: { method: "POST", url: "http://127.0.0.1:8000/api/register/" } },
            { name: "POST Login", request: { method: "POST", url: "http://127.0.0.1:8000/api/login/" } },
            { name: "GET Books (Page 1)", request: { method: "GET", url: "http://127.0.0.1:8000/api/books/?page=1" } },
            { name: "GET Filter by Author", request: { method: "GET", url: "http://127.0.0.1:8000/api/books/?author=J.K. Rowling" } },
            { name: "GET Search by Title", request: { method: "GET", url: "http://127.0.0.1:8000/api/books/?search=Harry" } },
            { name: "GET Order by Price", request: { method: "GET", url: "http://127.0.0.1:8000/api/books/?ordering=price" } },
            { name: "POST Create Book", request: { method: "POST", url: "http://127.0.0.1:8000/api/books/" } },
            { name: "DELETE Book", request: { method: "DELETE", url: "http://127.0.0.1:8000/api/books/1/" } }
          ]
        };
        return new Blob([JSON.stringify(collectionData, null, 2)], { type: 'application/json' });
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'FolioVerse_BookStore.postman_collection.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addToast('Postman Collection downloaded successfully.', 'success', 'Collection Exported');
      });
  };

  // Require Auth guard
  const handleRequireAuth = (customMsg) => {
    addToast(customMsg || 'Authentication required for this operation.', 'warning', 'Auth Required');
    setAuthModal({ open: true, mode: 'login' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Navbar */}
      <Navbar
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenAddBook={() => {
          if (isAuthenticated) {
            setBookModal({ open: true, book: null });
          } else {
            handleRequireAuth('Please log in with Token Authentication to add a new book.');
          }
        }}
        onOpenApiDocs={() => setApiDocsOpen(true)}
        apiConnected={apiConnected}
        bookCount={totalBooks}
      />

      {/* Main Container */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          totalBooks={totalBooks}
          onOpenAddBook={() => {
            if (isAuthenticated) {
              setBookModal({ open: true, book: null });
            } else {
              handleRequireAuth('Please log in with Token Authentication to add a book.');
            }
          }}
          onOpenApiDocs={() => setApiDocsOpen(true)}
          onDownloadPostman={handleDownloadPostman}
        />

        {/* Catalog Section */}
        <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Book Catalog</h2>
                <button
                  onClick={fetchBooks}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Refresh catalog"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Explore books stored in PostgreSQL with instant search, author filters, and pagination.
              </p>
            </div>

            {/* Pagination quick count */}
            <div className="text-xs text-slate-400">
              Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
              <span className="font-semibold text-white">{totalPages || 1}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            authorFilter={authorFilter}
            onAuthorChange={(val) => {
              setAuthorFilter(val);
              setCurrentPage(1);
            }}
            ordering={ordering}
            onOrderingChange={(val) => {
              setOrdering(val);
              setCurrentPage(1);
            }}
            onResetFilters={handleResetFilters}
            authorsList={allAuthors}
          />

          {/* Book Cards Grid */}
          <BookGrid
            books={books}
            loading={loading}
            onViewBook={(book) => setDetailModal({ open: true, book })}
            onEditBook={(book) => setBookModal({ open: true, book })}
            onDeleteBook={(book) => setDeleteModal({ open: true, book })}
            isAuthenticated={isAuthenticated}
            onRequireAuth={handleRequireAuth}
            onResetFilters={handleResetFilters}
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalBooks}
            pageSize={5}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
          />
        </section>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ open: false, mode: 'login' })}
        onSuccess={(msg) => addToast(msg, 'success', 'Authenticated')}
      />

      <BookModal
        isOpen={bookModal.open}
        bookToEdit={bookModal.book}
        onClose={() => setBookModal({ open: false, book: null })}
        onSuccess={(msg) => {
          addToast(msg, 'success');
          fetchBooks();
        }}
      />

      <BookDetailModal
        isOpen={detailModal.open}
        book={detailModal.book}
        onClose={() => setDetailModal({ open: false, book: null })}
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

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        book={deleteModal.book}
        onClose={() => setDeleteModal({ open: false, book: null })}
        onSuccess={(msg) => {
          addToast(msg, 'success', 'Book Deleted');
          fetchBooks();
        }}
      />

      <ApiDocsModal
        isOpen={apiDocsOpen}
        onClose={() => setApiDocsOpen(false)}
        onDownloadPostman={handleDownloadPostman}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">FolioVerse</span>
            <span>•</span>
            <span>Django REST Framework & PostgreSQL</span>
          </div>
          <div>
            Module-23 Assignment Completed with DRF ModelViewSet, Token Auth & React UI
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FolioVerseContent />
    </AuthProvider>
  );
}
