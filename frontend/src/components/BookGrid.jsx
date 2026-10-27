import React from 'react';
import { BookCard } from './BookCard';
import { BookX, RotateCcw, Sparkles } from 'lucide-react';

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
  onSeedDatabase,
  isSeeding,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl overflow-hidden border border-slate-800 animate-pulse flex flex-col justify-between"
          >
            {/* 3:4 portrait skeleton */}
            <div className="aspect-[3/4] bg-slate-900/90 w-full"></div>
            <div className="p-3.5 sm:p-4 space-y-2.5">
              <div className="h-4 bg-slate-800/80 rounded-md w-3/4"></div>
              <div className="h-3.5 bg-slate-800/50 rounded-md w-1/2"></div>
              <div className="h-3 bg-slate-800/40 rounded-md w-2/3"></div>
              <div className="pt-3 border-t border-slate-800 flex justify-between gap-2">
                <div className="h-8 bg-slate-800/50 rounded-xl flex-1"></div>
                <div className="h-8 bg-slate-800/50 rounded-xl w-14"></div>
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
          No books matched your active search query, category, or subcategory filter, or your cloud database is waiting to be populated.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>

          {onSeedDatabase && (
            <button
              type="button"
              onClick={onSeedDatabase}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Sparkles className={`w-4 h-4 text-emerald-300 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Populating Catalog...' : 'Seed 2,000 Books (1-Click)'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 items-stretch">
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
