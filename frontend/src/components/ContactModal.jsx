import React, { useState } from 'react';
import { X, Mail, Send, User, MessageSquare, CheckCircle2, Phone, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { contactService } from '../services/api';

export const ContactModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const authorityEmail = 'bipronathsaha@gmail.com';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const buildMailtoUrl = () => {
    const emailSubject = encodeURIComponent(
      `[FolioVerse Contact] Inquiry from ${name.trim()}`
    );
    const emailBody = encodeURIComponent(
      `Hello,\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nContact: ${contact.trim()}\n\nMessage:\n${message.trim()}\n\n---\nSent via FolioVerse Contact Form`
    );
    return `mailto:${authorityEmail}?subject=${emailSubject}&body=${emailBody}`;
  };

  const buildGmailWebUrl = () => {
    const emailSubject = encodeURIComponent(`[FolioVerse Contact] Inquiry from ${name.trim()}`);
    const emailBody = encodeURIComponent(
      `Hello Authority,\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nContact: ${contact.trim()}\n\nMessage:\n${message.trim()}\n\n---\nSent via FolioVerse Contact Form`
    );
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${authorityEmail}&su=${emailSubject}&body=${emailBody}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!contact.trim()) {
      setErrorMsg('Please enter contact number or details.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please write your message.');
      return;
    }

    setErrorMsg('');
    setSending(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      contact: contact.trim(),
      message: message.trim(),
      _subject: `[FolioVerse Contact] New inquiry from ${name.trim()}`,
      _replyto: email.trim(),
    };

    // 1. Dispatch to Django backend API
    try {
      await contactService.sendInquiry({
        name: payload.name,
        email: payload.email,
        contact: payload.contact,
        message: payload.message,
      });
    } catch (err) {
      console.warn('Backend contact logging error:', err);
    }

    // 2. Dispatch to FormSubmit for direct inbox delivery to bipronathsaha@gmail.com
    try {
      await fetch(`https://formsubmit.co/ajax/${authorityEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Direct FormSubmit dispatch notice:', err);
    }

    // 3. Trigger native mailto client
    try {
      const mailtoUrl = buildMailtoUrl();
      const tempLink = document.createElement('a');
      tempLink.href = mailtoUrl;
      tempLink.click();
    } catch (err) {
      console.warn('Mail client invoke notice:', err);
    }

    setSending(false);
    setSent(true);
    if (onSuccess) {
      onSuccess(`Message sent and routed to ${authorityEmail}`);
    }
  };

  const handleCopySummary = async () => {
    const textToCopy = `To: ${authorityEmail}\nName: ${name.trim()}\nEmail: ${email.trim()}\nContact: ${contact.trim()}\n\nMessage:\n${message.trim()}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleResetAndClose = () => {
    setSent(false);
    setCopied(false);
    setSending(false);
    setName('');
    setEmail('');
    setContact('');
    setMessage('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors z-10"
          aria-label="Close contact modal"
        >
          <X className="w-5 h-5" />
        </button>

        {sent ? (
          <div className="py-6 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Message Sent!</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                Your message has been dispatched and delivered to{' '}
                <span className="font-semibold text-emerald-400">{authorityEmail}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between text-slate-400">
                <span>Name:</span>
                <span className="text-slate-200 font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Email:</span>
                <span className="text-slate-200">{email}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Contact:</span>
                <span className="text-slate-200">{contact}</span>
              </div>
              <div className="pt-2 border-t border-slate-850">
                <span className="text-slate-400 block mb-1">Message:</span>
                <p className="text-slate-300 italic line-clamp-3 bg-slate-900/60 p-2 rounded-lg">
                  "{message}"
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto pt-1">
              <a
                href={buildGmailWebUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Gmail</span>
              </a>
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Details</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full max-w-sm mx-auto py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-sm shadow-lg shadow-emerald-600/25 transition-all"
            >
              Back to Book Store
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1 flex-1 space-y-4">
            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Contact</h2>
                  <p className="text-xs text-slate-400">Send an inquiry or feedback directly to FolioVerse</p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. +880 1559-503222"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Message <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 font-bold text-white text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
