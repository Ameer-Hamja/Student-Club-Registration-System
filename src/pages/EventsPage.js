import React, { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import DepartmentFilterBar from '../components/DepartmentFilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { ToastContainer, useToast } from '../components/Toast';

const EVENT_TYPES = [
  { value: '',                    label: 'All Types' },
  { value: 'HACKATHON',           label: '🏆 Hackathon' },
  { value: 'WORKSHOP',            label: '🔧 Workshop' },
  { value: 'TECHNICAL_SYMPOSIUM', label: '🎤 Symposium' },
  { value: 'GUEST_LECTURE',       label: '🎓 Guest Lecture' },
  { value: 'FDP',                 label: '📚 FDP' },
];

const EventsPage = () => {
  const { toasts, addToast, removeToast } = useToast();

  const [events,      setEvents]      = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [selectedDept,setSelectedDept]= useState(null);   // dept name string
  const [eventType,   setEventType]   = useState('');
  const [maxPrice,    setMaxPrice]    = useState('');
  const [sortBy,      setSortBy]      = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  // Load departments once
  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  // Fetch events whenever filters change (debounced for search)
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (search.trim()) {
        res = await api.get('/events', { params: { search: search.trim() } });
      } else if (selectedDept) {
        res = await api.get('/events/filter', { params: { dept: selectedDept } });
      } else if (eventType) {
        res = await api.get('/events', { params: { type: eventType } });
      } else if (maxPrice) {
        res = await api.get('/events', { params: { maxPrice } });
      } else {
        res = await api.get('/events');
      }
      setEvents(res.data);
    } catch {
      addToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedDept, eventType, maxPrice]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchEvents, search]);

  // Client-side sort
  const sorted = [...events].sort((a, b) => {
    if (sortBy === 'date')        return new Date(a.date) - new Date(b.date);
    if (sortBy === 'price-asc')   return a.price - b.price;
    if (sortBy === 'price-desc')  return b.price - a.price;
    if (sortBy === 'seats')       return b.availableSeats - a.availableSeats;
    return 0;
  });

  const clearAll = () => {
    setSearch(''); setSelectedDept(null);
    setEventType(''); setMaxPrice(''); setSortBy('date');
  };

  const hasFilters = search || selectedDept || eventType || maxPrice;

  // Called by EventCard after modal closes (success or failure)
  const handleBookingResult = (success, eventTitle) => {
    if (success) {
      addToast(`🎉 Registered for "${eventTitle}" successfully!`, 'success');
    } else {
      addToast(`Payment failed for "${eventTitle}". Please try again.`, 'error');
    }
    fetchEvents(); // always refresh seat counts
  };

  return (
    <div className="animated-bg min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1">🎪 Events</h1>
          <p className="text-white/50">
            {loading ? 'Loading...' : `${sorted.length} event${sorted.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* ── Department Filter Bar ───────────────────────────────────────── */}
        <div className="mb-6">
          <DepartmentFilterBar
            departments={departments}
            selected={selectedDept}
            onSelect={setSelectedDept}
          />
        </div>

        {/* ── Search + Filter Row ─────────────────────────────────────────── */}
        <div className="glass-card p-4 mb-8">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search events, tags, venues..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-glass pl-9"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Toggle advanced filters */}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${showFilters ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                              : 'glass text-white/70 hover:text-white'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {hasFilters && <span className="w-2 h-2 bg-indigo-400 rounded-full" />}
            </button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 animate-fade-in">
              {/* Event Type */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Event Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}
                  className="input-glass bg-transparent">
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Max Price (₹)</label>
                <input type="number" min="0" placeholder="e.g. 500"
                  value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="input-glass" />
              </div>

              {/* Sort */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="input-glass bg-transparent">
                  <option value="date"       className="bg-gray-900">Date (earliest)</option>
                  <option value="price-asc"  className="bg-gray-900">Price ↑</option>
                  <option value="price-desc" className="bg-gray-900">Price ↓</option>
                  <option value="seats"      className="bg-gray-900">Seats Available</option>
                </select>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-white/30 text-xs">Active:</span>
              {search      && <Chip label={`"${search}"`}   onRemove={() => setSearch('')} />}
              {selectedDept&& <Chip label={selectedDept}    onRemove={() => setSelectedDept(null)} />}
              {eventType   && <Chip label={eventType.replace('_', ' ')} onRemove={() => setEventType('')} />}
              {maxPrice    && <Chip label={`≤ ₹${maxPrice}`} onRemove={() => setMaxPrice('')} />}
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Events Grid ─────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner message="Loading events..." />
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-white/50 mb-6">Try adjusting your filters</p>
            <button onClick={clearAll} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onBookingResult={handleBookingResult}
              />
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

const Chip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30
                   px-2 py-0.5 rounded-full text-xs">
    {label}
    <button onClick={onRemove} className="hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
  </span>
);

export default EventsPage;
