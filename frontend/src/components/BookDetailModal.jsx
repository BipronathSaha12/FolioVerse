import React, { useState } from 'react';
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
} from 'lucide-react';

export const BookDetailModal = ({
  book,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!isOpen || !book) return null;

  const formattedDate = book.published_date
    ? new Date(book.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const handleEdit = () => {
    if (isAuthenticated) {
      onEdit(book);
    } else {
      onRequireAuth('Please log in with Token Authentication to edit this book.');
    }
  };

  const handleDelete = () => {
    if (isAuthenticated) {
      onDelete(book);
    } else {
      onRequireAuth('Please log in with Token Authentication to delete this book.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col overflow-hidden">
        {/* Top ambient line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

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
            <div className="w-full sm:w-48 aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shrink-0 relative shadow-xl">
              {book.cover_image && !imageError ? (
                <img
                  src={book.cover_image}
                  alt={book.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center">
                  <BookOpen className="w-12 h-12 text-indigo-400 mb-2" />
                  <span className="text-xs text-slate-400 font-semibold">{book.title}</span>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                  ID: #{book.id}
                </span>
                {book.category && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                    {book.category}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">{book.title}</h2>

              <div className="space-y-1.5 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">{book.author}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Published: {formattedDate}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-2xl font-extrabold text-emerald-400">
                    ${parseFloat(book.price).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Book
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Book
                </button>
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all ml-auto"
                >
                  <Code className="w-3.5 h-3.5" />
                  {showJson ? 'Hide JSON' : 'Raw JSON'}
                </button>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Synopsis & Notes
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {book.description ||
                'No detailed synopsis provided for this book. You can click Edit to add notes.'}
            </p>
          </div>

          {/* Raw JSON toggle for REST API demonstration */}
          {showJson && (
            <div className="pt-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">
                GET /api/books/{book.id}/ Response:
              </h4>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(book, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
