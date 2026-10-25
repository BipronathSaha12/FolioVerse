import React, { useState } from 'react';
import { X, PlusCircle, BookOpen, Tag, DollarSign, Image, FileText, CheckCircle2 } from 'lucide-react';
import { bookService } from '../services/api';

export const SellBookModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const categorySubcategories = {
    'Literature & Novel': [
      'Bengali Literature',
      'English Literature',
      'World Classics',
      'Poetry & Plays',
      'Contemporary Novels',
    ],
    'Science': [
      'Physics',
      'Astronomy & Cosmology',
      'Biology & Genetics',
      'Computer Science',
      'Environmental Science',
    ],
    'Technology': [
      'Artificial Intelligence & ML',
      'Software Architecture',
      'Web & Cloud Engineering',
      'Cybersecurity & Networks',
      'Mobile Development',
    ],
    'Fiction': [
      'Science Fiction',
      'Fantasy & Magic',
      'Mystery & Detective',
      'Psychological Thriller',
      'Historical Fiction',
    ],
    'Music': [
      'Music Theory & Composition',
      'Biographies & Memoirs',
      'Instruments & Performance',
      'History & World Music',
    ],
  };

  const sampleCovers = [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80',
  ];

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Literature & Novel',
    subcategory: 'Bengali Literature',
    language: 'Bengali',
    condition: 'New',
    price: '',
    stock: 10,
    published_date: new Date().toISOString().split('T')[0],
    isbn: '',
    cover_image: sampleCovers[0],
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    const availableSubs = categorySubcategories[newCat] || [];
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      subcategory: availableSubs[0] || 'General',
      language: newCat === 'Literature & Novel' ? 'Bengali' : 'English',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Book title is required.');
      return;
    }
    if (!formData.author.trim()) {
      setErrorMsg('Author name is required.');
      return;
    }
    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Please enter a valid price greater than $0.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        price: parsedPrice.toFixed(2),
        stock: parseInt(formData.stock, 10) || 1,
      };
      await bookService.createBook(payload);
      if (onSuccess) {
        onSuccess(`Successfully listed "${formData.title}" for sale in the book store!`);
      }
      onClose();
    } catch (err) {
      console.error('Error listing book:', err);
      const msg = err.response?.data?.detail || err.response?.data?.price?.[0] || 'Unable to list book. Please check fields.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">List a Book for Sale</h3>
              <p className="text-xs text-slate-400">Sell new or used books to thousands of readers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1 text-slate-300 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Book Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Gitanjali or Clean Code"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Author Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Rabindranath Tagore"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Category & Subcategory Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Genre / Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {Object.keys(categorySubcategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subcategory <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {(categorySubcategories[formData.category] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language, Condition, Stock, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              >
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="English">English</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              >
                <option value="New">Brand New</option>
                <option value="Like New">Used - Like New</option>
                <option value="Good">Used - Good</option>
                <option value="Fair">Used - Fair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selling Price ($) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="15.00"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Copies (Stock)</label>
              <input
                type="number"
                min="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* Published Date & ISBN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Published Date</label>
              <input
                type="date"
                required
                value={formData.published_date}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ISBN Number (Optional)</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="e.g. 978-0143420583"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mb-2"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Preset suggestions:</span>
              {sampleCovers.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData({ ...formData, cover_image: url })}
                  className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                    formData.cover_image === url ? 'ring-2 ring-emerald-400 border-white' : 'border-slate-800'
                  }`}
                >
                  <img src={url} alt={`cover ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Book Summary / Condition Notes</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of the book, edition details, or condition notes for prospective buyers..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Listing Book...' : 'List Book for Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
