import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { bookService } from '../services/api';

export const DeleteConfirmModal = ({ isOpen, onClose, book, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !book) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await bookService.deleteBook(book.id);
      onSuccess(`Book "${book.title}" was permanently removed.`);
      onClose();
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Throttled: Too many delete requests. Please wait.');
      } else if (err.response?.status === 401) {
        setError('Unauthorized: Token missing or invalid.');
      } else {
        setError('Failed to delete book. Please check server status.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center">
        {/* Top danger line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Delete Book?</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">"{book.title}"</span>? This will perform a{' '}
          <code className="text-xs font-mono text-rose-400">DELETE /api/books/{book.id}/</code> call on PostgreSQL.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
