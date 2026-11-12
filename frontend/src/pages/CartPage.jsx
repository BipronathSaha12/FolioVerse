import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  Truck,
  BookOpen,
} from 'lucide-react';

export const CartPage = () => {
  const {
    cartItems,
    savedItems,
    totalItems,
    subtotal,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCartFromSaved,
    removeSavedItem,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  const deliveryFee = subtotal >= 1000 ? 0 : subtotal > 0 ? 60 : 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-cyan-400" /> Shopping Cart
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your selected books before initiating secure mobile banking checkout.
          </p>
        </div>

        <Link
          to="/"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Browsing
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800/80 rounded-3xl max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your cart is currently empty</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Explore our curated catalog across Science, Technology, Fiction, Bengali & English Literature, and Music.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-900/20"
          >
            <BookOpen className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-medium">
              <span>Items in your order</span>
              <button
                onClick={clearCart}
                className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-slate-700"
              >
                {/* Book Image */}
                <div className="w-20 h-28 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 flex items-center justify-center">
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
                    {item.category || 'Literature'}
                  </span>
                  <Link
                    to={`/books/${item.id}`}
                    className="text-base font-bold text-white hover:text-cyan-300 transition-colors truncate block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">by {item.author}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="text-emerald-400 font-bold text-sm">৳{parseFloat(item.price).toFixed(2)}</span>
                    <span className="text-[11px] text-slate-500">•</span>
                    <span className="text-[11px] text-slate-400">{item.condition || 'New'}</span>
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center gap-6 justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center border border-slate-700 bg-slate-950/60 rounded-xl px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-sm font-bold text-white block">
                      ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => saveForLater(item.id)}
                      className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors mt-1 flex items-center gap-1 justify-end ml-auto"
                    >
                      <Bookmark className="w-3 h-3" /> Save
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Saved for Later Section */}
            {savedItems && savedItems.length > 0 && (
              <div className="pt-8 border-t border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyan-400" /> Saved For Later ({savedItems.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-12 h-16 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-white truncate block">{item.title}</span>
                        <span className="text-xs text-emerald-400 font-bold block mt-0.5">৳{item.price}</span>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                          <button
                            onClick={() => moveToCartFromSaved(item.id)}
                            className="text-cyan-400 hover:underline font-medium"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => removeSavedItem(item.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Box (4 Columns) */}
          <div className="lg:col-span-4">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 sticky top-24 space-y-5">
              <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Cart Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-white">৳{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-emerald-400">
                    {deliveryFee === 0 ? 'FREE (Orders ৳1,000+)' : `৳${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-base font-bold text-white">
                  <span>Total Amount</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                      ৳{grandTotal.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 block font-normal">BDT (Taka)</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-800/60 space-y-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Interactive MFS (bKash, Nagad, Rocket) & COD</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Free doorstep delivery on orders above ৳1,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

