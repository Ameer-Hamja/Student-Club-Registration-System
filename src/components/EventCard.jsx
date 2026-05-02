import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket } from 'lucide-react';
import { formatDate, formatTime, formatCurrency, getSeatFillColor, getDepartmentIcon } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EVENT_TYPE_LABELS = {
  HACKATHON:           '🏆 Hackathon',
  WORKSHOP:            '🔧 Workshop',
  TECHNICAL_SYMPOSIUM: '🎤 Symposium',
  GUEST_LECTURE:       '🎓 Guest Lecture',
  FDP:                 '📚 FDP',
};

/**
 * EventCard — displays event info and a "Purchase Ticket" button.
 *
 * FIX: "Purchase Ticket" button calls POST /api/events/{id}/purchase directly
 *   (no intermediate PaymentModal for the quick-purchase flow).
 *   On success:
 *     • availableSeats is decremented locally — UI updates immediately without
 *       waiting for a parent refetch.
 *     • onBookingResult(true, title) is called so the parent can show a toast
 *       and schedule a background refresh.
 *   On failure:
 *     • Error message shown inline on the card.
 *     • onBookingResult(false, title) notifies the parent.
 *
 * Props:
 *   event           — EventDTO from /api/events
 *   onBookingResult — (success: boolean, eventTitle: string) => void
 */
const EventCard = ({ event: initialEvent, onBookingResult }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // FIX: Keep a local copy of the event so we can update availableSeats
  // immediately after a successful purchase without waiting for a parent refetch.
  const [event, setEvent]       = useState(initialEvent);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchased, setPurchased]   = useState(false);

  const fillPct = event.maxSeats > 0
    ? ((event.maxSeats - event.availableSeats) / event.maxSeats) * 100
    : 0;
  const isFull = event.availableSeats <= 0;

  // ── Purchase handler ────────────────────────────────────────────────────────
  const handlePurchase = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/events/${event.id}` } });
      return;
    }

    setPurchasing(true);
    setPurchaseError('');

    try {
      // FIX: calls the dedicated /purchase endpoint
      await api.post(`/events/${event.id}/purchase`);

      // FIX: update seat count locally — immediate UI feedback
      setEvent(prev => ({
        ...prev,
        availableSeats: Math.max(0, prev.availableSeats - 1),
      }));

      setPurchased(true);

      // Notify parent to show success toast and schedule a background refresh
      if (onBookingResult) onBookingResult(true, event.title);

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Purchase failed. Please try again.';
      setPurchaseError(msg);
      if (onBookingResult) onBookingResult(false, event.title);
    } finally {
      setPurchasing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="glass-card glass-card-hover cursor-pointer group animate-slide-up overflow-hidden"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* ── Image / Gradient Header ──────────────────────────────────────── */}
      <div className="relative h-40 overflow-hidden rounded-t-2xl">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{
              background: event.department?.colorTag
                ? `linear-gradient(135deg, ${event.department.colorTag}33, ${event.department.colorTag}66)`
                : 'linear-gradient(135deg, #6366f133, #8b5cf666)',
            }}
          >
            {getDepartmentIcon(event.department?.name)}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {event.department && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
              style={{ backgroundColor: `${event.department.colorTag || '#6366f1'}99` }}
            >
              {event.department.name}
            </span>
          )}
          {event.type && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/40 text-white backdrop-blur-sm">
              {EVENT_TYPE_LABELS[event.type] || event.type}
            </span>
          )}
        </div>

        {isFull && (
          <div className="absolute top-3 right-3 bg-red-500/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
            SOLD OUT
          </div>
        )}

        {purchased && (
          <div className="absolute top-3 right-3 bg-green-500/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
            ✓ BOOKED
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">
          {event.title}
        </h3>
        <p className="text-white/60 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.date)}</span>
            <span className="text-white/20">•</span>
            <span>{formatTime(event.date)}</span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          {/* FIX: "Remaining Slots" label — updates immediately on purchase */}
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>
              {isFull
                ? 'Fully Booked'
                : `${event.availableSeats} of ${event.maxSeats} slots remaining`}
            </span>
          </div>
        </div>

        {/* Seat progress bar */}
        <div className="mb-4">
          <div className="seat-bar">
            <div
              className={`seat-bar-fill ${getSeatFillColor(fillPct)}`}
              style={{ width: `${Math.min(fillPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Inline error message */}
        {purchaseError && (
          <p className="text-red-400 text-xs mb-2 text-center">{purchaseError}</p>
        )}

        {/* Price + Purchase Ticket */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">
            {event.price === 0 ? 'Free' : formatCurrency(event.price)}
          </span>

          {/* FIX: "Purchase Ticket" button with loading + success states */}
          <button
            onClick={handlePurchase}
            disabled={isFull || purchasing || purchased}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl
                        transition-all duration-200
              ${isFull
                ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                : purchased
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40 cursor-not-allowed'
                  : purchasing
                    ? 'bg-indigo-500/30 text-indigo-300 cursor-wait border border-indigo-500/40'
                    : 'btn-primary text-sm py-2'}`}
          >
            <Ticket className="w-4 h-4" />
            {isFull
              ? 'Sold Out'
              : purchased
                ? 'Purchased'
                : purchasing
                  ? 'Processing...'
                  : 'Purchase Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
