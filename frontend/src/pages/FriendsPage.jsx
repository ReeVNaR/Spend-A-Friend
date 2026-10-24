import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import AddFriendModal from '../components/friends/AddFriendModal';
import Avatar from '../components/ui/Avatar';
import { formatCurrency } from '../utils/currency';
import { UserPlus, Search, ChevronRight, ArrowRight } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'RA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const FriendsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/friends');
      const list = res.data?.friends || res.data || [];
      setFriends(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter((item) => {
      const f = item.friend || item.user || item;
      return (
        f.name?.toLowerCase().includes(query) ||
        f.email?.toLowerCase().includes(query)
      );
    });
  }, [friends, searchQuery]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Heading Section */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Your <span className="text-blue-600 font-black">Friends</span> 🤝
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Track 1-on-1 expenses and settle up directly with friends.
        </p>
      </div>

      {/* 2. Add Friend Action Card */}
      <button
        type="button"
        onClick={() => setIsAddOpen(true)}
        className="w-full flex items-center justify-between p-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer text-left group"
      >
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-tight">
              Add New Friend
            </div>
            <div className="text-[11px] text-blue-100 font-medium truncate mt-0.5">
              Connect via registered email address
            </div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-white/80 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 3. Search Bar */}
      {friends.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search friends by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 focus:bg-white border border-slate-200/80 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
          />
        </div>
      )}

      {/* 4. Friend List (Clean Rounded Card Container) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Friends ({filteredFriends.length})
          </h3>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 font-medium border border-slate-200/80 shadow-2xs animate-pulse">
            Loading friends...
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
              🤝
            </div>
            <div className="text-sm font-bold text-slate-900">No friends added yet</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Add your friends by email to start splitting bills and tracking mutual balances.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Your First Friend</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-2 sm:p-2.5 border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] divide-y divide-slate-100">
            {filteredFriends.map((item) => {
              const friend = item.friend || item.user || item;
              const fId = friend._id || friend.id;
              const numBalance = Number(item.balance ?? friend.balance ?? 0);
              const isSettled = Math.abs(numBalance) < 0.01;
              const owesYou = numBalance > 0.01;
              const youOwe = numBalance < -0.01;

              return (
                <div
                  key={fId}
                  onClick={() => navigate(`/friends/${fId}`)}
                  className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50/60 rounded-2xl transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar & Name/Email */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <Avatar
                      name={friend.name}
                      src={friend.avatar}
                      size="md"
                      className="shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate tracking-tight">
                        {friend.name}
                      </div>
                      <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {friend.email}
                      </div>
                    </div>
                  </div>

                  {/* Right: Net Balance & Chevron */}
                  <div className="flex items-center space-x-2.5 shrink-0 ml-2">
                    <div className="text-right">
                      {isSettled ? (
                        <span className="text-xs font-bold text-slate-400">Settled up</span>
                      ) : owesYou ? (
                        <>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none">
                            owes you
                          </div>
                          <div className="text-sm font-extrabold text-emerald-600 mt-1 leading-none">
                            +{formatCurrency(numBalance, user?.defaultCurrency || 'INR')}
                          </div>
                        </>
                      ) : youOwe ? (
                        <>
                          <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider leading-none">
                            you owe
                          </div>
                          <div className="text-sm font-extrabold text-rose-600 mt-1 leading-none">
                            -{formatCurrency(Math.abs(numBalance), user?.defaultCurrency || 'INR')}
                          </div>
                        </>
                      ) : null}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => fetchFriends()}
      />
    </div>
  );
};

export default FriendsPage;
