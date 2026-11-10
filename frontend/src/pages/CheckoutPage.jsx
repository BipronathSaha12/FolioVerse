import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import { MfsGatewayModal } from '../components/MfsGatewayModal';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ArrowLeft,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CheckoutPage = ({ onOrderPlaced, addToast }) => {
  const { cartItems, totalItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.username || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('01712345678');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Interactive MFS Gateway Modal State
  const [gatewayModal, setGatewayModal] = useState({
    isOpen: false,
    orderId: null,
    orderNumber: '',
    provider: 'bkash',
    amount: '0.00',
    phone: '',
  });

  // Confirmed Order Screen State
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const deliveryFee = subtotal >= 1000 ? 0 : subtotal > 0 ? 60 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter your full customer name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!shippingAddress.trim()) {
      setFormError('Please provide your complete shipping delivery address.');
      return;
    }
    if (cartItems.length === 0) {
      setFormError('Your cart is empty. Please add books before checkout.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          book_id: item.id,
          quantity: item.quantity,
        })),
      };

      const res = await orderService.createOrder(orderPayload);
      const createdOrder = res.data;

      if (['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
        // Open the Interactive MFS Gateway Session
        setGatewayModal({
          isOpen: true,
          orderId: createdOrder.id,
          orderNumber: createdOrder.order_number,
          provider: paymentMethod,
          amount: parseFloat(createdOrder.total_amount).toFixed(2),
          phone: customerPhone.trim(),
        });
      } else {
        // Cash on Delivery confirmed immediately
        setConfirmedOrder(createdOrder);
        clearCart();
        if (addToast) addToast(`Order #${createdOrder.order_number} confirmed with COD!`, 'success', 'Order Confirmed');
        if (onOrderPlaced) onOrderPlaced(createdOrder);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Unable to process your order. Please verify your details.';
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGatewayPaymentSuccess = (paymentResult) => {
    setGatewayModal((prev) => ({ ...prev, isOpen: false }));
    const finalOrder = {
      order_number: gatewayModal.orderNumber,
      total_amount: gatewayModal.amount,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
      payment_method: gatewayModal.provider,
      payment_status: 'paid',
      transaction_id: paymentResult.transaction_id,
    };
    setConfirmedOrder(finalOrder);
    clearCart();
    if (addToast) {
      addToast(
        `Payment verified via ${gatewayModal.provider.toUpperCase()} (TXN: ${paymentResult.transaction_id})`,
        'success',
        'Payment Complete'
      );
    }
    if (onOrderPlaced) onOrderPlaced(finalOrder);
  };

  // If order is successfully placed, render high-fidelity confirmation view
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              Thank you for your purchase!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your order has been recorded in the FolioVerse database.
            </p>
          </div>

          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Order Number:</span>
              <span className="font-mono font-bold text-cyan-400">{confirmedOrder.order_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Customer Name:</span>
              <span className="font-semibold text-white">{confirmedOrder.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Recipient Email:</span>
              <span className="text-slate-300 font-mono">{confirmedOrder.customer_email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Payment Method:</span>
              <span className="font-semibold text-emerald-400 uppercase">{confirmedOrder.payment_method}</span>
            </div>
            {confirmedOrder.transaction_id && (
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">MFS Transaction ID:</span>
                <span className="font-mono font-semibold text-amber-300">{confirmedOrder.transaction_id}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-bold text-white">
              <span>Total Paid:</span>
              <span className="text-emerald-400 font-black">৳{parseFloat(confirmedOrder.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-900/20"
            >
              Back to Catalog
            </Link>
            <Link
              to="/dashboard/buyer"
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all border border-slate-700"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400" /> Checkout & Payment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provide shipping information and choose an instant Mobile Financial Services (MFS) gateway or Cash on Delivery.
          </p>
        </div>

        <Link
          to="/cart"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/80 rounded-3xl max-w-lg mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">No items to checkout</h2>
          <p className="text-xs text-slate-400 mb-5">Please add books to your cart first.</p>
          <Link
            to="/"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition-all"
          >
            Browse Books
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Details (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {formError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Shipping Info Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Truck className="w-4 h-4 text-cyan-400" /> 1. Shipping & Customer Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tanvir@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Contact Phone (For Courier & MFS SMS) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Delivery Address <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="House/Apartment #, Road, Area, Thana, District"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Smartphone className="w-4 h-4 text-emerald-400" /> 2. Payment Method
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    paymentMethod === 'bkash'
                      ? 'bg-[#E2136E]/15 border-[#E2136E] text-white shadow-lg shadow-[#E2136E]/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#E2136E] text-white font-extrabold flex items-center justify-center text-xs">
                    bK
                  </div>
                  <span className="text-xs font-bold">bKash</span>
                  <span className="text-[10px] text-slate-400">Mobile Banking</span>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    paymentMethod === 'nagad'
                      ? 'bg-[#F7931E]/15 border-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#F7931E] text-white font-extrabold flex items-center justify-center text-xs">
                    Ng
                  </div>
                  <span className="text-xs font-bold">Nagad</span>
                  <span className="text-[10px] text-slate-400">Mobile Banking</span>
                </button>

                {/* Rocket */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('rocket')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    paymentMethod === 'rocket'
                      ? 'bg-[#8C3494]/15 border-[#8C3494] text-white shadow-lg shadow-[#8C3494]/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#8C3494] text-white font-extrabold flex items-center justify-center text-xs">
                    Rk
                  </div>
                  <span className="text-xs font-bold">Rocket</span>
                  <span className="text-[10px] text-slate-400">DBBL Banking</span>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    paymentMethod === 'cod'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs">
                    COD
                  </div>
                  <span className="text-xs font-bold">Cash On Delivery</span>
                  <span className="text-[10px] text-slate-400">Doorstep Pay</span>
                </button>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs text-slate-400">
                {paymentMethod === 'cod' ? (
                  <span>Pay upon receiving your books. Please keep exact cash ready for the delivery rider.</span>
                ) : (
                  <span>
                    You will be directed to the interactive{' '}
                    <strong className="text-white uppercase">{paymentMethod}</strong> gateway to authorize SMS OTP and enter your PIN.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cart Order Summary (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5 sticky top-24">
              <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-cyan-400">{totalItems} books</span>
              </h2>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 text-xs">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-slate-300">
                    <span className="truncate flex-1">
                      {item.quantity}x {item.title}
                    </span>
                    <span className="font-semibold text-white whitespace-nowrap">
                      ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-emerald-400">
                    {deliveryFee === 0 ? 'FREE' : `৳${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold text-white">
                  <span>Grand Total</span>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                    ৳{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold rounded-xl text-sm transition-all shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirm & Place Order (৳{grandTotal.toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Interactive MFS Payment Gateway Modal Component */}
      <MfsGatewayModal
        isOpen={gatewayModal.isOpen}
        orderId={gatewayModal.orderId}
        orderNumber={gatewayModal.orderNumber}
        provider={gatewayModal.provider}
        amount={gatewayModal.amount}
        customerPhone={gatewayModal.phone}
        onClose={() => setGatewayModal((prev) => ({ ...prev, isOpen: false }))}
        onPaymentSuccess={handleGatewayPaymentSuccess}
      />
    </div>
  );
};
