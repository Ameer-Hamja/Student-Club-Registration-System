import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDateTime, formatCurrency, getSeatFillColor, getDepartmentIcon } from '../utils/helpers';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleRegisterClick = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setRegistered(true);
    setShowPayment(false);
    setEvent(prev => prev ? { ...prev, availableSeats: prev.availableSeats - 1 } : prev);
  };

  if (loading) return (
    <div className="animated-bg min-h-screen pt-24">
      <LoadingSpinner message="Loading event details..." />
    </div>
  );

  if (!event) return null;

  const fillPct = event.seatFillPercentage || 0;
  const isFull = event.availableSeats === 0;

  return (
    <div className="animated-bg min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/events" className="hover:text-white transition-colors">Events</Link>
          <span>/</span>
          <span className="text-white/70 truncate">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image / Header */}
            <div className="glass-card overflow-hidden">
              <div className="relative h-56 sm:h-72">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-8xl"
                    style={{
                      background: event.department?.colorTag
                        ? `linear-gradient(135deg, ${event.department.colorTag}22, ${event.department.colorTag}55)`
                        : 'linear-gradient(135deg, #6366f122, #8b5cf655)',
                    }}
                  >
                    {getDepartmentIcon(event.department?.name)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
                    style={{ backgroundColor: `${event.department?.colorTag || '#6366f1'}99` }}
                  >
                    {event.department?.name}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-black text-white mb-3">{event.title}</h1>
                <p className="text-white/70 leading-relaxed">{event.description}</p>

                {/* Tags */}
                {event.tags && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {event.tags.split(',').map(tag => (
                      <span key={tag} className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-xs">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Details */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon="📅" label="Date & Time" value={formatDateTime(event.date)} />
                <DetailItem icon="📍" label="Venue" value={event.venue || 'TBA'} />
                <DetailItem icon="🏛️" label="Department" value={event.department?.name || 'General'} />
                <DetailItem icon="🎫" label="Total Seats" value={`${event.maxSeats} seats`} />
              </div>
            </div>
          </div>

          {/* Sidebar - Registration Card */}
          <div className="space-y-4">
            <div className="glass-card p-6 sticky top-24">
              <div className="text-3xl font-black gradient-text mb-1">
                {Number(event.price) === 0 ? 'Free' : formatCurrency(event.price)}
              </div>
              <p className="text-white/40 text-sm mb-5">per registration</p>

              {/* Seat Availability */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Seats Available</span>
                  <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isFull ? 'Full' : `${event.availableSeats}/${event.maxSeats}`}
                  </span>
                </div>
                <div className="seat-bar">
                  <div
                    className={`seat-bar-fill ${getSeatFillColor(fillPct)}`}
                    style={{ width: `${Math.min(fillPct, 100)}%` }}
                  />
                </div>
                <p className="text-white/40 text-xs mt-1">
                  {Math.round(fillPct)}% filled
                </p>
              </div>

              {/* Register Button */}
              {registered ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-center">
                    <p className="text-emerald-300 font-semibold">✅ You're registered!</p>
                  </div>
                  <Link to="/dashboard" className="btn-secondary w-full text-center block">
                    View My Events
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleRegisterClick}
                  disabled={isFull}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200
                    ${isFull
                      ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                      : 'btn-primary'
                    }`}
                >
                  {isFull ? '🔴 Event Full' : isAuthenticated() ? '🎟️ Register Now' : '🔐 Login to Register'}
                </button>
              )}

              {!isAuthenticated() && !isFull && (
                <p className="text-white/40 text-xs text-center mt-3">
                  <Link to="/login" className="text-indigo-400 hover:underline">Login</Link> or{' '}
                  <Link to="/register" className="text-indigo-400 hover:underline">Sign up</Link> to register
                </p>
              )}

              {/* Info */}
              <div className="mt-5 pt-5 border-t border-white/10 space-y-2">
                <p className="text-white/40 text-xs flex items-center gap-2">
                  <span>🔒</span> Secure payment simulation
                </p>
                <p className="text-white/40 text-xs flex items-center gap-2">
                  <span>📧</span> Confirmation email on success
                </p>
                <p className="text-white/40 text-xs flex items-center gap-2">
                  <span>⚡</span> Instant seat confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          event={event}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-xl mt-0.5">{icon}</span>
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white font-medium text-sm">{value}</p>
    </div>
  </div>
);

export default EventDetailPage;
