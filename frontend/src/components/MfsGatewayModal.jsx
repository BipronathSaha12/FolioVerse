import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldCheck, QrCode, Smartphone, KeyRound, CheckCircle2, 
  AlertCircle, RefreshCw, Lock, ArrowLeft, ArrowRight, Clock, Copy, Check
} from 'lucide-react';
import { orderService } from '../services/api';

/**
 * High-Fidelity MFS Payment Gateway Modal for bKash, Nagad, and Rocket.
 * Provides authentic multi-channel checkout:
 * - Dynamic QR Code generation with 5-minute countdown and simulated app approval
 * - Mobile number validation -> Carrier SMS OTP dispatch (6-digit) -> Resend timer
 * - Bank-grade masked PIN keypad (•••••) with numeric keyboard and encryption disclaimer
 * - Atomic order settlement and digital transaction receipt
 */
export function MfsGatewayModal({ 
  isOpen, 
  onClose, 
  order, 
  provider = 'bkash', 
  onPaymentSuccess, 
  onPaymentCancel 
}) {
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' | 'qr'
  const [step, setStep] = useState('phone_input'); // 'phone_input' | 'otp_input' | 'pin_input' | 'success'
  
  // Session state from backend
  const [sessionId, setSessionId] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Phone & OTP state
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [incomingSms, setIncomingSms] = useState(null); // Simulated carrier SMS toast
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // PIN state
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  
  // QR session countdown (5 minutes)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(300);
  
  // Final payment result
  const [paymentResult, setPaymentResult] = useState(null);
  const [copiedTrx, setCopiedTrx] = useState(false);

  const otpInputRefs = useRef([]);

  // Theme settings based on provider
  const theme = {
    bkash: {
      name: 'bKash',
      tagline: 'bKash Payment Gateway',
      shortCode: '16247',
      primaryColor: '#E2136E',
      headerBg: 'bg-gradient-to-r from-[#b30e56] to-[#E2136E]',
      accentBg: 'bg-[#E2136E]/10',
      accentBorder: 'border-[#E2136E]/30',
      accentText: 'text-[#E2136E]',
      btnBg: 'bg-[#E2136E] hover:bg-[#c4105f]',
      tabActive: 'bg-[#E2136E] text-white shadow-lg shadow-[#E2136E]/20',
      badge: 'bKash PGW v1.2',
    },
    nagad: {
      name: 'Nagad',
      tagline: 'Nagad Direct Payment Portal',
      shortCode: '16167',
      primaryColor: '#F7931E',
      headerBg: 'bg-gradient-to-r from-[#d97c0f] to-[#F7931E]',
      accentBg: 'bg-[#F7931E]/10',
      accentBorder: 'border-[#F7931E]/30',
      accentText: 'text-[#F7931E]',
      btnBg: 'bg-[#F7931E] hover:bg-[#e07f10]',
      tabActive: 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20',
      badge: 'Nagad Secure PG',
    },
    rocket: {
      name: 'Rocket',
      tagline: 'DBBL Rocket Mobile Gateway',
      shortCode: '16216',
      primaryColor: '#8C3494',
      headerBg: 'bg-gradient-to-r from-[#6e2275] to-[#8C3494]',
      accentBg: 'bg-[#8C3494]/10',
      accentBorder: 'border-[#8C3494]/30',
      accentText: 'text-[#8C3494]',
      btnBg: 'bg-[#8C3494] hover:bg-[#77287e]',
      tabActive: 'bg-[#8C3494] text-white shadow-lg shadow-[#8C3494]/20',
      badge: 'Rocket Banking',
    },
  }[provider.toLowerCase()] || {
    name: 'MFS',
    tagline: 'Mobile Financial Services',
    shortCode: '16247',
    primaryColor: '#0ea5e9',
    headerBg: 'bg-gradient-to-r from-sky-600 to-cyan-500',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    accentText: 'text-cyan-400',
    btnBg: 'bg-cyan-600 hover:bg-cyan-500',
    tabActive: 'bg-cyan-500 text-white',
    badge: 'MFS Secure',
  };

  // Initialize session whenever modal opens
  useEffect(() => {
    if (!isOpen || !order?.id) return;

    // Reset local state
    setStep('phone_input');
    setErrorMessage('');
    setPinError('');
    setOtpDigits(['', '', '', '', '', '']);
    setPinValue('');
    setIncomingSms(null);
    setPaymentResult(null);
    setMobileNumber(order.customer_phone || '');
    setSessionSecondsLeft(300);

    const initGateway = async () => {
      setLoading(true);
      try {
        const res = await orderService.gatewayInitiate({
          order_id: order.id,
          provider: provider.toLowerCase(),
          amount: order.total_amount,
          phone: order.customer_phone || '',
        });
        setSessionId(res.data.session_id);
        setSessionData(res.data);
      } catch (err) {
        console.error('Failed to initiate MFS gateway:', err);
        setErrorMessage(
          err.response?.data?.error || 'Unable to establish secure gateway handshake. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    initGateway();
  }, [isOpen, order, provider]);

  // Session countdown timer
  useEffect(() => {
    if (!isOpen || step === 'success') return;
    const interval = setInterval(() => {
      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage('Session expired. Please close this window and try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step]);

  // OTP resend countdown timer
  useEffect(() => {
    if (step !== 'otp_input') return;
    setResendTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Format seconds as MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handler: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      setErrorMessage('Please enter an 11-digit valid Bangladeshi mobile number (e.g. 01712345678).');
      return;
    }

    setLoading(true);
    try {
      const res = await orderService.gatewaySendOtp({
        session_id: sessionId,
        phone: cleanPhone,
      });

      setIncomingSms({
        sender: res.data.sms_sender,
        message: res.data.sms_message,
        code: res.data.otp_code,
      });
      setStep('otp_input');
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } catch (err) {
      console.error('OTP dispatch failed:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch OTP. Please check mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: OTP Input Change (Auto-advance)
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handler: OTP Keydown (Backspace navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handler: Paste entire OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Quick helper to autofill OTP
  const handleAutofillOtp = () => {
    if (incomingSms?.code) {
      const codeDigits = incomingSms.code.split('');
      setOtpDigits(codeDigits);
    }
  };

  // Handler: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await orderService.gatewayVerifyOtp({
        session_id: sessionId,
        otp_code: enteredOtp,
      });
      setStep('pin_input');
    } catch (err) {
      console.error('OTP verification failed:', err);
      setErrorMessage(err.response?.data?.error || 'Invalid OTP code entered. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: On-screen Keypad click for PIN
  const handleKeypadPress = (val) => {
    setPinError('');
    if (val === 'backspace') {
      setPinValue((prev) => prev.slice(0, -1));
    } else if (pinValue.length < 5) {
      setPinValue((prev) => prev + val);
    }
  };

  // Handler: Confirm PIN and Finalize
  const handleConfirmPin = async (e) => {
    if (e) e.preventDefault();
    setPinError('');

    if (pinValue.length < 4) {
      setPinError('Please enter your 4 or 5-digit PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await orderService.gatewayConfirmPin({
        session_id: sessionId,
        pin: pinValue,
      });

      setPaymentResult(res.data);
      setStep('success');
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err) {
      console.error('PIN confirmation failed:', err);
      setPinError(err.response?.data?.error || 'PIN verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Dynamic App QR Scan Simulation
  const handleSimulateQrScan = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await orderService.gatewayQrScan({
        session_id: sessionId,
      });
      setPaymentResult(res.data);
      setStep('success');
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err) {
      console.error('App QR scan failed:', err);
      setErrorMessage(err.response?.data?.error || 'App QR payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Cancel / Close
  const handleClose = async () => {
    if (sessionId && step !== 'success') {
      try {
        await orderService.gatewayCancel({ session_id: sessionId });
      } catch (err) {
        // silent fail on cancel
      }
    }
    if (onPaymentCancel && step !== 'success') {
      onPaymentCancel();
    }
    onClose();
  };

  const handleCopyTrx = (trx) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(trx);
      setCopiedTrx(true);
      setTimeout(() => setCopiedTrx(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={handleClose} 
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header with Provider Branding */}
        <div className={`${theme.headerBg} p-4 sm:p-5 text-white flex items-center justify-between shadow-md`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xl shadow-inner">
              {theme.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight tracking-wide">{theme.name} Payment</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                  {theme.badge}
                </span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3" /> Merchant: FolioVerse Books • 256-Bit Encrypted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-md text-xs font-mono font-bold flex items-center gap-1.5 text-white/90">
              <Clock className="w-3 h-3 animate-spin text-white/70" />
              {formatTime(sessionSecondsLeft)}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Summary Ribbon */}
        <div className="bg-slate-950/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
          <div>
            <span className="text-slate-400">Order ID: </span>
            <span className="font-mono font-bold text-slate-200">{order?.order_number || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Payable: </span>
            <span className="text-base font-extrabold text-cyan-400">৳{order?.total_amount || '0.00'}</span>
          </div>
        </div>

        {/* Simulated Carrier SMS Notification Toast (Appears when OTP sent) */}
        {incomingSms && step === 'otp_input' && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-in slide-in-from-top-3 duration-300 flex items-start gap-3 shadow-lg">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold shrink-0">
              SMS
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-bold text-amber-300 mb-0.5">
                <span>Incoming Carrier SMS ({incomingSms.sender})</span>
                <span className="text-[10px] text-amber-400/80 font-normal">Just now</span>
              </div>
              <p className="text-slate-300 leading-snug">{incomingSms.message}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutofillOtp}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 font-bold text-xs transition-all flex items-center gap-1"
                >
                  Auto-fill OTP: <span className="underline font-mono tracking-wider">{incomingSms.code}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 overflow-y-auto flex-1">

          {/* SUCCESS SCREEN */}
          {step === 'success' && paymentResult ? (
            <div className="text-center py-4 sm:py-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-white">Payment Verified & Settled!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Transferred via {paymentResult.provider_name} Core Banking API
                </p>
              </div>

              {/* Digital Payment Receipt Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 max-w-sm mx-auto font-mono text-xs shadow-inner">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <span>{paymentResult.transaction_id}</span>
                    <button
                      onClick={() => handleCopyTrx(paymentResult.transaction_id)}
                      className="text-slate-400 hover:text-white"
                      title="Copy Transaction ID"
                    >
                      {copiedTrx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Order Number:</span>
                  <span className="text-white font-bold">{paymentResult.order_number}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Provider:</span>
                  <span className="text-white font-bold">{paymentResult.provider_name}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">৳{paymentResult.amount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                    {paymentResult.status}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full max-w-sm mx-auto py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Close & View Updated Order History
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dual Tab Mode Switcher: Mobile Number vs Dynamic QR Code */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('phone'); setErrorMessage(''); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'phone' ? theme.tabActive : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Phone Number & PIN
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('qr'); setErrorMessage(''); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'qr' ? theme.tabActive : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> Dynamic QR Code
                </button>
              </div>

              {/* TAB 1: DYNAMIC QR CODE SCANNING */}
              {activeTab === 'qr' ? (
                <div className="text-center py-2 space-y-4">
                  <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 inline-block shadow-inner">
                    {/* SVG DYNAMIC QR CODE DISPLAY */}
                    <div className="relative w-48 h-48 bg-white p-3 rounded-2xl mx-auto shadow-md flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                        {/* Dynamic Pattern Squares simulating real QR Matrix */}
                        <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="4" y="4" width="22" height="22" fill="#fff" />
                        <rect x="8" y="8" width="14" height="14" fill="currentColor" />

                        <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                        <rect x="74" y="4" width="22" height="22" fill="#fff" />
                        <rect x="78" y="8" width="14" height="14" fill="currentColor" />

                        <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                        <rect x="4" y="74" width="22" height="22" fill="#fff" />
                        <rect x="8" y="78" width="14" height="14" fill="currentColor" />

                        {/* Middle dynamic data points */}
                        <circle cx="50" cy="50" r="10" fill={theme.primaryColor} />
                        <rect x="40" y="10" width="8" height="8" />
                        <rect x="52" y="15" width="6" height="6" />
                        <rect x="35" y="35" width="8" height="8" />
                        <rect x="65" y="40" width="6" height="6" />
                        <rect x="45" y="70" width="10" height="6" />
                        <rect x="65" y="65" width="8" height="8" />
                        <rect x="75" y="75" width="10" height="10" />
                        <rect x="15" y="45" width="6" height="10" />
                        <rect x="85" y="45" width="8" height="6" />
                      </svg>

                      {/* Brand Logo Stamp in center */}
                      <div 
                        className="absolute w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[11px] font-black shadow-md"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {theme.name.charAt(0)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Scan with {theme.name} Mobile App</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Open your {theme.name} App, tap "QR Scan", point camera at screen, and authorize payment with your PIN.
                    </p>
                  </div>

                  {/* Simulator Trigger Button for QR Flow */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={loading || sessionSecondsLeft <= 0}
                      onClick={handleSimulateQrScan}
                      className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 hover:border-slate-600 shadow-md"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      ) : (
                        <QrCode className="w-4 h-4 text-cyan-400" />
                      )}
                      Simulate App QR Scan & Approval (1-Click Test)
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB 2: MOBILE NUMBER -> SMS OTP -> PIN KEYPAD */
                <div className="space-y-4">

                  {/* STEP 1: MOBILE NUMBER ENTRY */}
                  {step === 'phone_input' && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {theme.name} Account Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            maxLength="11"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="017XXXXXXXX"
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white text-base font-mono tracking-wider focus:outline-none focus:border-cyan-500 transition-all"
                            required
                          />
                          <div className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-bold">
                            BD (+880)
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          A 6-digit verification OTP will be sent via SMS to this number.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || sessionSecondsLeft <= 0}
                        className={`w-full py-3.5 rounded-2xl ${theme.btnBg} text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2`}
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Send Verification Code (OTP) <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* STEP 2: 6-DIGIT OTP INPUT */}
                  {step === 'otp_input' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="text-center">
                        <h4 className="text-sm font-bold text-white">Enter 6-Digit Verification Code</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Sent to <span className="font-mono text-slate-200">{mobileNumber}</span>
                        </p>
                      </div>

                      {/* 6 Auto-Tabbing Digit Boxes */}
                      <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-2" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpInputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-11 h-13 sm:w-12 sm:h-14 bg-slate-950 border-2 border-slate-700 rounded-2xl text-center text-xl sm:text-2xl font-mono font-bold text-white focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => { setStep('phone_input'); setErrorMessage(''); }}
                          className="text-slate-400 hover:text-white flex items-center gap-1 transition-all"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Change Number
                        </button>

                        <div>
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-cyan-400 hover:text-cyan-300 font-bold transition-all flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Resend Code
                            </button>
                          ) : (
                            <span className="text-slate-500">
                              Resend code in <span className="text-slate-300 font-bold">{resendTimer}s</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpDigits.join('').length < 6}
                        className={`w-full py-3.5 rounded-2xl ${theme.btnBg} text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Verify OTP Code <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* STEP 3: MASKED SECURITY PIN ENTRY (WITH SECURE KEYPAD) */}
                  {step === 'pin_input' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-2">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Enter {theme.name} Secret PIN</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Authorized directly by core banking ledger. PIN is never saved.
                        </p>
                      </div>

                      {/* Masked PIN Indicators */}
                      <div className="flex items-center justify-center gap-3 py-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              pinValue.length > i
                                ? 'bg-cyan-400 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          />
                        ))}
                      </div>

                      {pinError && (
                        <p className="text-center text-xs text-rose-400 font-bold animate-shake">
                          {pinError}
                        </p>
                      )}

                      {/* On-Screen Numeric Keypad */}
                      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleKeypadPress(num.toString())}
                            className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-white transition-all active:scale-95"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { setStep('otp_input'); setPinValue(''); }}
                          className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 transition-all flex items-center justify-center"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadPress('0')}
                          className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-white transition-all active:scale-95"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadPress('backspace')}
                          className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 transition-all flex items-center justify-center active:scale-95"
                        >
                          ⌫
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={loading || pinValue.length < 4}
                        onClick={handleConfirmPin}
                        className={`w-full py-3.5 rounded-2xl ${theme.btnBg} text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2`}
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-4 h-4" /> Confirm Payment of ৳{order?.total_amount}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Security Badges */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Authorized by Bangladesh Bank • PCI-DSS Certified Gateway</span>
        </div>

      </div>
    </div>
  );
}
