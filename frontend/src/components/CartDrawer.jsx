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
  Sparkles,
  RefreshCw,
  Clock,
  History,
  Copy,
  BookOpen,
} from 'lucide-react';

export const CartDrawer = ({ onOrderPlaced }) => {
  const {
    cartItems,
    savedItems,
    cartHistory,
    orderHistory,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCartFromSaved,
    removeSavedItem,
    recordOrder,
    clearCart,
    clearCartHistory,
  } = useCart();

  const { user } = useAuth();

  // Tab State: 'cart' (Active Cart) | 'history' (Cart History) | 'saved' (Saved for Later)
  const [drawerTab, setDrawerTab] = useState('cart');

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.username || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('01712345678');
  const [shippingAddress, setShippingAddress] = useState('');
  
  // Payment Method Selection: 'bkash' | 'nagad' | 'rocket' | 'cod' (No foreign card processors)
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [mobileNumber, setMobileNumber] = useState('01712345678');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessingStage, setPaymentProcessingStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [copiedTrx, setCopiedTrx] = useState(false);

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
      // 1. If mobile banking (bKash, Nagad, Rocket), execute automated API Payment Gateway
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

      // 2. Create the Order in Backend Database
      const payload = {
        username: user?.username || '',
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

  const handleCopyTrx = (trxId) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(trxId);
      setCopiedTrx(true);
      setTimeout(() => setCopiedTrx(false), 2500);
    }
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
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white">Shopping Cart & History</h2>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                      {totalItems} in cart
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

            {/* Three Tab Switcher: Active Cart | Cart History | Saved for Later */}
            {!orderSuccess && (
              <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-800/70">
                <button
                  type="button"
                  onClick={() => setDrawerTab('cart')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    drawerTab === 'cart'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Cart ({totalItems})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab('history')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    drawerTab === 'history'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>History ({cartHistory.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab('saved')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    drawerTab === 'saved'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saved ({savedItems.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* VIEW 1: ORDER SUCCESS & SIMULATED MOBILE BANKING SMS CONFIRMATION */}
            {orderSuccess ? (
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-200 py-2">
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
                    Your book inventory has been decremented and reserved. Delivery is confirmed across Bangladesh.
                  </p>
                </div>

                {/* SIMULATED MOBILE BANKING SMS NOTIFICATION BOX (For bKash / Nagad / Rocket) */}
                {['bkash', 'nagad', 'rocket'].includes(orderSuccess.payment_method?.toLowerCase()) && (
                  <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-4 text-left shadow-2xl relative overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📱</span>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            {orderSuccess.payment_method.toUpperCase()} SMS Notification
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                              {orderSuccess.payment_method === 'bkash' ? '16247' : orderSuccess.payment_method === 'nagad' ? '16167' : '16216'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Sent to test number: <span className="text-white font-mono">{orderSuccess.customer_phone || mobileNumber}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> SMS Delivered
                      </span>
                    </div>

                    {/* Official SMS Body formatted like real telecom operator SMS */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed shadow-inner">
                      {orderSuccess.payment_method === 'bkash' && (
                        <>
                          Payment <span className="text-emerald-400 font-bold">Tk {parseFloat(orderSuccess.total_amount).toFixed(2)}</span> to <span className="text-white font-bold">FolioVerse Book Shop</span> successful. TrxID <span className="text-cyan-300 font-bold">{orderSuccess.transaction_id}</span> at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Balance: Tk 8,450.00. Fee Tk 0.00.
                        </>
                      )}
                      {orderSuccess.payment_method === 'nagad' && (
                        <>
                          Payment of <span className="text-emerald-400 font-bold">Tk {parseFloat(orderSuccess.total_amount).toFixed(2)}</span> to <span className="text-white font-bold">FolioVerse Book Shop</span> is successful. TxnID: <span className="text-cyan-300 font-bold">{orderSuccess.transaction_id}</span> at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Fee: Tk 0.00.
                        </>
                      )}
                      {orderSuccess.payment_method === 'rocket' && (
                        <>
                          Your payment of <span className="text-emerald-400 font-bold">Tk {parseFloat(orderSuccess.total_amount).toFixed(2)}</span> to <span className="text-white font-bold">FolioVerse Book Shop</span> completed. TrxID: <span className="text-cyan-300 font-bold">{orderSuccess.transaction_id}</span>. Fee Tk 0.00.
                        </>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>⚡ Automated Mobile Banking Gateway Verified</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTrx(orderSuccess.transaction_id)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedTrx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy TrxID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Receipt Card */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 text-left space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Order Number</div>
                      <div className="text-sm font-mono font-bold text-cyan-300">
                        #{orderSuccess.order_number}
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
                      <div className="text-slate-400">Payment Channel</div>
                      <div className="font-bold text-emerald-400 uppercase">
                        {orderSuccess.payment_method}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {orderSuccess.payment_status === 'paid' ? 'Paid & Verified' : 'Cash on Delivery'}
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

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm font-bold">
                    <span className="text-slate-300">Total Paid (BDT):</span>
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
            ) : drawerTab === 'history' ? (
              /* VIEW 2: CART HISTORY / RECENT ACTIVITY */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <History className="w-4 h-4 text-purple-400" />
                      Cart Activity & Added Books History
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Saved chronological trail of books you've added to cart
                    </p>
                  </div>
                  {cartHistory.length > 0 && (
                    <button
                      onClick={clearCartHistory}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {cartHistory.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                    <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">No Cart History Yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                      Books you add to your cart from the catalog will be recorded here so you can review or re-order anytime.
                    </p>
                    <button
                      onClick={() => setDrawerTab('cart')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      Go to Active Cart
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {cartHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.cover_image ? (
                            <img
                              src={item.cover_image}
                              alt={item.title}
                              className="w-10 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 text-slate-600">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">by {item.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold truncate border border-slate-700">
                                {item.category || 'Literature & Novel'}
                              </span>
                              <span className="text-xs font-black text-emerald-400">
                                ৳ {parseFloat(item.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addToCart(item, 1);
                            setDrawerTab('cart');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold whitespace-nowrap shrink-0 transition-all"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : drawerTab === 'saved' ? (
              /* VIEW 3: SAVED FOR LATER */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      Saved for Later ({savedItems.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Books moved from cart to keep for future purchase
                    </p>
                  </div>
                </div>

                {savedItems.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                    <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">No Saved Items</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                      Click "Save for later" on any book in your cart to park it here.
                    </p>
                    <button
                      onClick={() => setDrawerTab('cart')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      View Active Cart
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {savedItems.map((si) => (
                      <div
                        key={si.bookId || si.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{si.title}</h4>
                          <p className="text-[11px] text-slate-400 truncate">by {si.author}</p>
                          <div className="text-xs font-black text-emerald-400 mt-1">
                            ৳ {parseFloat(si.price).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              moveToCartFromSaved(si.bookId || si.id);
                              setDrawerTab('cart');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all"
                          >
                            Move to Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedItem(si.bookId || si.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : cartItems.length === 0 ? (
              /* VIEW 4: EMPTY ACTIVE CART */
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-200">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
                  <ShoppingBag className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Your Cart is Empty</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Browse through 2,000+ literary masterpieces across Bengali & English Literature, Science, Technology, and Fiction.
                </p>

                {cartHistory.length > 0 && (
                  <button
                    onClick={() => setDrawerTab('history')}
                    className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-500/30 transition-all"
                  >
                    <History className="w-3.5 h-3.5" /> View {cartHistory.length} Previous Items in History
                  </button>
                )}

                <button
                  onClick={closeCart}
                  className="mt-6 flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* VIEW 5: ACTIVE CART ITEMS & CHECKOUT FORM */
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

                  {/* Payment Method Selector (bKash vs Nagad vs Rocket vs COD) */}
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
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'bkash'
                            ? 'bg-pink-950/60 border-pink-500 text-white shadow-lg shadow-pink-950/40 ring-1 ring-pink-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black text-pink-400">bKash</span>
                        <span className="text-[10px] text-slate-400">Mobile API</span>
                      </button>

                      {/* Option 2: Nagad */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('nagad')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'nagad'
                            ? 'bg-orange-950/60 border-orange-500 text-white shadow-lg shadow-orange-950/40 ring-1 ring-orange-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black text-orange-400">Nagad</span>
                        <span className="text-[10px] text-slate-400">Mobile API</span>
                      </button>

                      {/* Option 3: Rocket */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('rocket')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'rocket'
                            ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black text-purple-400">Rocket</span>
                        <span className="text-[10px] text-slate-400">DBBL Mobile</span>
                      </button>

                      {/* Option 4: Cash on Delivery */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'cod'
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black text-emerald-400">COD</span>
                        <span className="text-[10px] text-slate-400">Cash on Delivery</span>
                      </button>
                    </div>

                    {/* Dynamic Provider Input Box */}
                    {['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            {paymentMethod.toUpperCase()} Account Number:
                          </span>
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">
                            API Automated
                          </span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-mono text-xs outline-none"
                        />
                        <div className="text-[11px] text-slate-400 leading-relaxed">
                          🔒 Seamless API checkout: An automated payment gateway transaction will complete instantly without manual TrxID typing.
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2 animate-in fade-in duration-150">
                        <Truck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white">Cash on Delivery (COD):</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Pay the courier directly in cash after opening and verifying your books upon doorstep arrival.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || cartItems.length === 0}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{paymentProcessingStage || 'Processing Payment...'}</span>
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

          {/* Drawer Footer */}
          {!orderSuccess && (
            <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/90 text-center text-[11px] text-slate-400">
              FolioVerse Bangladesh • Prices in BDT • 100% Genuine Books
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
