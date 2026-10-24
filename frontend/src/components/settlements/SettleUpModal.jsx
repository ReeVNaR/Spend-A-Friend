import React, { useState, useEffect, useMemo } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import {
  DollarSign,
  Calendar,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
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
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [recipientUpiId, setRecipientUpiId] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Combine available recipients (excluding current user)
  const candidates = useMemo(() => {
    const list = [];
    const seen = new Set();
    const currentId = user?._id || user?.id;

    const addCandidate = (cand) => {
      if (!cand) return;
      const u = cand.user || cand.friend || cand;
      const uid = u._id || u.id;
      if (uid && String(uid) !== String(currentId) && !seen.has(String(uid))) {
        seen.add(String(uid));
        list.push({
          _id: uid,
          name: u.name || 'User',
          email: u.email || '',
          upiId: u.upiId || cand.upiId || '',
        });
      }
    };

    if (preselectedUser) addCandidate(preselectedUser);
    groupMembers.forEach(addCandidate);
    friends.forEach(addCandidate);

    return list;
  }, [preselectedUser, groupMembers, friends, user]);

  // Selected candidate object
  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => String(c._id) === String(toUser)) || null;
  }, [candidates, toUser]);

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preselectedUser) {
        const pId = preselectedUser._id || preselectedUser.id || preselectedUser;
        setToUser(pId);
        setRecipientUpiId(preselectedUser.upiId || '');
      } else if (candidates.length > 0) {
        setToUser(candidates[0]._id || candidates[0].id);
        setRecipientUpiId(candidates[0].upiId || '');
      }

      if (preselectedAmount) {
        setAmount(String(Math.abs(Number(preselectedAmount))));
      } else {
        setAmount('');
      }
      setShowQrCode(false);
    }
  }, [isOpen, preselectedUser, preselectedAmount, candidates]);

  // When recipient changes, update UPI ID if available
  useEffect(() => {
    if (selectedCandidate?.upiId) {
      setRecipientUpiId(selectedCandidate.upiId);
    }
  }, [selectedCandidate]);

  // Generate UPI payment intent URI
  const upiIntentUrl = useMemo(() => {
    const numAmt = parseFloat(amount);
    const cleanUpi = recipientUpiId.trim();
    if (!cleanUpi || isNaN(numAmt) || numAmt <= 0 || currency !== 'INR') {
      return '';
    }
    const payeeName = selectedCandidate?.name || 'Friend';
    return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(
      payeeName
    )}&am=${numAmt.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
      'Spend-A-Friend Settlement'
    )}`;
  }, [recipientUpiId, amount, currency, selectedCandidate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!toUser) {
      toast.error('Please select the recipient to settle up with');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        to: toUser,
        amount: numAmount,
        currency,
        notes: notes.trim(),
        date: new Date(date).toISOString(),
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

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Settle Up" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
        {/* Recipient Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Who are you paying?
          </label>
          <select
            value={toUser}
            onChange={(e) => {
              setToUser(e.target.value);
              const found = candidates.find((c) => String(c._id) === String(e.target.value));
              if (found) setRecipientUpiId(found.upiId || '');
            }}
            className="w-full pl-3 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
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
          <GlassInput
            label="Amount Paid"
            type="number"
            step="0.01"
            min="0.01"
            icon={DollarSign}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full pl-3 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Instant UPI Payment Box (Available for INR) */}
        {currency === 'INR' && (
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
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 transition-all shadow-2xs"
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

        {/* Date */}
        <GlassInput
          label="Date of Payment"
          type="date"
          icon={Calendar}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Notes */}
        <GlassInput
          as="textarea"
          rows={2}
          label="Payment Method / Remarks (Optional)"
          placeholder="e.g. Paid via Google Pay, UPI, Cash"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

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
