import React, { useState } from 'react';
import { Calendar, User, Edit3, Trash2, Eye, BookOpen } from 'lucide-react';

export const BookCard = ({
  book,
  onView,
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

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      onEdit(book);
    } else {
      onRequireAuth('Please log in with Token Authentication to edit books.');
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      onDelete(book);
    } else {
      onRequireAuth('Please log in with Token Authentication to delete books.');
    }
  };

  return (
    <div
      onClick={() => onView(book)}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer border border-slate-800/80 hover:border-indigo-500/40"
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 text-slate-500 p-4 text-center">
            <BookOpen className="w-10 h-10 text-indigo-400/40 mb-2" />
            <span className="text-xs font-semibold text-slate-400 line-clamp-1">{book.title}</span>
            <span className="text-[10px] text-slate-400">{book.author}</span>
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-emerald-500/30 text-emerald-400 font-extrabold text-sm shadow-lg">
          ${parseFloat(book.price).toFixed(2)}
        </div>

        {/* Category Badge */}
        {book.category && (
          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            {book.category}
          </div>
        )}
      </div>

      {/* Book Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {book.title}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate font-medium">{book.author}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Published: {formattedDate}</span>
          </div>

          {book.description && (
            <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(book);
            }}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleEditClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              title={isAuthenticated ? 'Edit Book' : 'Login required to edit'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title={isAuthenticated ? 'Delete Book' : 'Login required to delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
