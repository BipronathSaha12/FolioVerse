import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  X,
  User,
  Calendar,
  DollarSign,
  Tag,
  Edit3,
  Trash2,
  Code,
  BookOpen,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Package,
} from 'lucide-react';

export const BookDetailModal = ({
  book,
  isOpen,
  onClose,
  onBuy,
  onEdit,
  onDelete,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const { canManageBooks } = useAuth();
  const { addToCart, openCart } = useCart();

  if (!isOpen || !book) return null;

  const formattedDate = book.published_date
    ? new Date(book.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const isAvailable = book.stock > 0 && book.status !== 'sold';

  const handleEdit = () => {
    if (canManageBooks) {
      onEdit(book);
    } else {
      onRequireAuth('Manager or Admin permissions required to edit books.');
    }
  };

  const handleDelete = () => {
    if (canManageBooks) {
      onDelete(book);
    } else {
      onRequireAuth('Manager or Admin permissions required to delete books.');
    }
  };

  const handleModalAddToCart = () => {
    if (!isAvailable) return;
    addToCart(book, 1);
  };

  const handleModalInstantBuy = () => {
    if (!isAvailable) return;
    addToCart(book, 1);
    onClose();
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1 flex-1 space-y-6">
          {/* Main Layout: Cover + Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Book Cover */}
            <div className="w-full sm:w-52 aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shrink-0 relative shadow-xl">
              {book.cover_image && !imageError ? (
                <img
                  src={book.cover_image}
                  alt={book.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center">
                  <BookOpen className="w-12 h-12 text-cyan-400 mb-2" />
                  <span className="text-xs text-slate-400 font-semibold">{book.title}</span>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  ID: #{book.id}
                </span>
                {book.category && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700/60">
                    {book.category}
                  </span>
                )}
                {book.subcategory && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                    book.subcategory === 'Bengali Literature'
                      ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                      : book.subcategory === 'English Literature'
                      ? 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {book.subcategory === 'Bengali Literature' ? '🇧🇩 Bengali Literature' : book.subcategory === 'English Literature' ? '🇬🇧 English Literature' : book.subcategory}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{book.title}</h2>

              <div className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">{book.author}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Published: {formattedDate}</span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="text-2xl font-black text-emerald-400">
                    ৳ {parseFloat(book.price).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                    Condition: <span className="font-semibold text-white">{book.condition || 'New'}</span>
                  </div>
                  {book.language && (
                    <div className="text-xs text-slate-400 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                      Language: <span className="font-semibold text-white">{book.language}</span>
                    </div>
                  )}
                </div>

                {/* Live Stock & Availability Status */}
                <div className="pt-1 flex items-center gap-2 text-xs font-semibold">
                  {book.stock > 3 ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Available ({book.stock} copies in store)</span>
                    </span>
                  ) : book.stock > 0 ? (
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                      <span>Low Stock: Only {book.stock} copy(ies) remaining!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <XCircle className="w-4 h-4" />
                      <span>Sold Out / Out of Stock</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Buyer Actions: Instant Buy & Add to Cart */}
              <div className="pt-3 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleModalInstantBuy}
                  disabled={!isAvailable}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 ${
                    isAvailable
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAvailable ? 'Buy Now' : 'Out of Stock'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalAddToCart}
                  disabled={!isAvailable}
                  className={`flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 ${
                    isAvailable
                      ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700 hover:border-cyan-500'
                      : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-cyan-400" />
                  <span>Add to Cart</span>
                </button>

                {/* Manager / Admin controls ONLY - Hidden from buyers */}
                {canManageBooks && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Book Synopsis & Details
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {book.description ||
                'No detailed synopsis provided for this book. You can inspect further or purchase directly.'}
            </p>
          </div>

          {/* Raw JSON toggle */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              ISBN: {book.isbn || 'N/A'} • DRM-Free
            </span>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              {showJson ? 'Hide JSON' : 'API JSON'}
            </button>
          </div>

          {showJson && (
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(book, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
