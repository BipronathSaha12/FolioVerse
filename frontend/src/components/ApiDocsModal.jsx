import React, { useState } from 'react';
import {
  X,
  FileJson,
  Terminal,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Database,
  ExternalLink,
} from 'lucide-react';

export const ApiDocsModal = ({ isOpen, onClose, onDownloadPostman }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const endpoints = [
    {
      category: '1. Authentication (Token Auth)',
      items: [
        {
          method: 'POST',
          path: '/api/register/',
          auth: 'Public (Anyone can register)',
          desc: 'Register a new user account and obtain an authentication token.',
          body: '{\n  "username": "newuser",\n  "email": "user@example.com",\n  "password": "password123",\n  "password_confirm": "password123"\n}',
        },
        {
          method: 'POST',
          path: '/api/login/',
          auth: 'Public',
          desc: 'Authenticate credentials and obtain token.',
          body: '{\n  "username": "admin",\n  "password": "admin12345"\n}',
        },
      ],
    },
    {
      category: '2. Book CRUD APIs (ModelViewSet)',
      items: [
        {
          method: 'GET',
          path: '/api/books/',
          auth: 'Public (Anyone can view)',
          desc: 'Retrieve all books with 5-item pagination, author filter, search, and ordering.',
        },
        {
          method: 'POST',
          path: '/api/books/',
          auth: 'Authenticated (Token required)',
          desc: 'Create a new book record.',
          body: '{\n  "title": "Harry Potter and the Goblet of Fire",\n  "author": "J.K. Rowling",\n  "price": "26.50",\n  "published_date": "2000-07-08"\n}',
        },
        {
          method: 'GET',
          path: '/api/books/<id>/',
          auth: 'Public',
          desc: 'Retrieve single book by primary key ID.',
        },
        {
          method: 'PUT',
          path: '/api/books/<id>/',
          auth: 'Authenticated (Token required)',
          desc: 'Update all fields of an existing book.',
          body: '{\n  "title": "Updated Title",\n  "author": "Updated Author",\n  "price": "29.99",\n  "published_date": "2005-01-01"\n}',
        },
        {
          method: 'PATCH',
          path: '/api/books/<id>/',
          auth: 'Authenticated (Token required)',
          desc: 'Partially update fields of a book.',
          body: '{\n  "price": "19.99"\n}',
        },
        {
          method: 'DELETE',
          path: '/api/books/<id>/',
          auth: 'Authenticated (Token required)',
          desc: 'Delete a book record from database.',
        },
      ],
    },
    {
      category: '3. Filtering, Searching, Ordering & Pagination',
      items: [
        {
          method: 'GET',
          path: '/api/books/?author=J.K. Rowling',
          auth: 'Public',
          desc: 'Filter books specifically by author name.',
        },
        {
          method: 'GET',
          path: '/api/books/?search=Harry',
          auth: 'Public',
          desc: 'Search books by title matching term "Harry".',
        },
        {
          method: 'GET',
          path: '/api/books/?ordering=price',
          auth: 'Public',
          desc: 'Order books by price in ascending order (cheapest first).',
        },
        {
          method: 'GET',
          path: '/api/books/?ordering=-price',
          auth: 'Public',
          desc: 'Order books by price in descending order (highest price first).',
        },
        {
          method: 'GET',
          path: '/api/books/?page=2',
          auth: 'Public',
          desc: 'Retrieve page 2 of books (5 books per page).',
        },
      ],
    },
  ];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'POST':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'PUT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PATCH':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                FolioVerse REST API Documentation
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Django REST Framework • PostgreSQL 16 • Token Authentication • Rate Throttling
            </p>
          </div>

          <button
            onClick={onDownloadPostman}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 shrink-0"
          >
            <FileJson className="w-4 h-4 text-emerald-400" />
            Download Postman Collection
          </button>
        </div>

        {/* Throttling & Policy Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Throttling (Anon):</span>
              <span className="text-slate-400 block">20 requests / minute</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Throttling (Auth):</span>
              <span className="text-slate-400 block">50 requests / minute</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Token Auth Header:</span>
              <code className="text-[11px] font-mono text-emerald-400 block">
                Authorization: Token &lt;key&gt;
              </code>
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-6">
          {endpoints.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                {group.category}
              </h3>
              <div className="space-y-2.5">
                {group.items.map((ep, idx) => {
                  const uniqueKey = `${gIdx}-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold border ${getMethodBadge(
                              ep.method
                            )}`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-white font-semibold">{ep.path}</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                          {ep.auth}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{ep.desc}</p>
                      {ep.body && (
                        <div className="mt-2 relative">
                          <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
                            {ep.body}
                          </pre>
                          <button
                            onClick={() => handleCopy(ep.body, uniqueKey)}
                            className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700"
                            title="Copy payload"
                          >
                            {copiedIndex === uniqueKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
