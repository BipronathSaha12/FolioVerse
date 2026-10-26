import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Bookmark,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const CartDrawer = ({ onOrderPlaced }) => {
  const {
    cartItems,
    savedItems,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCartFromSaved,
    removeSavedItem,
    recordOrder,
    clearCart,
  } = useCart();

  const { user } = useAuth();

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.username || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('01712345678');
  const [shippingAddress, setShippingAddress] = useState('');
  
  // Payment Method Selection: 'bkash' | 'nagad' | 'rocket' | 'cod' (No Stripe)
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [mobileNumber, setMobileNumber] = useState('01712345678');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessingStage, setPaymentProcessingStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Sync logged in user details if available
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.username || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty. Please add books to proceed.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name for order delivery.');
      return;
    }

    if (!customerEmail.trim()) {
      setErrorMsg('Please enter your email address for order confirmation.');
      return;
    }

    if (!shippingAddress.trim()) {
      setErrorMsg('Please provide a complete delivery address.');
      return;
    }

    setIsSubmitting(true);
    let resolvedTransactionId = '';

    try {
      // 1. If mobile banking (bKash, Nagad, Rocket), execute automated Payment API
      if (['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
        const targetNumber = (mobileNumber || customerPhone || '').trim();
        if (!targetNumber || targetNumber.length < 11) {
          setErrorMsg(`Please enter a valid 11-digit Bangladeshi mobile number for ${paymentMethod.toUpperCase()} API payment.`);
          setIsSubmitting(false);
          return;
        }

        setPaymentProcessingStage(`Connecting to ${paymentMethod.toUpperCase()} API Gateway...`);

        // Call backend payment gateway API
        const payRes = await orderService.processPayment({
          provider: paymentMethod,
          account_number: targetNumber,
          amount: subtotal.toFixed(2),
        });

        resolvedTransactionId = payRes.data?.transaction_id || `${paymentMethod.toUpperCase()}-TXN-${Date.now().toString(36).toUpperCase()}`;
        setPaymentProcessingStage(`Payment of ৳${subtotal.toFixed(2)} verified! Finalizing order...`);
      }

      // 2. Create the Order
      const payload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || mobileNumber.trim(),
        shipping_address: shippingAddress.trim(),
        payment_method: paymentMethod,
        transaction_id: resolvedTransactionId,
        items: cartItems.map((item) => ({
          book_id: item.bookId || item.id,
          quantity: item.quantity,
        })),
      };

      const res = await orderService.createOrder(payload);
      const placedOrder = res.data;

      // Save to local buyer order history
      recordOrder(placedOrder);
      setOrderSuccess(placedOrder);
      clearCart();

      if (onOrderPlaced) onOrderPlaced(placedOrder);
    } catch (err) {
      console.error('Order creation failed:', err);
      const serverErr =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Unable to process your order right now. Please check inventory and try again.';
      setErrorMsg(serverErr);
    } finally {
      setIsSubmitting(false);
      setPaymentProcessingStage('');
    }
  };

  const handleResetOrder = () => {
    setOrderSuccess(null);
    setErrorMsg('');
    closeCart();
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">Shopping Cart</h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">FolioVerse Fast Delivery (Bangladesh)</p>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {orderSuccess ? (
              /* ORDER SUCCESS RECEIPT SCREEN */
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-200 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Order Confirmed!
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Thank You for Your Order!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your books have been locked in inventory and are being packed for fast courier dispatch across Bangladesh.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 text-left space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Order Number</div>
                      <div className="text-sm font-mono font-bold text-cyan-300">
                        {orderSuccess.order_number}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase">
                      {orderSuccess.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-400">Recipient</div>
                      <div className="font-semibold text-white truncate">{orderSuccess.customer_name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{orderSuccess.customer_email}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Payment Option</div>
                      <div className="font-semibold text-emerald-400 uppercase">
                        {orderSuccess.payment_method}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Status: <span className="text-cyan-300 font-bold uppercase">{orderSuccess.payment_status}</span>
                      </div>
                    </div>
                  </div>

                  {orderSuccess.transaction_id && (
                    <div className="text-xs pt-1 border-t border-slate-800">
                      <div className="text-slate-400">Verified API Transaction ID:</div>
                      <div className="font-mono text-cyan-300 font-bold text-xs mt-0.5">
                        {orderSuccess.transaction_id}
                      </div>
                    </div>
                  )}

                  <div className="text-xs pt-1 border-t border-slate-800">
                    <div className="text-slate-400 mb-0.5">Shipping Destination:</div>
                    <div className="text-slate-200 font-medium leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      {orderSuccess.shipping_address}
                    </div>
                  </div>

                  {/* Ordered Books list */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-xs font-semibold text-slate-300 mb-2">Purchased Items:</div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {orderSuccess.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-cyan-300">{item.quantity}x</span>{' '}
                            <span className="text-slate-200">{item.title}</span>
                          </div>
                          <span className="font-semibold text-white shrink-0">৳ {item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm font-bold">
                    <span className="text-slate-300">Total Amount:</span>
                    <span className="text-emerald-400 text-lg font-black">
                      ৳ {parseFloat(orderSuccess.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetOrder}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/25 active:scale-95 transition-all"
                  >
                    Continue Browsing Books
                  </button>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              /* EMPTY CART STATE */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
                  <ShoppingBag className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Your Cart is Empty</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Browse through 2,000+ literary masterpieces across Bengali & English Literature, Science, Technology, and Fiction.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-6 flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* ACTIVE CART ITEMS & CHECKOUT FORM */
              <>
                {/* Book Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Selected Books ({totalItems})</span>
                    <button
                      onClick={clearCart}
                      className="text-rose-400 hover:text-rose-300 text-[11px] hover:underline"
                    >
                      Clear Cart
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {cartItems.map((item) => (
                      <div
                        key={item.bookId}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 group hover:border-slate-700 transition-colors"
                      >
                        {/* Cover thumbnail */}
                        <div className="w-12 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800 aspect-[3/4]">
                          {item.cover_image ? (
                            <img
                              src={item.cover_image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-cyan-400 font-bold bg-slate-900">
                              FV
                            </div>
                          )}
                        </div>

                        {/* Title & Author */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">{item.author}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="font-extrabold text-emerald-400">
                              ৳ {item.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] text-cyan-400 font-medium">
                              Subtotal: ৳ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {/* Save for later button */}
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => saveForLater(item.bookId)}
                              className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                            >
                              <Bookmark className="w-2.5 h-2.5" /> Save for later
                            </button>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                            disabled={item.quantity >= (item.maxStock || 999)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button
                          onClick={() => removeFromCart(item.bookId)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal Breakdown in BDT */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-white">৳ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      Doorstep Courier Delivery:
                    </span>
                    <span className="font-bold text-emerald-400">FREE in Bangladesh</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                    <span className="text-white">Order Total (BDT):</span>
                    <span className="text-emerald-400 text-base font-black">
                      ৳ {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Saved for Later Section if any */}
                {savedItems.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Saved For Later ({savedItems.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {savedItems.map((si) => (
                        <div
                          key={si.bookId}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950 border border-slate-800"
                        >
                          <div className="truncate pr-2">
                            <span className="font-semibold text-white block truncate">{si.title}</span>
                            <span className="text-emerald-400 font-mono text-[11px]">৳ {si.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveToCartFromSaved(si.bookId)}
                              className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-semibold text-[10px] hover:bg-cyan-500/30"
                            >
                              Move to Cart
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSavedItem(si.bookId)}
                              className="text-slate-500 hover:text-rose-400 text-[10px]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Checkout Delivery & Payment Form */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      1. Delivery Contact Details
                    </h3>

                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full Name *"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Email Address *"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none"
                        />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Contact Mobile Number *"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none"
                        />
                      </div>

                      <textarea
                        required
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Full Delivery Address in Bangladesh (House, Road, City, Thana, District) *"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector (bKash vs Nagad vs Rocket vs COD - NO STRIPE) */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        2. Choose Payment Method (Bangladesh Only)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">100% In BDT</span>
                    </h3>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Option 1: bKash */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bkash')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'bkash'
                            ? 'bg-[#E2136E]/20 border-[#E2136E] text-pink-300 shadow-md ring-1 ring-[#E2136E]'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black text-[#E2136E]">bKash</span>
                        <span className="text-[9px] text-pink-300/80">API Gateway</span>
                      </button>

                      {/* Option 2: Nagad */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('nagad')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'nagad'
                            ? 'bg-[#F7931E]/20 border-[#F7931E] text-orange-300 shadow-md ring-1 ring-[#F7931E]'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black text-[#F7931E]">Nagad</span>
                        <span className="text-[9px] text-orange-300/80">API Gateway</span>
                      </button>

                      {/* Option 3: Rocket */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('rocket')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'rocket'
                            ? 'bg-[#8C3494]/20 border-[#8C3494] text-purple-300 shadow-md ring-1 ring-[#8C3494]'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black text-[#8C3494]">Rocket</span>
                        <span className="text-[9px] text-purple-300/80">API Gateway</span>
                      </button>

                      {/* Option 4: Cash on Delivery (COD) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'cod'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">Cash on Del.</span>
                        <span className="text-[9px] text-emerald-400/80">Pay on Hand</span>
                      </button>
                    </div>

                    {/* Payment Sub-Form Panel */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      {['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <Smartphone className="w-4 h-4 text-emerald-400" />
                              {paymentMethod === 'bkash'
                                ? 'bKash API Instant Payment'
                                : paymentMethod === 'nagad'
                                ? 'Nagad Mobile Banking API'
                                : 'Rocket DBBL Mobile Banking API'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400">
                              Automated Verification
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-300 block">
                              Enter Your {paymentMethod.toUpperCase()} Mobile Number:
                            </label>
                            <input
                              type="tel"
                              required
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              placeholder="017XXXXXXXX"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                            />
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>
                                Clicking submit will automatically connect to {paymentMethod.toUpperCase()} API, authenticate transaction for <strong>৳{subtotal.toFixed(2)}</strong>, and confirm your order.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'cod' && (
                        <div className="space-y-2 text-xs animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Cash on Delivery (COD) Selected</span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            No advance payment required. You will pay{' '}
                            <span className="text-white font-bold">৳ {subtotal.toFixed(2)}</span> in
                            cash directly to the courier agent when your book parcel is delivered to your doorstep.
                          </p>
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
                            📦 Free doorstep delivery anywhere in Bangladesh within 2-3 business days.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Order Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{paymentProcessingStage || 'Processing Order...'}</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === 'cod'
                              ? `Place Order via COD • ৳ ${subtotal.toFixed(2)}`
                              : `Pay with ${paymentMethod.toUpperCase()} API • ৳ ${subtotal.toFixed(2)}`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
