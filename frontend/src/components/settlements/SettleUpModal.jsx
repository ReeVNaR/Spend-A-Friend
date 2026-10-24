import React, { useState, useEffect, useMemo, useRef } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { currencies } from '../../utils/currency';
import { buildUpiDeepLink, getAppLaunchUrl } from '../../utils/upi';
import {
  Calendar,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Download,
} from 'lucide-react';

const SettleUpModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedUser = null,
  preselectedAmount = '',
  groupId = null,
  groupMembers = [],
  friends = [],
}) => {
  const { user } = useAuth();

  const [toUser, setToUser] = useState('');
  const [direction, setDirection] = useState('you_paid'); // 'you_paid' | 'they_paid'
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [recipientUpiId, setRecipientUpiId] = useState('');
  const [payMethod, setPayMethod] = useState('qr'); // 'qr' | 'apps'
  const [selectedAppPay, setSelectedAppPay] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const wasOpenRef = useRef(false);

  // Combine available members/friends (excluding current user)
  const candidates = useMemo(() => {
    const list = [];
    const seen = new Set();
    const currentId = String(user?._id || user?.id || '');

    const addCandidate = (cand) => {
      if (!cand) return;
      const u = cand.user || cand.friend || cand;
      const uid = String(u._id || u.id || '');
      if (uid && uid !== currentId && !seen.has(uid)) {
        seen.add(uid);
        list.push({
          _id: uid,
          name: u.name || 'User',
          email: u.email || '',
          upiId: u.upiId || cand.upiId || '',
        });
      }
    };

    if (preselectedUser) addCandidate(preselectedUser);
    if (Array.isArray(groupMembers)) groupMembers.forEach(addCandidate);
    if (Array.isArray(friends)) friends.forEach(addCandidate);

    return list;
  }, [preselectedUser, groupMembers, friends, user]);

  // Selected candidate object
  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => String(c._id) === String(toUser)) || null;
  }, [candidates, toUser]);

  // Synchronize state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (preselectedUser) {
        const pId = preselectedUser._id || preselectedUser.id || preselectedUser;
        setToUser(String(pId));
        setRecipientUpiId(preselectedUser.upiId || '');
      } else if (candidates.length > 0) {
        setToUser(String(candidates[0]._id));
        setRecipientUpiId(candidates[0].upiId || '');
      } else {
        setToUser('');
        setRecipientUpiId('');
      }

      const num = Number(preselectedAmount);
      const initialAmt = !isNaN(num) && num > 0 ? String(Math.abs(num)) : '';
      setAmount(initialAmt);
      setDirection('you_paid');
      setPayMethod('qr');
      setSelectedAppPay(null);
      setCopiedUpi(false);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, preselectedUser, preselectedAmount, candidates]);

  // Helper to build standardized UPI URLs for specific apps with NPCI & PSP compliance
  const getAppUpiUrl = (app, includeAmount = true) => {
    return buildUpiDeepLink({
      app,
      upiId: recipientUpiId,
      payeeName: selectedCandidate?.name,
      amount: parseFloat(amount) || 0,
      note: 'Spend-A-Friend Settlement',
      includeAmount,
    });
  };

  const defaultUpiUrl = getAppUpiUrl('default');

  // Generate offline QR Code data URL whenever recipient UPI or amount changes
  useEffect(() => {
    if (!recipientUpiId.trim() || !amount || Number(amount) <= 0) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(defaultUpiUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR generation error:', err));
  }, [recipientUpiId, amount, defaultUpiUrl]);

  const handleAppCardClick = (app, appName) => {
    if (!recipientUpiId.trim()) {
      toast.error("Please enter recipient's UPI ID first");
      return;
    }
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error('Please enter a valid payment amount first');
      return;
    }

    // Auto-copy recipient UPI ID into clipboard
    navigator.clipboard.writeText(recipientUpiId.trim());
    setCopiedUpi(true);
    setSelectedAppPay({ app, name: appName });
    toast.success(`Copied ${recipientUpiId.trim()}! Choose how to pay below.`);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleCopyUpi = () => {
    if (!recipientUpiId.trim()) return;
    navigator.clipboard.writeText(recipientUpiId.trim());
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) {
      toast.error('Please enter a valid amount and recipient UPI ID first');
      return;
    }
    const cleanName = (selectedCandidate?.name || 'Payment').replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `SpendAFriend-QR-${cleanName}-Rs${parseFloat(amount || 0)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR saved to gallery! Scan from Google Pay/PhonePe gallery to pay with zero limit.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!toUser) {
      toast.error('Please select a friend or group member');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }

    setLoading(true);
    try {
      const currentUid = user?._id || user?.id;
      const payload = {
        amount: numAmount,
        currency,
        notes: notes.trim(),
        date: new Date(date).toISOString(),
        from: direction === 'you_paid' ? currentUid : toUser,
        to: direction === 'you_paid' ? toUser : currentUid,
      };

      if (groupId) {
        payload.group = groupId;
      }

      const res = await api.post('/settlements', payload);
      toast.success('Settlement recorded successfully!');
      setAmount('');
      setNotes('');
      onSuccess?.(res.data?.settlement || res.data);
      onClose();
    } catch (err) {
      console.error('Failed to record settlement:', err);
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol =
    currencies.find((c) => c.code === currency)?.symbol || '₹';

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Settle Up" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200 w-full max-w-full overflow-x-hidden">
        {/* Payment Direction Switcher */}
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setDirection('you_paid')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              direction === 'you_paid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            You Paid
          </button>
          <button
            type="button"
            onClick={() => setDirection('they_paid')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              direction === 'they_paid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            They Paid You
          </button>
        </div>

        {/* Person Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            {direction === 'you_paid' ? 'Who did you pay?' : 'Who paid you?'}
          </label>
          <select
            value={toUser}
            onChange={(e) => {
              const newUid = e.target.value;
              setToUser(newUid);
              const found = candidates.find((c) => String(c._id) === String(newUid));
              if (found) setRecipientUpiId(found.upiId || '');
            }}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all cursor-pointer"
            required
          >
            {candidates.length === 0 ? (
              <option value="">No friends or group members available</option>
            ) : (
              candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.email ? `(${c.email})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Amount Paid <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Premium UPI Payment Options Card (Active when You Paid in INR) */}
        {direction === 'you_paid' && currency === 'INR' && (
          <div className="rounded-3xl p-4 bg-slate-900 text-white shadow-xl border border-slate-800 space-y-3.5 relative overflow-hidden">
            {/* Header: Title & Amount badge */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  ₹
                </div>
                <div>
                  <div className="text-xs font-black text-white tracking-tight">
                    Instant UPI Transfer
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Zero-limit payment via QR or App
                  </div>
                </div>
              </div>

              {amount && Number(amount) > 0 && (
                <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                  ₹{parseFloat(amount).toFixed(2)}
                </div>
              )}
            </div>

            {/* Recipient UPI ID Input / Badge */}
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {selectedCandidate?.name || 'Recipient'}&apos;s UPI ID / VPA
                </span>
                {recipientUpiId.trim() && (
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy VPA</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. rahul@okhdfcbank or 9876543210@paytm"
                  value={recipientUpiId}
                  onChange={(e) => setRecipientUpiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-xs font-mono font-bold text-white placeholder:font-sans placeholder:font-normal placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Payment Mode Selector: QR Code vs Apps */}
            <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => setPayMethod('qr')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  payMethod === 'qr'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Dynamic QR (Zero Limit)</span>
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('apps')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  payMethod === 'apps'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI Apps (GPay, PhonePe)</span>
              </button>
            </div>

            {/* MODE 1: Dynamic QR Code */}
            {payMethod === 'qr' && (
              <div className="p-3.5 rounded-2xl bg-white text-slate-900 text-center space-y-3 relative z-10 animate-in fade-in duration-150">
                {qrDataUrl ? (
                  <div className="space-y-2.5">
                    <img
                      src={qrDataUrl}
                      alt="UPI QR Code"
                      className="mx-auto rounded-xl border border-slate-200 shadow-sm"
                      width={170}
                      height={170}
                    />
                    <div className="flex items-center justify-center space-x-1.5 text-xs font-black text-slate-800">
                      <span>Pay ₹{parseFloat(amount || 0).toFixed(2)} to {selectedCandidate?.name || 'Friend'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto">
                      Scan with any UPI app on another phone, or <strong>Save to Gallery</strong> to pay on this phone without any bank limits.
                    </div>
                    <div className="flex items-center justify-center space-x-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-bold text-white flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save QR to Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy VPA</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500 font-medium">
                    Enter an amount and recipient UPI ID above to generate the payment QR.
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: 4 UPI Apps with Smart Action Panel */}
            {payMethod === 'apps' && (
              <div className="space-y-3 relative z-10 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2 w-full max-w-full overflow-hidden">
                  {/* 1. Google Pay */}
                  <button
                    type="button"
                    onClick={() => handleAppCardClick('gpay', 'Google Pay')}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-2 group cursor-pointer text-left min-w-0 ${
                      selectedAppPay?.app === 'gpay'
                        ? 'bg-blue-600/30 border-blue-400'
                        : 'bg-white/8 hover:bg-white/15 active:scale-95 border-white/10'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs p-1.5 group-hover:scale-105 transition-transform">
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.43 7.34 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.57 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">Google Pay</div>
                      <div className="text-[9px] text-slate-400 truncate">Tap to pay</div>
                    </div>
                  </button>

                  {/* 2. PhonePe */}
                  <button
                    type="button"
                    onClick={() => handleAppCardClick('phonepe', 'PhonePe')}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-2 group cursor-pointer text-left min-w-0 ${
                      selectedAppPay?.app === 'phonepe'
                        ? 'bg-purple-600/30 border-purple-400'
                        : 'bg-white/8 hover:bg-white/15 active:scale-95 border-white/10'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#5f259f] flex items-center justify-center shrink-0 shadow-xs text-white font-black text-sm group-hover:scale-105 transition-transform">
                      पे
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">PhonePe</div>
                      <div className="text-[9px] text-slate-400 truncate">Direct UPI</div>
                    </div>
                  </button>

                  {/* 3. Paytm */}
                  <button
                    type="button"
                    onClick={() => handleAppCardClick('paytm', 'Paytm')}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-2 group cursor-pointer text-left min-w-0 ${
                      selectedAppPay?.app === 'paytm'
                        ? 'bg-sky-600/30 border-sky-400'
                        : 'bg-white/8 hover:bg-white/15 active:scale-95 border-white/10'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#002970] to-[#00b9f5] flex items-center justify-center shrink-0 shadow-xs text-white font-black text-[9px] tracking-tight group-hover:scale-105 transition-transform">
                      Paytm
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">Paytm UPI</div>
                      <div className="text-[9px] text-slate-400 truncate">Fast Checkout</div>
                    </div>
                  </button>

                  {/* 4. Any UPI / BHIM */}
                  <button
                    type="button"
                    onClick={() => handleAppCardClick('default', 'UPI App')}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-2 group cursor-pointer text-left min-w-0 ${
                      selectedAppPay?.app === 'default'
                        ? 'bg-emerald-600/30 border-emerald-400'
                        : 'bg-white/8 hover:bg-white/15 active:scale-95 border-white/10'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs p-1.5 group-hover:scale-105 transition-transform">
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#097939" d="M14.5 4l-7 16h3.5l7-16z" />
                        <path fill="#f47920" d="M9.5 4l-7 16h3.5l7-16z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">Any UPI App</div>
                      <div className="text-[9px] text-slate-400 truncate">BHIM, CRED, Navi</div>
                    </div>
                  </button>
                </div>

                {/* Selected App Action Drawer */}
                {selectedAppPay && (
                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 space-y-3 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-white">
                          Pay ₹{parseFloat(amount || 0).toFixed(2)} via {selectedAppPay.name}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>VPA Copied</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAppPay(null)}
                        className="p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Option 1: Native App Launch (Zero Bank Limits) */}
                      <a
                        href={getAppLaunchUrl(selectedAppPay.app)}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer text-center"
                      >
                        <Zap className="w-4 h-4 text-emerald-200 shrink-0" />
                        <span>Open {selectedAppPay.name} &amp; Paste (No Limits)</span>
                      </a>

                      {/* Option 2: Direct UPI Link */}
                      <a
                        href={getAppUpiUrl(selectedAppPay.app)}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center justify-center space-x-2 border border-white/15 transition-all cursor-pointer text-center"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Try Direct Deep Link</span>
                      </a>
                    </div>

                    <div className="text-[10px] text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Why does Direct Deep Link say &quot;Limit Reached&quot;?</span>
                      </div>
                      <p>
                        NPCI and Indian banks intentionally block web links to personal accounts (setting browser limit to ₹0).
                        Tapping <strong>Open {selectedAppPay.name} &amp; Paste</strong> lets you paste {recipientUpiId} in the search bar to pay with your bank&apos;s full ₹1,00,000 daily limit!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Date of Payment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Date of Payment
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
          />
        </div>

        {/* Payment Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Payment Method / Remarks (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Paid via Google Pay, UPI, Cash"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
          />
        </div>

        {/* Submit Actions - Sticky Bottom Toolbar */}
        <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-end space-x-2.5 z-10 shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)] mt-4 box-border w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] max-w-[calc(100%+2rem)] sm:max-w-[calc(100%+3rem)]">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            loading={loading}
          >
            Record Settlement
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

export default SettleUpModal;
