import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import api from '../utils/api';

const EVENT_TYPE_LABELS = {
  HACKATHON: '🏆 Hackathon',
  WORKSHOP: '🔧 Workshop',
  TECHNICAL_SYMPOSIUM: '🎤 Symposium',
  GUEST_LECTURE: '🎓 Guest Lecture',
  FDP: '📚 FDP',
};

/**
 * Glassmorphism payment modal.
 * Shows: Event Title, Type, Department, Venue, Price.
 * Simulates payment via POST /events/{id}/register.
 *
 * Props:
 *   event     — EventDTO
 *   onClose   — () => void
 *   onSuccess — (registrationDTO) => void
 */
const PaymentModal = ({ event, onClose, onSuccess }) => {
  const [step, setStep] = useState('confirm'); // confirm | processing | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setStep('processing');
    setError('');
    try {
      const response = await api.post(`/events/${event.id}/register`);
      setResult(response.data);
      setStep('result');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      setStep('confirm');
    }
  };

  const isPaid = result?.paymentStatus === 'PAID';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-md p-6 animate-slide-up">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">
              {step === 'result'
                ? (isPaid ? 'Payment Successful' : 'Payment Failed')
                : 'Simulate Payment'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Confirm Step ─────────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Event Summary */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white font-semibold text-base leading-tight">{event.title}</p>
                  {event.type && (
                    <span className="text-xs text-white/50 mt-0.5 block">
                      {EVENT_TYPE_LABELS[event.type] || event.type}
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black gradient-text whitespace-nowrap">
                  {event.price === 0 ? 'Free' : formatCurrency(event.price)}
                </span>
              </div>

              <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-xs">
                {event.department?.name && (
                  <div>
                    <span className="text-white/40 block">Department</span>
                    <span className="text-white font-medium">{event.department.name}</span>
                  </div>
                )}
                {event.venue && (
                  <div>
                    <span className="text-white/40 block">Venue</span>
                    <span className="text-white font-medium">{event.venue}</span>
                  </div>
                )}
                <div>
                  <span className="text-white/40 block">Seats Left</span>
                  <span className="text-emerald-400 font-medium">{event.availableSeats}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Total Seats</span>
                  <span className="text-white font-medium">{event.maxSeats}</span>
                </div>
              </div>
            </div>

            {/* Mock Card */}
            <div className="glass rounded-2xl p-4 space-y-2">
              <p className="text-white/40 text-xs uppercase tracking-wider">Payment Method (Simulated)</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-md
                                flex items-center justify-center text-xs font-black text-black">
                  VISA
                </div>
                <div>
                  <p className="text-white/80 text-sm font-mono">•••• •••• •••• 4242</p>
                  <p className="text-white/40 text-xs">Expires 12/28</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <p className="text-white/40 text-xs">80% success rate simulation</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handlePayment} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay {event.price === 0 ? 'Free' : formatCurrency(event.price)}
              </button>
            </div>
          </div>
        )}

        {/* ── Processing Step ──────────────────────────────────────────────── */}
        {step === 'processing' && (
          <div className="text-center py-10 space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              <Loader className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-white font-medium">Processing payment...</p>
            <p className="text-white/40 text-sm">Contacting payment gateway</p>
          </div>
        )}

        {/* ── Result Step ──────────────────────────────────────────────────── */}
        {step === 'result' && result && (
          <div className="text-center space-y-5">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center
              ${isPaid ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {isPaid
                ? <CheckCircle className="w-10 h-10 text-emerald-400" />
                : <XCircle    className="w-10 h-10 text-red-400" />}
            </div>

            {isPaid ? (
              <div className="space-y-3">
                <p className="text-white font-bold text-lg">Registration Confirmed!</p>
                <p className="text-white/60 text-sm">
                  You're registered for <strong className="text-white">{event.title}</strong>
                </p>
                <div className="glass rounded-xl p-4 text-left space-y-2">
                  <Row label="Transaction ID"
                    value={<span className="font-mono text-emerald-300 text-xs">{result.transactionId?.slice(0, 20)}…</span>} />
                  <Row label="Amount Paid"
                    value={<span className="text-white font-semibold">{formatCurrency(result.eventPrice ?? event.price)}</span>} />
                  <Row label="Status"
                    value={<span className="badge-paid">PAID</span>} />
                </div>
                <p className="text-white/30 text-xs">📧 Confirmation email sent (mock)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-white font-bold text-lg">Payment Failed</p>
                <p className="text-white/60 text-sm">
                  Your payment could not be processed. No seats were deducted.
                </p>
                <div className="glass rounded-xl p-3 text-xs text-white/40">
                  Transaction recorded as FAILED. You may try again.
                </div>
              </div>
            )}

            <button
              onClick={() => { isPaid ? onSuccess(result) : onClose(); }}
              className="btn-primary w-full"
            >
              {isPaid ? 'View My Events' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-white/50 text-xs">{label}</span>
    <span>{value}</span>
  </div>
);

export default PaymentModal;
