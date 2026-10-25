import React from 'react';
import { Search, ArrowUpDown, X, Filter, BookOpen, CheckCircle, Tag } from 'lucide-react';

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  inStockOnly,
  onInStockToggle,
  ordering,
  onOrderingChange,
  onResetFilters,
  totalResults,
}) => {
  const categoryTaxonomy = {
    'Literature & Novel': [
      'Bengali Literature',
      'English Literature',
      'World Classics',
      'Poetry & Plays',
    ],
    'Science': [
      'Physics',
      'Astronomy & Cosmology',
      'Biology & Genetics',
      'Computer Science',
    ],
    'Technology': [
      'Artificial Intelligence & ML',
      'Software Architecture',
      'Web & Cloud Engineering',
    ],
    'Fiction': [
      'Fantasy & Magic',
      'Science Fiction',
      'Mystery & Detective',
    ],
    'Music': [
      'Music Theory & Composition',
      'Biographies & Memoirs',
      'Instruments & Performance',
    ],
  };

  const categoriesList = ['Literature & Novel', 'Science', 'Technology', 'Fiction', 'Music'];
  const hasActiveFilters = searchQuery || categoryFilter || subcategoryFilter || inStockOnly || ordering;

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl mb-8 space-y-4">
      {/* Category Tabs (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800/80">
        <button
          onClick={() => {
            onCategoryChange('');
            onSubcategoryChange('');
          }}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !categoryFilter
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Genres
        </button>

        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              onCategoryChange(cat);
              onSubcategoryChange('');
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === cat
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            {cat === 'Literature & Novel' ? '📖 Literature (বাংলা/Eng)' : cat}
          </button>
        ))}
      </div>

      {/* Subcategory Pills Row (Appears when a category is selected, or default for Literature) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs text-slate-400">
        <span className="font-semibold text-slate-300 shrink-0 text-[11px] sm:text-xs flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          Subcategories:
        </span>

        {categoryFilter && categoryTaxonomy[categoryFilter] ? (
          <>
            <button
              onClick={() => onSubcategoryChange('')}
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                !subcategoryFilter
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              All {categoryFilter}
            </button>

            {categoryTaxonomy[categoryFilter].map((sub) => (
              <button
                key={sub}
                onClick={() => onSubcategoryChange(sub)}
                className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                  subcategoryFilter === sub
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {sub === 'Bengali Literature' ? '🇧🇩 Bengali Literature' : sub === 'English Literature' ? '🇬🇧 English Literature' : sub}
              </button>
            ))}
          </>
        ) : (
          <>
            {/* Quick Genre Subcategory Presets */}
            <button
              onClick={() => {
                onCategoryChange('Literature & Novel');
                onSubcategoryChange('Bengali Literature');
              }}
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                subcategoryFilter === 'Bengali Literature'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              🇧🇩 Bengali Literature
            </button>

            <button
              onClick={() => {
                onCategoryChange('Literature & Novel');
                onSubcategoryChange('English Literature');
              }}
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                subcategoryFilter === 'English Literature'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              🇬🇧 English Literature
            </button>

            <button
              onClick={() => {
                onCategoryChange('Science');
                onSubcategoryChange('Physics');
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg border text-xs bg-slate-900 border-slate-800 text-slate-300"
            >
              🔬 Physics
            </button>

            <button
              onClick={() => {
                onCategoryChange('Technology');
                onSubcategoryChange('Artificial Intelligence & ML');
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg border text-xs bg-slate-900 border-slate-800 text-slate-300"
            >
              💻 AI & ML
            </button>
          </>
        )}
      </div>

      {/* Search & Sort Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center pt-2">
        {/* Search by Title / Author / ISBN */}
        <div className="sm:col-span-2 lg:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by book title, author, or ISBN..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* In-Stock Availability Toggle */}
        <div className="sm:col-span-1 lg:col-span-3">
          <button
            onClick={() => onInStockToggle(!inStockOnly)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              inStockOnly
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${inStockOnly ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{inStockOnly ? 'In Stock (Available Only)' : 'All Stock Status'}</span>
          </button>
        </div>

        {/* Order By Select */}
        <div className="sm:col-span-1 lg:col-span-2 relative">
          <select
            value={ordering}
            onChange={(e) => onOrderingChange(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Default (Latest)</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="title">Title: A to Z</option>
            <option value="-stock">Highest Stock First</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Reset Button */}
        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
