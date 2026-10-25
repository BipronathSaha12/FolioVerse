import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';

export const Pagination = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const [jumpPage, setJumpPage] = useState('');

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Compute sliding window with ellipsis for large page counts (e.g. 200 pages)
  const getPageNumbers = () => {
    const delta = 2; // numbers on each side of currentPage
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage('');
    }
  };

  const visiblePages = getPageNumbers();

  return (
    <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Information string */}
      <div className="text-xs sm:text-sm text-slate-400 text-center md:text-left">
        Showing <span className="font-bold text-white">{startItem}</span> to{' '}
        <span className="font-bold text-white">{endItem}</span> of{' '}
        <span className="font-bold text-white">{totalCount.toLocaleString()}</span> books{' '}
        <span className="text-cyan-400 font-semibold">(10 per page)</span>
      </div>

      {/* Pagination Controls & Direct Jump */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-xl border transition-all ${
            currentPage === 1
              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-950'
              : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            currentPage === 1
              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-950'
              : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white'
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden min-[480px]:inline">Prev</span>
        </button>

        {/* Page Number Buttons with Ellipsis */}
        <div className="flex items-center gap-1">
          {visiblePages.map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 text-center text-xs text-slate-500 font-bold select-none"
                >
                  •••
                </span>
              );
            }

            const pageNum = Number(item);
            const isCurrent = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30 scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            currentPage === totalPages
              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-950'
              : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white'
          }`}
          aria-label="Next Page"
        >
          <span className="hidden min-[480px]:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-xl border transition-all ${
            currentPage === totalPages
              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-950'
              : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title={`Last Page (${totalPages})`}
          aria-label="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Quick Page Jump for High Page Volume (e.g., 200 pages) */}
        {totalPages > 7 && (
          <form
            onSubmit={handleJumpSubmit}
            className="flex items-center gap-1.5 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-800"
          >
            <span className="text-[11px] text-slate-500 hidden sm:inline">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder={`${currentPage}`}
              className="w-12 sm:w-14 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-center text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!jumpPage}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-[11px] font-bold text-cyan-300 transition-colors"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
