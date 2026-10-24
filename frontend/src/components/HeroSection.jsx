import React from 'react';
import {
  Sparkles,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  FileJson,
  Layers,
} from 'lucide-react';

export const HeroSection = ({
  totalBooks,
  onOpenAddBook,
  onOpenApiDocs,
  onDownloadPostman,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Django Batch-9 Module-23 Assignment Complete</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Architected for Speed.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Django REST Framework
          </span>{' '}
          & PostgreSQL
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Full-featured Book Store REST API with Token Authentication, ModelViewSet CRUD, dynamic
          Author Filtering, Title Searching, Price Ordering, strict 5-item Pagination, and Rate Throttling.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <a
            href="#catalog"
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            Explore Catalog
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            onClick={onOpenApiDocs}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            API Specs & Endpoints
          </button>

          <button
            onClick={onDownloadPostman}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <FileJson className="w-4 h-4 text-emerald-400" />
            Postman Collection
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-4 rounded-2xl text-left border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Database</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalBooks} Books</div>
            <div className="text-xs text-slate-500 mt-0.5">PostgreSQL 16 Engine</div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-left border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Auth Mode</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">DRF Token</div>
            <div className="text-xs text-slate-500 mt-0.5">Public Read / Auth Write</div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-left border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pagination</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">5 Per Page</div>
            <div className="text-xs text-slate-500 mt-0.5">PageNumberPagination</div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-left border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Throttling</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">20 / 50 min</div>
            <div className="text-xs text-slate-500 mt-0.5">Anon 20 / Auth 50 req/min</div>
          </div>
        </div>
      </div>
    </section>
  );
};
