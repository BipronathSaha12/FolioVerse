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
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const CartDrawer = ({ onOrderPlaced }) => {
  const {
    cartItems,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { user } = useAuth();

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.username || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' | 'bkash' | 'nagad' | 'rocket' | 'cod'
  const [mobileProvider, setMobileProvider] = useState('bkash'); // 'bkash' | 'nagad' | 'rocket'
  const [transactionId, setTransactionId] = useState('');

  // Stripe Mock Inputs
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

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

  const handleCopyMerchant = (number) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty. Please add books to proceed.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name for the order delivery.');
      return;
    }

    if (!customerEmail.trim()) {
      setErrorMsg('Please enter your email address for order confirmation.');
      return;
    }

    if (!shippingAddress.trim()) {
      setErrorMsg('Please provide a complete shipping address.');
      return;
    }

    const effectivePaymentMethod =
      paymentMethod === 'mobile' ? mobileProvider : paymentMethod;

    if (
      ['bkash', 'nagad', 'rocket'].includes(effectivePaymentMethod) &&
      !transactionId.trim()
    ) {
      setErrorMsg(
        `Please enter the Transaction ID (TrxID) received from your ${effectivePaymentMethod.toUpperCase()} payment.`
      );
      return;
    }

    const payload = {
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      shipping_address: shippingAddress.trim(),
      payment_method: effectivePaymentMethod,
      transaction_id:
        ['bkash', 'nagad', 'rocket'].includes(effectivePaymentMethod)
          ? transactionId.trim()
          : effectivePaymentMethod === 'stripe'
          ? `ch_stripe_${Date.now().toString(36)}`
          : '',
      items: cartItems.map((item) => ({
        book_id: item.bookId || item.id,
        quantity: item.quantity,
      })),
    };

    setIsSubmitting(true);

    try {
      const res = await orderService.createOrder(payload);
      setOrderSuccess(res.data);
      clearCart();
      if (onOrderPlaced) onOrderPlaced(res.data);
    } catch (err) {
      console.error('Order creation failed:', err);
      const serverErr =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Unable to process your order right now. Please check inventory and try again.';
      setErrorMsg(serverErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetOrder = () => {
    setOrderSuccess(null);
    setTransactionId('');
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
                <p className="text-xs text-slate-400">FolioVerse Fast Delivery Book Store</p>
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
                    <Sparkles className="w-3.5 h-3.5" /> Order Placed Successfully!
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Thank You for Your Order!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    A confirmation receipt has been generated. Your books are being prepared for dispatch.
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
                        Status: <span className="text-cyan-300">{orderSuccess.payment_status}</span>
                      </div>
                    </div>
                  </div>

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
                          <span className="font-semibold text-white shrink-0">${item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm font-bold">
                    <span className="text-slate-300">Total Charged:</span>
                    <span className="text-emerald-400 text-lg font-black">
                      ${parseFloat(orderSuccess.total_amount).toFixed(2)}
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
                              ${item.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] text-cyan-400 font-medium">
                              Subtotal: ${(item.price * item.quantity).toFixed(2)}
                            </span>
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

                {/* Subtotal Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      Courier Shipping:
                    </span>
                    <span className="font-bold text-emerald-400">FREE Delivery</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Tax:</span>
                    <span className="font-semibold text-slate-300">$0.00</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                    <span className="text-white">Order Total:</span>
                    <span className="text-emerald-400 text-base font-black">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

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
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Phone / Mobile Number"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none"
                        />
                      </div>

                      <textarea
                        required
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Full Shipping Address (House, Road, City, Postal Code) *"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-500 text-xs outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector (Stripe vs Mobile Banking vs COD) */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      2. Choose Payment Method
                    </h3>

                    {/* Options Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Option 1: Stripe */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'stripe'
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-cyan-400" />
                        <span className="text-[11px] font-bold">Stripe Card</span>
                        <span className="text-[9px] text-cyan-400/80">Debit / Credit</span>
                      </button>

                      {/* Option 2: Mobile Banking (bKash / Nagad / Rocket) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'mobile'
                            ? 'bg-pink-950/50 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10 ring-1 ring-pink-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-pink-400" />
                        <span className="text-[11px] font-bold">bKash / Nagad</span>
                        <span className="text-[9px] text-pink-400/80">Mobile Banking</span>
                      </button>

                      {/* Option 3: Cash on Delivery (COD) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'cod'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Truck className="w-5 h-5 text-emerald-400" />
                        <span className="text-[11px] font-bold">Cash on Del.</span>
                        <span className="text-[9px] text-emerald-400/80">Pay on Hand</span>
                      </button>
                    </div>

                    {/* Payment Sub-Form Panel */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      {paymentMethod === 'stripe' && (
                        <div className="space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Stripe Secure Checkout
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono">VISA / MC / AMEX</span>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="Card Number"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM / YY"
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                              />
                              <input
                                type="text"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="CVC"
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Card details encrypted end-to-end via Stripe API protocol.
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'mobile' && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          {/* Provider Selector Tabs */}
                          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setMobileProvider('bkash')}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                mobileProvider === 'bkash'
                                  ? 'bg-[#E2136E] text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              bKash
                            </button>
                            <button
                              type="button"
                              onClick={() => setMobileProvider('nagad')}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                mobileProvider === 'nagad'
                                  ? 'bg-[#F7931E] text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Nagad
                            </button>
                            <button
                              type="button"
                              onClick={() => setMobileProvider('rocket')}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                mobileProvider === 'rocket'
                                  ? 'bg-[#8C3494] text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Rocket
                            </button>
                          </div>

                          {/* Merchant Account Details Box */}
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">
                                {mobileProvider.toUpperCase()} Merchant No:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyMerchant(
                                    mobileProvider === 'bkash'
                                      ? '01712345678'
                                      : mobileProvider === 'nagad'
                                      ? '01812345678'
                                      : '01912345678'
                                  )
                                }
                                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono"
                              >
                                {copiedNumber ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="text-sm font-mono font-bold text-white tracking-wider">
                              {mobileProvider === 'bkash'
                                ? '01712-345678'
                                : mobileProvider === 'nagad'
                                ? '01812-345678'
                                : '01912-345678'}
                            </div>
                            <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                              Send Money or Pay <span className="text-emerald-400 font-bold">${subtotal.toFixed(2)}</span> with reference <span className="text-cyan-300 font-bold">FOLIOVERSE</span>.
                            </div>
                          </div>

                          {/* TrxID Input */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                              <span>Transaction ID (TrxID) *</span>
                              <span className="text-[10px] text-slate-500">e.g. 9J2K8L1M0N</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                              placeholder="Enter TrxID after sending payment"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none uppercase"
                            />
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
                            No online payment required now. You will pay{' '}
                            <span className="text-white font-bold">${subtotal.toFixed(2)}</span> in
                            cash directly to the courier agent when your book parcel is delivered to your doorstep.
                          </p>
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
                            📦 Standard delivery: 2-3 business days with free parcel tracking.
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
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {paymentMethod === 'stripe'
                              ? `Pay with Stripe Card ($${subtotal.toFixed(2)})`
                              : paymentMethod === 'mobile'
                              ? `Confirm ${mobileProvider.toUpperCase()} Order ($${subtotal.toFixed(2)})`
                              : `Place Cash on Delivery Order ($${subtotal.toFixed(2)})`}
                          </span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-slate-500 mt-2">
                      By placing this order you agree to FolioVerse Terms of Service & Book Return Policy.
                    </p>
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
