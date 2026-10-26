import React from 'react';
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Tag,
  Mail,
  Store,
  Users,
} from 'lucide-react';

export const HeroSection = ({
  totalBooks,
  onOpenSellBook,
  onSelectCategory,
  onSelectSubcategory,
  onOpenAuth,
  onOpenContact,
}) => {
  return (
    <section className="relative overflow-hidden pt-6 pb-10 sm:pt-12 sm:pb-16 md:pt-16 md:pb-20">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[580px] md:w-[850px] h-[280px] sm:h-[420px] bg-gradient-to-tr from-cyan-500/15 via-emerald-600/15 to-indigo-600/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 text-center">
        {/* Marketplace Pill Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] sm:text-xs font-semibold mb-5 sm:mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>The Premier Digital Book Shop — Buy, Sell & Discover</span>
          <span className="text-slate-600 hidden min-[480px]:inline">|</span>
          <span className="text-cyan-400 font-bold">{totalBooks ? totalBooks.toLocaleString() : '2,000'}+ Books In Stock</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15] sm:leading-[1.12]">
          Buy & Sell Books in a Modern{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">
            Digital Book Shop
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3.5 sm:mt-5 text-xs sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed px-1">
          Explore a rich catalog organized across{' '}
          <span className="text-white font-semibold">
            Science, Technology, Fiction, Literature & Novel (featuring Bengali & English masterpieces), and Music
          </span>
          . Buy with live inventory availability, or list your own books for sale with zero hassle.
        </p>

        {/* Onboarding Role Cards: Join as Buyer vs Seller */}
        <div className="mt-6 sm:mt-8 max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 px-2">
          <button
            onClick={() => onOpenAuth && onOpenAuth('register', 'buyer')}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Join as Book Buyer</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                Browse 2,000+ books & order instantly
              </div>
            </div>
          </button>

          <button
            onClick={() => onOpenAuth && onOpenAuth('register', 'seller')}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Join as Book Seller</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                List new & used books to readers
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          <a
            href="#catalog"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-xl shadow-xl shadow-cyan-600/20 hover:shadow-cyan-500/30 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catalog to Buy</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            onClick={onOpenSellBook}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/35 hover:border-emerald-400/60 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>List a Book for Sale</span>
          </button>

          <button
            onClick={onOpenContact}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Contact</span>
          </button>
        </div>

        {/* 4 Professional Bookstore Metrics */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-5xl mx-auto">
          {/* Metric 1 */}
          <div className="glass-card p-3.5 sm:p-5 rounded-2xl text-left border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Catalog Volume</span>
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-white">{totalBooks ? totalBooks.toLocaleString() : '2,000'}+ Books</div>
            <div className="text-[11px] text-slate-400 mt-0.5">PostgreSQL Engine</div>
          </div>

          {/* Metric 2 */}
          <div className="glass-card p-3.5 sm:p-5 rounded-2xl text-left border border-slate-800/80 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Curated Genres</span>
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-white">5 Main Catalogs</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Science, Tech, Lit, Fiction, Music</div>
          </div>

          {/* Metric 3 */}
          <div className="glass-card p-3.5 sm:p-5 rounded-2xl text-left border border-slate-800/80 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Dual Literature</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-white">বাংলা & English</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Rabindranath & Shakespeare</div>
          </div>

          {/* Metric 4 */}
          <div className="glass-card p-3.5 sm:p-5 rounded-2xl text-left border border-slate-800/80 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-amber-300">Availability</span>
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-white">Live Stock Check</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Atomic ACID Checkout</div>
          </div>
        </div>

        {/* Direct Category Quick Presets */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-slate-400">
          <span className="text-slate-400 font-medium mr-1 text-[11px] sm:text-xs">Quick Filter:</span>
          {[
            { label: '🇧🇩 Bengali Literature', cat: 'Literature & Novel', sub: 'Bengali Literature' },
            { label: '🇬🇧 English Literature', cat: 'Literature & Novel', sub: 'English Literature' },
            { label: '🔬 Science', cat: 'Science', sub: '' },
            { label: '💻 Technology', cat: 'Technology', sub: '' },
            { label: '✨ Fiction', cat: 'Fiction', sub: '' },
            { label: '🎵 Music', cat: 'Music', sub: '' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (onSelectCategory) onSelectCategory(item.cat);
                if (onSelectSubcategory) onSelectSubcategory(item.sub);
                const catalogEl = document.getElementById('catalog');
                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 sm:px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-[11px] sm:text-xs"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
