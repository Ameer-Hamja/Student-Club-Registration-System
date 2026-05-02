import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDate, formatTime, formatCurrency, getSeatFillColor, getDepartmentIcon } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import PaymentModal from './PaymentModal';

const EVENT_TYPE_LABELS = {
  HACKATHON:           '🏆 Hackathon',
  WORKSHOP:            '🔧 Workshop',
  TECHNICAL_SYMPOSIUM: '🎤 Symposium',
  GUEST_LECTURE:       '🎓 Guest Lecture',
  FDP:                 '📚 FDP',
};

/**
 * Props:
 *   event           — EventDTO
 *   onBookingResult — (success: boolean, eventTitle: string) => void
 */
const EventCard = ({ event, onBookingResult }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const fillPct = event.seatFillPercentage || 0;
  const isFull  = event.availableSeats === 0;

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/events/${event.id}` } });
      return;
    }
    setShowModal(true);
  };

  const handlePaymentSuccess = (registration) => {
    setShowModal(false);
    if (onBookingResult) onBookingResult(true, event.title);
  };

  const handlePaymentClose = () => {
    setShowModal(false);
    // If modal was closed after a failed payment, still notify parent so it can refresh
    if (onBookingResult) onBookingResult(false, event.title);
  };

  return (
    <>
      <div
        className="glass-card glass-card-hover cursor-pointer group animate-slide-up overflow-hidden"
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {/* ── Image / Gradient Header ─────────────────────────────────────── */}
        <div className="relative h-40 overflow-hidden rounded-t-2xl">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl"
              style={{
                background: event.department?.colorTag
                  ? `linear-gradient(135deg, ${event.department.colorTag}33, ${event.department.colorTag}66)`
                  : 'linear-gradient(135deg, #6366f133, #8b5cf666)',
              }}>
              {getDepartmentIcon(event.department?.name)}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {event.department && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
                style={{ backgroundColor: `${event.department.colorTag || '#6366f1'}99` }}>
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
              FULL
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
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
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>{isFull ? 'Fully Booked' : `${event.availableSeats} of ${event.maxSeats} seats left`}</span>
            </div>
          </div>

          {/* Seat progress bar */}
          <div className="mb-4">
            <div className="seat-bar">
              <div className={`seat-bar-fill ${getSeatFillColor(fillPct)}`}
                style={{ width: `${Math.min(fillPct, 100)}%` }} />
            </div>
          </div>

          {/* Price + Book Now */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold gradient-text">
              {event.price === 0 ? 'Free' : formatCurrency(event.price)}
            </span>
            <button
              onClick={handleBookClick}
              disabled={isFull}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200
                ${isFull
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                  : 'btn-primary text-sm py-2'}`}
            >
              {isFull ? 'Full' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <PaymentModal
          event={event}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default EventCard;
