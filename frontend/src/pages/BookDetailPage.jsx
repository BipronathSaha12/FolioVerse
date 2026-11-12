import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Calendar,
  User,
  Tag,
  Globe,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code,
  Share2,
  Bookmark,
  Check,
  Edit3,
  Trash2,
  BookOpen,
} from 'lucide-react';

export const BookDetailPage = ({ onEditBook, onDeleteBook, addToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canManageBooks, isAdmin } = useAuth();
  const { addToCart } = useCart();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    bookService
      .getBook(id)
      .then((res) => {
        if (isMounted) {
          setBook(res.data);
          document.title = `${res.data.title} — FolioVerse Book Store`;
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching book detail:', err);
          setError(err.response?.status === 404 ? 'Book not found' : 'Failed to load book');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      document.title = 'FolioVerse — Enterprise Book Store';
    };
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    if (addToast) addToast('Direct link copied to clipboard!', 'info', 'Share Book');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddToCart = () => {
    if (!book || book.stock <= 0) return;
    const success = addToCart(book, quantity);
    if (success) {
      setAddedToast(true);
      if (addToast) addToast(`Added ${quantity} copy(ies) to cart`, 'success', 'Cart Updated');
      setTimeout(() => setAddedToast(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!book || book.stock <= 0) return;
    addToCart(book, quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium animate-pulse">Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 text-center bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-300">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{error || 'Book Not Found'}</h2>
        <p className="text-sm text-slate-400 mb-6">
          The requested book (ID: #{id}) could not be located in our catalog. It may have been removed by the seller.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-900/20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = book.stock > 0 && book.status !== 'sold';
  const isOwner = Boolean(user && book.seller && (book.seller === user.id || book.seller_username === user.username));
  const canModify = Boolean(isAdmin || isOwner);

  const formattedDate = book.published_date
    ? new Date(book.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Link to="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-medium">
            <ArrowLeft className="w-4 h-4" /> Catalog
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{book.category}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-none">{book.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-medium transition-all"
            title="Share Direct Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Share'}
          </button>

          {canModify && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditBook && onEditBook(book)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => onDeleteBook && onDeleteBook(book)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Cover Left, Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-md">
        {/* Book Cover Image */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center group">
            {book.cover_image && !imageError ? (
              <img
                src={book.cover_image}
                alt={book.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <BookOpen className="w-16 h-16 mb-3 text-slate-600" />
                <span className="font-semibold text-slate-400 text-sm">{book.title}</span>
                <span className="text-xs text-slate-600 mt-1">{book.author}</span>
              </div>
            )}

            {/* Condition badge */}
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700/60 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-200">
              {book.condition}
            </div>

            {/* Stock status badge */}
            <div className="absolute top-3 right-3">
              {book.stock > 3 ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> In Stock ({book.stock})
                </span>
              ) : book.stock > 0 ? (
                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                  <AlertTriangle className="w-3 h-3" /> Low Stock ({book.stock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                  <XCircle className="w-3 h-3" /> Sold Out
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {book.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {book.subcategory}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {book.language || 'English'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {book.title}
              </h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                by <span className="text-slate-200 font-semibold">{book.author}</span>
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">List Price</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                    ৳{parseFloat(book.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">BDT</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Inventory</span>
                <span className="text-sm font-semibold text-slate-300">{book.stock} units available</span>
              </div>
            </div>

            {/* Book Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Published
                </span>
                <span className="font-semibold text-slate-200">{formattedDate}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Listed By
                </span>
                <span className="font-semibold text-slate-200 truncate block">
                  {book.seller_username || 'FolioVerse Merchant'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" /> ISBN Number
                </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {book.isbn || 'N/A'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Synopsis / Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                {book.description || 'No extended description provided for this literary record.'}
              </p>
            </div>
          </div>

          {/* Checkout & Cart Action Bar */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            {isAvailable ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl px-3 py-2 w-full sm:w-auto justify-between sm:justify-start gap-3">
                  <span className="text-xs text-slate-400 font-medium">Qty:</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(book.stock, Math.max(1, parseInt(e.target.value))))}
                    className="bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
                  >
                    {[...Array(Math.min(10, book.stock))].map((_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-slate-900 text-white">
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all border border-slate-700 shadow-md active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4 text-cyan-400" />
                  {addedToast ? 'Added to Cart!' : 'Add to Cart'}
                </button>

                {/* Buy Now -> /checkout */}
                <button
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/30 active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" /> Instant Checkout
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-center text-rose-300 text-sm font-medium">
                This item is currently out of stock. Check back later or explore related titles in {book.category}.
              </div>
            )}

            {/* Developer Metadata Toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 font-mono transition-colors"
              >
                <Code className="w-3.5 h-3.5" /> {showJson ? 'Hide Raw Metadata' : 'View REST API Payload'}
              </button>

              {showJson && (
                <pre className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-cyan-300 font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(book, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

