import React, { useState, useEffect, useMemo } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import SplitSelector from './SplitSelector';
import UpiQrScanner from './UpiQrScanner';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import { categoryIcons, categoryLabels } from '../../utils/helpers';
import {
  parseUpiUri,
  buildUpiDeepLink,
  detectCategoryFromPayee,
} from '../../utils/upi';
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  QrCode,
  Camera,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  X,
  Smartphone,
  Zap,
} from 'lucide-react';

const AddExpenseModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedGroup = null,
  preselectedFriend = null,
  groups = [],
  friends = [],
  groupMembers = null,
  expenseToEdit = null,
  initialOpenScanner = false,
}) => {
  const { user } = useAuth();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [category, setCategory] = useState('food');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  // QR & Instant UPI payment state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUpi, setScannedUpi] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [redirectedApp, setRedirectedApp] = useState('');

  // Handle scanned UPI QR details
  const handleScanSuccess = (parsed) => {
    setScannedUpi(parsed);
    setRedirectedApp('');
    if (parsed.payeeName) {
      setDescription(parsed.payeeName);
    }
    if (parsed.amount && parsed.amount > 0) {
      setAmount(String(parsed.amount));
    }
    if (parsed.currency) {
      setCurrency(parsed.currency);
    }
    const autoCat = detectCategoryFromPayee(parsed.payeeName, parsed.note);
    setCategory(autoCat);

    if (parsed.note && parsed.note !== 'Spend-A-Friend Expense') {
      setNotes((prev) => (prev ? `${prev} • ${parsed.note}` : parsed.note));
    }
  };

  const handleCopyUpi = () => {
    if (!scannedUpi?.upiId) return;
    navigator.clipboard.writeText(scannedUpi.upiId.trim());
    setCopiedUpi(true);
    toast.success('Merchant UPI ID copied!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleAppLaunch = (appName) => {
    setRedirectedApp(appName);
    toast.success(`Opening ${appName}... Complete payment and split below!`);
  };

  const handleCopyAndLaunchApp = (app, appName) => {
    if (!scannedUpi?.upiId) return;
    navigator.clipboard.writeText(scannedUpi.upiId.trim());
    setCopiedUpi(true);
    toast.success(`Copied! Search & paste in ${appName} to pay with zero limit.`);
    setTimeout(() => setCopiedUpi(false), 2500);

    const url = buildUpiDeepLink({
      app,
      upiId: scannedUpi.upiId,
      payeeName: scannedUpi.payeeName,
      amount: parseFloat(amount) || 0,
      note: description || 'Spend-A-Friend Expense',
      includeAmount: false,
    });
    window.location.href = url;
  };

  // Sync state with expenseToEdit or preselected values
  useEffect(() => {
    if (!isOpen) return;

    if (initialOpenScanner && !expenseToEdit) {
      setShowScanner(true);
    }

    if (expenseToEdit) {
      setDescription(expenseToEdit.description || '');
      setAmount(expenseToEdit.amount ? String(expenseToEdit.amount) : '');
      setCurrency(expenseToEdit.currency || user?.defaultCurrency || 'INR');
      setCategory(expenseToEdit.category || 'food');
      setSelectedGroupId(
        expenseToEdit.group?._id || expenseToEdit.group?.id || expenseToEdit.group || ''
      );
      setPaidBy(
        expenseToEdit.paidBy?._id || expenseToEdit.paidBy?.id || expenseToEdit.paidBy || user?._id || ''
      );
      if (expenseToEdit.date) {
        setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
      } else if (expenseToEdit.createdAt) {
        setDate(new Date(expenseToEdit.createdAt).toISOString().split('T')[0]);
      }
      setNotes(expenseToEdit.notes || '');
      setSplitType(expenseToEdit.splitType || 'equal');
      setScannedUpi(null);
      setRedirectedApp('');
      if (Array.isArray(expenseToEdit.splits)) {
        setSplits(
          expenseToEdit.splits.map((s) => ({
            user: s.user?._id || s.user?.id || s.user,
            amount: s.amount,
            percentage: s.percentage,
          }))
        );
      }
    } else {
      // New expense defaults
      setDescription('');
      setAmount('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSplitType('equal');
      setScannedUpi(null);
      setRedirectedApp('');
      setSelectedGroupId(preselectedGroup?._id || preselectedGroup?.id || '');
      setSelectedFriendId(preselectedFriend?._id || preselectedFriend?.id || '');
      setCurrency(
        preselectedGroup?.currency || user?.defaultCurrency || 'INR'
      );
      setPaidBy(user?._id || '');
    }
  }, [isOpen, expenseToEdit, preselectedGroup, preselectedFriend, user]);

  // Determine active group object
  const activeGroup = useMemo(() => {
    if (preselectedGroup) return preselectedGroup;
    if (selectedGroupId) {
      return groups.find((g) => (g._id || g.id) === selectedGroupId);
    }
    return null;
  }, [preselectedGroup, selectedGroupId, groups]);

  // Determine chosen friend
  const chosenFriend = useMemo(() => {
    if (preselectedFriend) return preselectedFriend;
    if (selectedFriendId) {
      return friends
        .map((f) => f.friend || f.user || f)
        .find((f) => String(f._id || f.id) === String(selectedFriendId));
    }
    return null;
  }, [preselectedFriend, selectedFriendId, friends]);

  // Determine available members for splitting
  const availableMembers = useMemo(() => {
    if (groupMembers && groupMembers.length > 0) {
      return groupMembers;
    }
    if (activeGroup && activeGroup.members) {
      return activeGroup.members.map((m) => (m.user ? m.user : m));
    }
    if (chosenFriend) {
      return [
        { _id: user?._id, name: `${user?.name || 'You'} (You)` },
        {
          _id: chosenFriend._id || chosenFriend.id,
          name: chosenFriend.name,
        },
      ];
    }
    return [{ _id: user?._id, name: `${user?.name || 'You'} (You)` }];
  }, [groupMembers, activeGroup, chosenFriend, user]);

  // Initialize splits for new expenses (only if not editing or splits are empty)
  useEffect(() => {
    if (!expenseToEdit && availableMembers.length > 0) {
      const numAmount = parseFloat(amount) || 0;
      const count = availableMembers.length;
      const share = count > 0 ? Math.round((numAmount / count) * 100) / 100 : 0;
      const perc = count > 0 ? Math.round(100 / count) : 0;

      setSplits(
        availableMembers.map((m) => ({
          user: m._id || m.id,
          amount: share,
          percentage: perc,
        }))
      );
    }
  }, [availableMembers, amount, expenseToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter an expense description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (splits.length === 0) {
      toast.error('Please select at least one person to split with');
      return;
    }

    // Validation per split type
    let finalSplits = [];
    if (splitType === 'equal') {
      const count = splits.length;
      const share = Math.round((numAmount / count) * 100) / 100;
      let runningSum = 0;
      finalSplits = splits.map((s, idx) => {
        const amt = idx === count - 1 ? Math.round((numAmount - runningSum) * 100) / 100 : share;
        runningSum += amt;
        return {
          user: s.user?._id || s.user,
          amount: amt,
        };
      });
    } else if (splitType === 'exact') {
      const sum = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      if (Math.abs(sum - numAmount) > 0.05) {
        toast.error(`Splits sum (${sum.toFixed(2)}) must equal total amount (${numAmount.toFixed(2)})`);
        return;
      }
      finalSplits = splits.map((s) => ({
        user: s.user?._id || s.user,
        amount: Number(s.amount) || 0,
      }));
    } else if (splitType === 'percentage') {
      const totalPerc = splits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
      if (Math.abs(totalPerc - 100) > 0.5) {
        toast.error(`Total percentage must equal 100% (currently ${totalPerc}%)`);
        return;
      }
      finalSplits = splits.map((s) => ({
        user: s.user?._id || s.user,
        amount: Math.round(((numAmount * Number(s.percentage || 0)) / 100) * 100) / 100,
      }));
    }

    const payload = {
      description: description.trim(),
      amount: numAmount,
      currency,
      category,
      paidBy,
      splitType,
      splits: finalSplits,
      date: new Date(date).toISOString(),
      notes: notes.trim(),
    };

    if (selectedGroupId) {
      payload.group = selectedGroupId;
    }

    setLoading(true);
    try {
      if (expenseToEdit) {
        const res = await api.put(
          `/expenses/${expenseToEdit._id || expenseToEdit.id}`,
          payload
        );
        toast.success('Expense updated successfully!');
        onSuccess?.(res.data?.expense || res.data);
      } else {
        const res = await api.post('/expenses', payload);
        toast.success('Expense added successfully!');
        onSuccess?.(res.data?.expense || res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save expense:', err);
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 w-full max-w-full overflow-x-hidden">
        {/* Quick Scan UPI QR Banner (For new expenses) */}
        {!expenseToEdit && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-emerald-600/10 border border-blue-200/60 shadow-2xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5 truncate">
                  <span>Scan Merchant UPI QR</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                    Auto-Fill
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  Scan bill to auto-fill payee, amount & launch GPay / PhonePe
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="shrink-0 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer ml-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>
          </div>
        )}

        {/* Luxury Merchant UPI Payment & Instant Checkout Card */}
        {scannedUpi && (
          <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-xl border border-slate-800/80 space-y-3 relative overflow-hidden animate-in zoom-in-95 duration-200 w-full max-w-full">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header: Payee Name + Live Amount + Dismiss */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  ₹
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate flex items-center space-x-1">
                    <span>{scannedUpi.payeeName || 'Merchant'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium truncate">
                    Tap your preferred payment app below
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {amount && Number(amount) > 0 && (
                  <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                    ₹{parseFloat(amount).toFixed(2)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setScannedUpi(null);
                    setRedirectedApp('');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Remove UPI details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recipient UPI ID with 1-tap Copy */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs relative z-10">
              <div className="font-mono text-[11px] text-slate-300 truncate mr-2">
                {scannedUpi.upiId}
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
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
            </div>

            {/* 4 Premium UPI App Cards */}
            <div className="grid grid-cols-2 gap-2 relative z-10 pt-0.5 w-full max-w-full overflow-hidden">
              {/* 1. Google Pay */}
              <a
                href={buildUpiDeepLink({
                  app: 'gpay',
                  upiId: scannedUpi.upiId,
                  payeeName: scannedUpi.payeeName,
                  amount: parseFloat(amount) || 0,
                  note: description || 'Spend-A-Friend Expense',
                })}
                onClick={() => handleAppLaunch('Google Pay')}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/8 hover:bg-white/15 active:scale-95 border border-white/10 transition-all flex items-center space-x-2 group cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs p-1.5 group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.43 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.57 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    Google Pay
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    Instant Pay
                  </div>
                </div>
              </a>

              {/* 2. PhonePe */}
              <a
                href={buildUpiDeepLink({
                  app: 'phonepe',
                  upiId: scannedUpi.upiId,
                  payeeName: scannedUpi.payeeName,
                  amount: parseFloat(amount) || 0,
                  note: description || 'Spend-A-Friend Expense',
                })}
                onClick={() => handleAppLaunch('PhonePe')}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/8 hover:bg-white/15 active:scale-95 border border-white/10 transition-all flex items-center space-x-2 group cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#5f259f] flex items-center justify-center shrink-0 shadow-xs text-white font-black text-xs sm:text-sm group-hover:scale-105 transition-transform">
                  पे
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    PhonePe
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    Direct UPI
                  </div>
                </div>
              </a>

              {/* 3. Paytm */}
              <a
                href={buildUpiDeepLink({
                  app: 'paytm',
                  upiId: scannedUpi.upiId,
                  payeeName: scannedUpi.payeeName,
                  amount: parseFloat(amount) || 0,
                  note: description || 'Spend-A-Friend Expense',
                })}
                onClick={() => handleAppLaunch('Paytm')}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/8 hover:bg-white/15 active:scale-95 border border-white/10 transition-all flex items-center space-x-2 group cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-[#002970] to-[#00b9f5] flex items-center justify-center shrink-0 shadow-xs text-white font-black text-[8px] sm:text-[9px] tracking-tight group-hover:scale-105 transition-transform">
                  Paytm
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    Paytm UPI
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    Fast Checkout
                  </div>
                </div>
              </a>

              {/* 4. Any UPI App */}
              <a
                href={buildUpiDeepLink({
                  app: 'default',
                  upiId: scannedUpi.upiId,
                  payeeName: scannedUpi.payeeName,
                  amount: parseFloat(amount) || 0,
                  note: description || 'Spend-A-Friend Expense',
                })}
                onClick={() => handleAppLaunch('UPI App')}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/8 hover:bg-white/15 active:scale-95 border border-white/10 transition-all flex items-center space-x-2 group cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs p-1.5 group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#097939" d="M14.5 4l-7 16h3.5l7-16z" />
                    <path fill="#f47920" d="M9.5 4l-7 16h3.5l7-16z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    Any UPI App
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    BHIM, CRED, Navi
                  </div>
                </div>
              </a>
            </div>

            {/* Limit Exceeded Helper Box */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-white relative z-10 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Seeing &quot;Payment Limit Exceeded&quot;?</span>
                </div>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md">
                  Bank Rule
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Indian banks cap browser-initiated transfers for personal accounts. Use <strong>Copy &amp; Open App</strong> to pay directly inside your app with <strong>zero limit</strong>:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleCopyAndLaunchApp('gpay', 'Google Pay')}
                  className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[10px] font-bold text-white flex items-center justify-center space-x-1 border border-white/15 transition-all cursor-pointer truncate"
                >
                  <Copy className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Copy &amp; Open GPay</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyAndLaunchApp('phonepe', 'PhonePe')}
                  className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[10px] font-bold text-white flex items-center justify-center space-x-1 border border-white/15 transition-all cursor-pointer truncate"
                >
                  <Copy className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">Copy &amp; Open PhonePe</span>
                </button>
              </div>
            </div>

            {/* Helper reassurance */}
            {redirectedApp ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center space-x-2 relative z-10">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Payment opened in <strong>{redirectedApp}</strong>! When finished, choose who splits this below and save.
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 text-center relative z-10 pt-0.5">
                ⚡ Tap any app to pay merchant, then select members to split below.
              </div>
            )}
          </div>
        )}

        {/* Description & Amount row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <GlassInput
              label="Description"
              icon={FileText}
              placeholder="e.g. Dinner, Taxi, Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <GlassInput
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              icon={DollarSign}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Currency & Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Currency */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-white text-slate-800">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              {Object.keys(categoryIcons).map((cat) => (
                <option key={cat} value={cat} className="bg-white text-slate-800">
                  {categoryIcons[cat]} {categoryLabels[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <GlassInput
              label="Date"
              type="date"
              icon={Calendar}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Group selector if not preselected and not editing existing group expense */}
        {!preselectedGroup && !expenseToEdit && groups.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Group (Optional)
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                if (e.target.value) setSelectedFriendId('');
              }}
              className="glass-input w-full text-sm cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800">
                Individual / Non-group Expense
              </option>
              {groups.map((g) => (
                <option
                  key={g._id || g.id}
                  value={g._id || g.id}
                  className="bg-white text-slate-800"
                >
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Friend selector if not preselected and no group selected */}
        {!selectedGroupId && !preselectedFriend && !expenseToEdit && friends.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Split with Friend (Optional)
            </label>
            <select
              value={selectedFriendId}
              onChange={(e) => setSelectedFriendId(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800">
                Choose a friend to split with...
              </option>
              {friends.map((f) => {
                const friendObj = f.friend || f.user || f;
                const fId = friendObj._id || friendObj.id;
                return (
                  <option key={fId} value={fId} className="bg-white text-slate-800">
                    {friendObj.name} ({friendObj.email})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Paid By Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Paid By
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="glass-input w-full text-sm cursor-pointer"
            required
          >
            {availableMembers.map((m) => {
              const mId = m._id || m.id;
              const isMe = String(mId) === String(user?._id);
              return (
                <option key={mId} value={mId} className="bg-white text-slate-800">
                  {isMe ? `You (${user?.name})` : m.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Split Section */}
        <div className="pt-2 border-t border-slate-200/80">
          <label className="text-sm font-bold text-slate-900 block mb-2">
            Split Breakdown
          </label>
          <SplitSelector
            type={splitType}
            onChange={setSplitType}
            members={availableMembers}
            splits={splits}
            onSplitsChange={setSplits}
            totalAmount={parseFloat(amount) || 0}
            currency={currency}
          />
        </div>

        {/* Optional Notes */}
        <div>
          <GlassInput
            as="textarea"
            rows={2}
            label="Notes (Optional)"
            placeholder="Add any extra details or receipt remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Modal Actions - Sticky Bottom Toolbar */}
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
            {expenseToEdit ? 'Save Changes' : 'Save Expense'}
          </GlassButton>
        </div>
      </form>

      {/* Live UPI QR & Bill Scanner Dialog */}
      <UpiQrScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </GlassModal>
  );
};

export default AddExpenseModal;
