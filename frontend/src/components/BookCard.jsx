import React, { useState } from 'react';
import { Calendar, User, Edit3, Trash2, Eye, BookOpen, ShoppingCart, CheckCircle2, AlertTriangle, XCircle, Tag } from 'lucide-react';

export const BookCard = ({
  book,
  onView,
  onBuy,
  onEdit,
  onDelete,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [imageError, setImageError] = useState(false);

  const formattedDate = book.published_date
    ? new Date(book.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown Date';

  const isAvailable = book.stock > 0 && book.status !== 'sold';

  return (
    <div
      onClick={() => onView(book)}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all duration-300"
    >
      {/* Book Cover Container */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full bg-slate-900 overflow-hidden">
        {book.cover_image && !imageError ? (
          <img
            src={book.cover_image}
            alt={book.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 text-slate-500 p-4 text-center">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold text-slate-300 line-clamp-1 max-w-[200px]">{book.title}</span>
            <span className="text-[11px] text-cyan-400/80 mt-0.5">{book.author}</span>
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-black text-sm shadow-lg">
          ${parseFloat(book.price).toFixed(2)}
        </div>

        {/* Category & Subcategory Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <div className="px-2.5 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[10px] font-bold uppercase tracking-wider text-cyan-300 shadow">
            {book.category}
          </div>
          {book.subcategory && (
            <div className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[9px] font-bold tracking-wide border shadow ${
              book.subcategory === 'Bengali Literature'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                : book.subcategory === 'English Literature'
                ? 'bg-indigo-950/90 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}>
              {book.subcategory === 'Bengali Literature' ? '🇧🇩 Bengali Literature' : book.subcategory === 'English Literature' ? '🇬🇧 English Literature' : book.subcategory}
            </div>
          )}
        </div>

        {/* Condition tag */}
        {book.condition && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-[9px] font-semibold text-slate-300 border border-slate-800">
            {book.condition}
          </div>
        )}
      </div>

      {/* Book Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {book.title}
          </h3>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate font-medium">{book.author}</span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">Pub: {formattedDate}</span>
            {book.language && (
              <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                {book.language}
              </span>
            )}
          </div>

          {/* Stock & Availability Indicator */}
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
            {book.stock > 3 ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock ({book.stock} available)</span>
              </span>
            ) : book.stock > 0 ? (
              <span className="flex items-center gap-1 text-amber-400 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Only {book.stock} left in stock!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>Sold Out</span>
              </span>
            )}
          </div>

          {book.description && (
            <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}
        </div>

        {/* Card Footer Actions: Buy Button & Controls */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Buy Now Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuy(book);
            }}
            disabled={!isAvailable}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
              isAvailable
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isAvailable ? 'Buy Now' : 'Sold Out'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(book);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Inspect Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {isAuthenticated && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(book);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title="Edit Book Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(book);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove from Store"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
