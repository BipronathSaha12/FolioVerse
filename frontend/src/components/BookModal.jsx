import React, { useState, useEffect } from 'react';
import { X, BookPlus, Edit3, DollarSign, Calendar, User, Tag, Image, FileText, AlertCircle } from 'lucide-react';
import { bookService } from '../services/api';

export const BookModal = ({ isOpen, onClose, bookToEdit, onSuccess }) => {
  const isEditing = !!bookToEdit;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [category, setCategory] = useState('Fiction');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title || '');
      setAuthor(bookToEdit.author || '');
      setPrice(bookToEdit.price ? bookToEdit.price.toString() : '');
      setPublishedDate(bookToEdit.published_date || '');
      setCategory(bookToEdit.category || 'Fiction');
      setDescription(bookToEdit.description || '');
      setCoverImage(bookToEdit.cover_image || '');
    } else {
      // Default new book values
      setTitle('');
      setAuthor('');
      setPrice('');
      setPublishedDate(new Date().toISOString().split('T')[0]);
      setCategory('Fiction');
      setDescription('');
      setCoverImage('');
    }
    setError(null);
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      author: author.trim(),
      price: parseFloat(price),
      published_date: publishedDate,
      category: category.trim(),
      description: description.trim(),
      cover_image: coverImage.trim(),
    };

    try {
      if (isEditing) {
        // PUT /api/books/<id>/
        await bookService.updateBook(bookToEdit.id, payload);
        onSuccess(`Book "${payload.title}" updated successfully.`);
      } else {
        // POST /api/books/
        await bookService.createBook(payload);
        onSuccess(`Book "${payload.title}" created successfully.`);
      }
      onClose();
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded: You have sent too many requests. Please wait a moment.');
      } else if (err.response?.status === 401) {
        setError('Authentication required: Your token has expired or is invalid. Please sign in again.');
      } else if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          const formatted = Object.entries(data)
            .map(([f, val]) => `${f}: ${Array.isArray(val) ? val.join(' ') : val}`)
            .join(' | ');
          setError(formatted);
        } else {
          setError(String(data));
        }
      } else {
        setError('Failed to save book. Please check server connectivity.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col overflow-hidden">
        {/* Top ambient line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <BookPlus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Update Book' : 'Add New Book'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? `Modifying book #${bookToEdit.id} via PUT /api/books/<id>/`
                : 'Creating a new book record via POST /api/books/'}
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form Body (Scrollable if height exceeds) */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Title Field (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Harry Potter and the Deathly Hallows"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Author Field (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Author <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. J.K. Rowling"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Price & Published Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Field (Required) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Price (USD) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="24.99"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Published Date Field (Required) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Published Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Fiction, Fantasy, Sci-Fi, Classic, Non-Fiction..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cover Image URL (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Image className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Synopsis / Description (Optional)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a brief overview of this book..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
