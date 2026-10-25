import React from 'react';
import { BookCard } from './BookCard';
import { BookX, RotateCcw } from 'lucide-react';

export const BookGrid = ({
  books,
  loading,
  onViewBook,
  onBuyBook,
  onEditBook,
  onDeleteBook,
  isAuthenticated,
  onRequireAuth,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl overflow-hidden border border-slate-800 animate-pulse"
          >
            <div className="aspect-[16/10] bg-slate-800/60 w-full"></div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="h-5 bg-slate-800/80 rounded-md w-3/4"></div>
              <div className="h-4 bg-slate-800/50 rounded-md w-1/2"></div>
              <div className="h-3 bg-slate-800/40 rounded-md w-2/3"></div>
              <div className="pt-3 border-t border-slate-800 flex justify-between">
                <div className="h-8 bg-slate-800/50 rounded-xl w-2/3"></div>
                <div className="h-8 bg-slate-800/50 rounded-xl w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="glass-panel py-14 sm:py-20 px-6 text-center rounded-3xl border border-slate-800 my-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-4 shadow-lg">
          <BookX className="w-8 h-8 text-cyan-500/60" />
        </div>
        <h3 className="text-xl font-bold text-white">No Books Found in Catalog</h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          No books matched your active search query, category, or subcategory filter. Try switching genres, checking stock availability, or clearing your filters.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onView={onViewBook}
          onBuy={onBuyBook}
          onEdit={onEditBook}
          onDelete={onDeleteBook}
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
        />
      ))}
    </div>
  );
};
