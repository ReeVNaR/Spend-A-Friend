import React, { useState, useEffect, useMemo, useRef } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import {
  Calendar,
  QrCode,
  ExternalLink,
  ArrowRightLeft,
  Zap,
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
  const [showQrCode, setShowQrCode] = useState(false);
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
      setShowQrCode(false);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, preselectedUser, preselectedAmount, candidates]);

  // Generate UPI payment intent URI (only when you are paying and currency is INR)
  const upiIntentUrl = useMemo(() => {
    const numAmt = parseFloat(amount);
    const cleanUpi = recipientUpiId.trim();
    if (
      direction !== 'you_paid' ||
      !cleanUpi ||
      isNaN(numAmt) ||
      numAmt <= 0 ||
      currency !== 'INR'
    ) {
      return '';
    }
    const payeeName = selectedCandidate?.name || 'Friend';
    return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(
      payeeName
    )}&am=${numAmt.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
      'Spend-A-Friend Settlement'
    )}`;
  }, [recipientUpiId, amount, currency, selectedCandidate, direction]);

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
      <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
        {/* Payment Direction Switcher */}
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setDirection('you_paid')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
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
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
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

        {/* Instant UPI Payment Box (When You Paid, INR, and amount > 0) */}
        {direction === 'you_paid' && currency === 'INR' && (
          <div className="p-3.5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-blue-50/40 border border-emerald-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                  ₹
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Instant UPI Payment
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Zap className="w-2.5 h-2.5" />
                <span>GPay / PhonePe / Paytm</span>
              </span>
            </div>

            {/* Recipient UPI ID Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">
                  {selectedCandidate?.name || 'Recipient'}&apos;s UPI ID / VPA
                </span>
                {selectedCandidate?.upiId && (
                  <span className="text-emerald-600 font-bold text-[10px]">
                    Verified on file
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. rahul@okhdfcbank or 9876543210@paytm"
                value={recipientUpiId}
                onChange={(e) => setRecipientUpiId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              />
            </div>

            {/* Pay Button & QR Toggle */}
            {upiIntentUrl && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2">
                  <a
                    href={upiIntentUrl}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Pay ₹{parseFloat(amount || 0).toFixed(2)} via UPI App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
                    title="Toggle QR Code"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>

                {/* QR Code Container */}
                {showQrCode && (
                  <div className="p-4 rounded-2xl bg-white border border-emerald-100 text-center space-y-2 animate-in zoom-in-95 duration-150">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(
                        upiIntentUrl
                      )}`}
                      alt="UPI QR Code"
                      className="mx-auto rounded-xl border border-slate-100 shadow-sm"
                      width={180}
                      height={180}
                    />
                    <div className="text-[11px] text-slate-500 font-medium">
                      Scan with Google Pay, PhonePe, Paytm, or any UPI app
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
        <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-end space-x-2.5 z-10 shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)] mt-4">
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
