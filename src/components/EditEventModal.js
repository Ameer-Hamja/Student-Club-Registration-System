import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Users, Tag, FileText } from 'lucide-react';
import api from '../utils/api';

/**
 * Admin modal to edit price, seats, title, and description of an event.
 * Props:
 *   event    — the event object to edit
 *   onClose  — () => void
 *   onSaved  — (updatedEvent) => void   called after successful save
 *   addToast — (message, type) => void
 */
const EditEventModal = ({ event, onClose, onSaved, addToast }) => {
  const [form, setForm] = useState({
    title:       event.title       || '',
    price:       event.price       ?? '',
    maxSeats:    event.maxSeats    ?? '',
    description: event.description || '',
    venue:       event.venue       || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim())          errs.title    = 'Title is required';
    if (Number(form.price) <= 0)     errs.price    = 'Price must be positive';
    if (Number(form.maxSeats) <= 0)  errs.maxSeats = 'Seats must be positive';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        title:       form.title.trim(),
        price:       parseFloat(form.price),
        maxSeats:    parseInt(form.maxSeats, 10),
        description: form.description.trim() || undefined,
        venue:       form.venue.trim()       || undefined,
      };
      const res = await api.put(`/admin/events/${event.id}`, payload);
      addToast(`"${res.data.title}" updated successfully`, 'success');
      onSaved(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update event';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({
    value:    form[name],
    onChange: (e) => {
      setForm(p => ({ ...p, [name]: e.target.value }));
      setErrors(p => ({ ...p, [name]: '' }));
    },
  });

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Event</h2>
            <p className="text-white/40 text-sm mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg glass flex items-center justify-center
                       text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <FormField label="Title" icon={<Tag className="w-4 h-4" />} error={errors.title}>
            <input {...field('title')} placeholder="Event title" className="input-glass" />
          </FormField>

          {/* Price + Seats side by side */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price (₹)" icon={<DollarSign className="w-4 h-4" />} error={errors.price}>
              <input {...field('price')} type="number" min="0" step="0.01"
                placeholder="0" className="input-glass" />
            </FormField>
            <FormField label="Max Seats" icon={<Users className="w-4 h-4" />} error={errors.maxSeats}>
              <input {...field('maxSeats')} type="number" min="1"
                placeholder="100" className="input-glass" />
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description" icon={<FileText className="w-4 h-4" />}>
            <textarea {...field('description')} rows={3} placeholder="Event description"
              className="input-glass resize-none" />
          </FormField>

          {/* Venue */}
          <FormField label="Venue">
            <input {...field('venue')} placeholder="Location / Hall" className="input-glass" />
          </FormField>

          {/* Current seat info */}
          <div className="glass rounded-xl p-3 text-xs text-white/50 flex gap-4">
            <span>Current seats: <strong className="text-white">{event.maxSeats}</strong></span>
            <span>Available: <strong className="text-emerald-400">{event.availableSeats}</strong></span>
            <span>Booked: <strong className="text-amber-400">{event.maxSeats - event.availableSeats}</strong></span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FormField = ({ label, icon, error, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-white/60 text-sm mb-1.5">
      {icon && <span className="text-white/40">{icon}</span>}
      {label}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

export default EditEventModal;
