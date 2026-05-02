import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDateTime, formatCurrency, getPaymentBadgeClass } from '../utils/helpers';

const DashboardPage = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api.get('/users/me/events')
      .then(res => setRegistrations(res.data))
      .catch(err => console.error('Failed to load registrations:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL'
    ? registrations
    : registrations.filter(r => r.paymentStatus === filter);

  const stats = {
    total: registrations.length,
    paid: registrations.filter(r => r.paymentStatus === 'PAID').length,
    failed: registrations.filter(r => r.paymentStatus === 'FAILED').length,
    totalSpent: registrations
      .filter(r => r.paymentStatus === 'PAID')
      .reduce((sum, r) => sum + Number(r.eventPrice || 0), 0),
  };

  return (
    <div className="animated-bg min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">
              My Dashboard
            </h1>
            <p className="text-white/50 mt-1">
              Welcome back, <span className="text-indigo-300">{user?.name}</span>
            </p>
          </div>
          <Link to="/events" className="btn-primary">
            + Register Event
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🎟️" label="Total Registered" value={stats.total} color="indigo" />
          <StatCard icon="✅" label="Confirmed" value={stats.paid} color="emerald" />
          <StatCard icon="❌" label="Failed" value={stats.failed} color="red" />
          <StatCard icon="💰" label="Total Spent" value={formatCurrency(stats.totalSpent)} color="purple" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['ALL', 'PAID', 'FAILED', 'PENDING'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${filter === status
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                  : 'glass text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              {status !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({registrations.filter(r => r.paymentStatus === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Registrations List */}
        {loading ? (
          <LoadingSpinner message="Loading your events..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'ALL' ? 'No registrations yet' : `No ${filter.toLowerCase()} registrations`}
            </h3>
            <p className="text-white/50 mb-6">
              {filter === 'ALL' ? 'Explore events and register to get started!' : 'Try a different filter'}
            </p>
            {filter === 'ALL' && (
              <Link to="/events" className="btn-primary">Browse Events</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(reg => (
              <RegistrationCard key={reg.id} registration={reg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-300',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-300',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300',
  };
  return (
    <div className={`glass-card p-4 bg-gradient-to-br ${colorMap[color]} border`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-white/50 text-xs mt-1">{label}</div>
    </div>
  );
};

const RegistrationCard = ({ registration: reg }) => (
  <div className="glass-card p-5 hover:bg-white/15 transition-all duration-200">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        {/* Color Dot */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            backgroundColor: `${reg.departmentColor || '#6366f1'}22`,
            border: `1px solid ${reg.departmentColor || '#6366f1'}44`,
          }}
        >
          🎓
        </div>

        <div>
          <h3 className="font-bold text-white text-lg">{reg.eventTitle}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {reg.departmentName && (
              <span className="text-white/50 text-xs">{reg.departmentName}</span>
            )}
            {reg.eventDate && (
              <span className="text-white/50 text-xs">📅 {formatDateTime(reg.eventDate)}</span>
            )}
            {reg.venue && (
              <span className="text-white/50 text-xs">📍 {reg.venue}</span>
            )}
          </div>
          {reg.transactionId && (
            <p className="text-white/30 text-xs mt-1 font-mono">
              TXN: {reg.transactionId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <div className="text-white font-bold">{formatCurrency(reg.eventPrice)}</div>
          <span className={getPaymentBadgeClass(reg.paymentStatus)}>
            {reg.paymentStatus}
          </span>
        </div>
        <Link
          to={`/events/${reg.eventId}`}
          className="btn-secondary text-sm py-1.5 px-3"
        >
          View →
        </Link>
      </div>
    </div>
  </div>
);

export default DashboardPage;
