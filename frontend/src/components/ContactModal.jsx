import React, { useState } from 'react';
import { X, Mail, Send, User, MessageSquare, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';

export const ContactModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const authorityEmail = 'bipronathsaha@gmail.com';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please write a message.');
      return;
    }

    setErrorMsg('');

    // Construct mailto link addressed to bipronathsaha@gmail.com
    const emailSubject = encodeURIComponent(
      subject.trim() ? `[FolioVerse Contact] ${subject.trim()}` : `[FolioVerse Contact] Message from ${name.trim()}`
    );
    const emailBody = encodeURIComponent(
      `Hello Authority,\n\nSender Name: ${name.trim()}\nSender Email: ${email.trim()}\n\nMessage:\n${message.trim()}\n\n---\nSent via FolioVerse Digital Book Shop`
    );

    const mailtoUrl = `mailto:${authorityEmail}?subject=${emailSubject}&body=${emailBody}`;

    // Trigger redirection to email client
    window.location.href = mailtoUrl;

    setSent(true);
    if (onSuccess) {
      onSuccess(`Message prepared and directed to ${authorityEmail}`);
    }
  };

  const handleResetAndClose = () => {
    setSent(false);
    setName('');
    setEmail('');
    setSubject('');
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
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Message Dispatched!</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                Your email client has been opened with your inquiry addressed directly to{' '}
                <span className="font-semibold text-emerald-400">{authorityEmail}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between text-slate-400">
                <span>Authority:</span>
                <span className="font-semibold text-white">Bipronath Saha</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Email:</span>
                <span className="font-mono text-emerald-400">{authorityEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sender:</span>
                <span className="text-slate-200">{name} ({email})</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-sm shadow-lg shadow-emerald-600/25 transition-all"
            >
              Back to Book Store
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1 flex-1 space-y-5">
            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Contact Authority</h2>
                  <p className="text-xs text-slate-400">Send an inquiry or feedback directly to the bookstore owner</p>
                </div>
              </div>

              {/* Direct Authority Badge */}
              <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Direct Recipient:
                </span>
                <a
                  href={`mailto:${authorityEmail}`}
                  className="font-mono font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {authorityEmail}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name <span className="text-rose-400">*</span>
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
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Email Address <span className="text-rose-400">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inquiring about bulk books / Author listing"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Message <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here... Upon clicking send, it will automatically route to bipronathsaha@gmail.com"
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 font-bold text-white text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to bipronathsaha@gmail.com</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
