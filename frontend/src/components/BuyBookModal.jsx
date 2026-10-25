import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle2, ShieldCheck, AlertCircle, Plus, Minus, ArrowRight } from 'lucide-react';
import { bookService } from '../services/api';

export const BuyBookModal = ({ isOpen, book, onClose, onSuccess }) => {
  if (!isOpen || !book) return null;

  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderComplete, setOrderComplete] = useState(null);

  const unitPrice = parseFloat(book.price) || 0;
  const totalAmount = (unitPrice * quantity).toFixed(2);
  const maxStock = book.stock || 1;

  const handleBuySubmit = async (e) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      setErrorMsg('Please enter your full name for order dispatch.');
      return;
    }
    if (!shippingAddress.trim()) {
      setErrorMsg('Please enter your shipping/delivery address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await bookService.buyBook(book.id, { quantity });
      setOrderComplete(res.data);
      if (onSuccess) {
        onSuccess(`Order placed! You purchased ${quantity} copy(ies) of "${book.title}".`);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      const msg = err.response?.data?.error || 'Unable to complete purchase. Please check stock availability.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOrderComplete(null);
    setQuantity(1);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {orderComplete ? 'Order Confirmed!' : 'Purchase Book'}
              </h3>
              <p className="text-xs text-slate-400">Instant book order with live inventory checkout</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {orderComplete ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Thank You for Your Order!</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  {orderComplete.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Book:</span>
                  <span className="font-semibold text-white">{book.title}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Author:</span>
                  <span className="text-slate-200">{book.author}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quantity:</span>
                  <span className="font-bold text-cyan-400">{quantity} copy(ies)</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800 text-sm font-bold">
                  <span className="text-white">Total Paid:</span>
                  <span className="text-emerald-400">${totalAmount}</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-sm shadow-lg shadow-emerald-600/25 transition-all"
              >
                Continue Browsing Catalog
              </button>
            </div>
          ) : (
            <form onSubmit={handleBuySubmit} className="space-y-4">
              {/* Book Summary Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                {book.cover_image && (
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    className="w-16 h-20 object-cover rounded-xl shrink-0 border border-slate-800"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate">{book.title}</h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{book.author}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-black text-emerald-400">${unitPrice.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                      {book.condition || 'New'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      • {book.stock} in stock
                    </span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">Select Quantity</span>
                  <span className="text-[11px] text-slate-500">Max available: {maxStock}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm text-white w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / Email Contact <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="e.g. +8801700000000 or tanvir@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Delivery Address <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="House, Street, City, Postal Code"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Total Price:</span>
                  <span className="text-xl font-black text-emerald-400">${totalAmount}</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Processing...' : 'Confirm Purchase'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
