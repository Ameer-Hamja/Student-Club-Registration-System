import React, { useState, useEffect } from 'react';
import {
  Pencil, Trash2, Plus, RefreshCw, BarChart3, Calendar,
  Users, DollarSign, CheckCircle2, XCircle, Save, Loader2,
  Layers3, Tickets
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EditEventModal from '../components/EditEventModal';
import DepartmentFilterBar from '../components/DepartmentFilterBar';
import { ToastContainer, useToast } from '../components/Toast';
import { formatDateTime, formatCurrency } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const TABS = ['overview', 'events', 'departments', 'finance'];
const EVENT_TYPE_LABELS = {
  HACKATHON: 'Hackathon', WORKSHOP: 'Workshop',
  TECHNICAL_SYMPOSIUM: 'Symposium', GUEST_LECTURE: 'Guest Lecture', FDP: 'FDP',
};
const PRICING_TYPES = ['TECHNICAL_SYMPOSIUM', 'FDP'];
const emptyEventForm = {
  title: '', description: '', type: 'TECHNICAL_SYMPOSIUM',
  price: '', maxSeats: '', date: '', departmentId: '', venue: '',
};

// ── Main AdminPage ─────────────────────────────────────────────────────────────
const AdminPage = () => {
  const [activeTab, setActiveTab]     = useState('overview');
  const [stats, setStats]             = useState(null);
  const [events, setEvents]           = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sR, eR, dR] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/events'),
        api.get('/admin/departments'),
      ]);
      setStats(sR.data);
      setEvents(eR.data);
      setDepartments(dR.data);
    } catch {
      addToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="animated-bg min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Panel</h1>
            <p className="text-white/50 mt-1">Manage events, departments, and analytics</p>
          </div>
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all duration-200
                ${activeTab === tab
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                  : 'glass text-white/60 hover:text-white hover:bg-white/10'}`}>
              {tab === 'overview' ? '📊 Overview' : tab === 'events' ? '🎪 Events'
                : tab === 'departments' ? '🏛️ Departments' : '💰 Finance'}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner message="Loading admin data..." /> : (
          <>
            {activeTab === 'overview'    && <OverviewTab stats={stats} />}
            {activeTab === 'events'      && <EventsTab events={events} departments={departments} onRefresh={fetchAll} addToast={addToast} />}
            {activeTab === 'departments' && <DepartmentsTab departments={departments} onRefresh={fetchAll} addToast={addToast} />}
            {activeTab === 'finance'     && <FinanceTab addToast={addToast} />}
          </>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// ── Overview Tab ───────────────────────────────────────────────────────────────
const OverviewTab = ({ stats }) => {
  if (!stats) return null;
  const pieData = [
    { name: 'Paid',   value: stats.paidRegistrations   || 0 },
    { name: 'Failed', value: stats.failedRegistrations || 0 },
  ];
  const PIE_COLORS = ['#10b981', '#ef4444'];
  const barData = (stats.registrationsByDepartment || []).map(d => ({
    dept: d.department || 'Unknown', count: Number(d.count) || 0,
  }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users      className="w-5 h-5"/>} label="Total Users"    value={stats.totalUsers}          color="indigo"  />
        <StatCard icon={<Calendar   className="w-5 h-5"/>} label="Total Events"   value={stats.totalEvents}         color="purple"  />
        <StatCard icon={<Tickets    className="w-5 h-5"/>} label="Registrations"  value={stats.totalRegistrations}  color="cyan"    />
        <StatCard icon={<DollarSign className="w-5 h-5"/>} label="Revenue"        value={formatCurrency(stats.totalRevenue || 0)} color="emerald" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Registrations by Department
          </h3>
          {barData.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dept" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e1e3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="glass-card p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Payment Status
          </h3>
          {(stats.paidRegistrations + stats.failedRegistrations) === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No registrations yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e1e3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {stats.popularEvents && stats.popularEvents.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-bold mb-4">🔥 Top Events by Occupancy</h3>
          <div className="space-y-3">
            {stats.popularEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-white/30 text-sm w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white font-medium">{ev.event}</span>
                    <span className="text-white/50">{ev.occupancy}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ev.occupancy}%` }} />
                  </div>
                </div>
                <span className="text-white/40 text-xs w-20 text-right">{ev.availableSeats}/{ev.maxSeats} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Events Tab ─────────────────────────────────────────────────────────────────
const EventsTab = ({ events, departments, onRefresh, addToast }) => {
  const [editEvent,   setEditEvent]   = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [filterDept,  setFilterDept]  = useState(null);
  const [filterType,  setFilterType]  = useState('');
  const [priceDrafts, setPriceDrafts] = useState({});
  const [savingId,    setSavingId]    = useState(null);
  const [form,        setForm]        = useState(emptyEventForm);

  useEffect(() => {
    setPriceDrafts(Object.fromEntries(events.map(e => [e.id, String(e.price ?? 0)])));
  }, [events]);

  const filtered = events.filter(e => {
    if (filterDept && e.department?.name !== filterDept) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  const pricingEvents = events.filter(e => PRICING_TYPES.includes(e.type));

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/admin/events/${id}`);
      addToast(`"${title}" deleted`, 'success');
      onRefresh();
    } catch { addToast('Failed to delete event', 'error'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.maxSeats || !form.date) {
      addToast('Please fill in all required fields', 'error'); return;
    }
    setCreating(true);
    try {
      await api.post('/admin/events', {
        title: form.title.trim(), description: form.description.trim(),
        type: form.type, price: Number(form.price), maxSeats: Number(form.maxSeats),
        date: form.date, venue: form.venue.trim() || undefined,
        department: form.departmentId ? { id: Number(form.departmentId) } : null,
      });
      setForm(emptyEventForm); setShowCreate(false);
      addToast('Event created successfully', 'success'); onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create event', 'error');
    } finally { setCreating(false); }
  };

  const savePrice = async (event) => {
    setSavingId(event.id);
    try {
      await api.put(`/admin/events/${event.id}`, { price: Number(priceDrafts[event.id] ?? event.price) });
      addToast(`Price updated for "${event.title}"`, 'success'); onRefresh();
    } catch { addToast('Failed to update price', 'error'); }
    finally { setSavingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Live Pricing Table */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-1">Live Pricing Table</h2>
        <p className="text-white/40 text-sm mb-5">
          Real-time price editor for <span className="text-cyan-300">Technical Symposium</span> and <span className="text-cyan-300">FDP</span> events.
        </p>
        {pricingEvents.length === 0 ? (
          <p className="text-white/40 text-sm py-4">No Symposium or FDP events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  <th className="text-left py-3 pr-4">Event</th>
                  <th className="text-left py-3 pr-4">Type</th>
                  <th className="text-left py-3 pr-4">Department</th>
                  <th className="text-left py-3 pr-4">Seats</th>
                  <th className="text-left py-3 pr-4 min-w-[140px]">Price (₹)</th>
                  <th className="text-left py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pricingEvents.map(ev => (
                  <tr key={ev.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">
                      <p className="text-white font-medium">{ev.title}</p>
                      <p className="text-white/35 text-xs">{formatDateTime(ev.date)}</p>
                    </td>
                    <td className="py-3 pr-4 text-cyan-300 text-xs">{EVENT_TYPE_LABELS[ev.type]}</td>
                    <td className="py-3 pr-4 text-white/60 text-xs">{ev.department?.name || '—'}</td>
                    <td className="py-3 pr-4 text-white/60 text-xs">{ev.availableSeats}/{ev.maxSeats}</td>
                    <td className="py-3 pr-4">
                      <input type="number" min="0" step="0.01"
                        value={priceDrafts[ev.id] ?? ''}
                        onChange={e => setPriceDrafts(p => ({ ...p, [ev.id]: e.target.value }))}
                        className="input-glass py-1.5 text-sm" />
                    </td>
                    <td className="py-3">
                      <button onClick={() => savePrice(ev)} disabled={savingId === ev.id}
                        className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-60">
                        {savingId === ev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Events Table */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold text-white">All Events ({filtered.length})</h2>
          <button onClick={() => setShowCreate(p => !p)} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showCreate ? 'Cancel' : 'New Event'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="glass rounded-2xl p-5 mb-6 space-y-4 border border-indigo-500/20">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Create New Event
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-white/50 text-xs mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                  placeholder="Event title" className="input-glass" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/50 text-xs mb-1 block">Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="Brief description" className="input-glass resize-none" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Type *</label>
                <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                  className="input-glass bg-transparent">
                  {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v} className="bg-slate-900">{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Department</label>
                <select value={form.departmentId} onChange={e => setForm(p => ({...p, departmentId: e.target.value}))}
                  className="input-glass bg-transparent">
                  <option value="" className="bg-slate-900">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Price (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setForm(p => ({...p, price: e.target.value}))}
                  placeholder="499" className="input-glass" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Max Seats *</label>
                <input type="number" min="1" value={form.maxSeats}
                  onChange={e => setForm(p => ({...p, maxSeats: e.target.value}))}
                  placeholder="120" className="input-glass" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Date & Time *</label>
                <input type="datetime-local" value={form.date}
                  onChange={e => setForm(p => ({...p, date: e.target.value}))}
                  className="input-glass" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Venue</label>
                <input value={form.venue} onChange={e => setForm(p => ({...p, venue: e.target.value}))}
                  placeholder="Hall / Room" className="input-glass" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={creating}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="input-glass bg-transparent text-sm py-1.5 w-auto">
            <option value="" className="bg-slate-900">All Types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v} className="bg-slate-900">{l}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <DepartmentFilterBar departments={departments} selected={filterDept} onSelect={setFilterDept} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="text-left py-3 pr-4">Event</th>
                <th className="text-left py-3 pr-4">Type</th>
                <th className="text-left py-3 pr-4">Dept</th>
                <th className="text-left py-3 pr-4">Date</th>
                <th className="text-left py-3 pr-4">Price</th>
                <th className="text-left py-3 pr-4">Seats</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium line-clamp-1">{ev.title}</p>
                    {ev.venue && <p className="text-white/35 text-xs">📍 {ev.venue}</p>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      {EVENT_TYPE_LABELS[ev.type] || ev.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/60 text-xs">{ev.department?.name || '—'}</td>
                  <td className="py-3 pr-4 text-white/60 text-xs">{formatDateTime(ev.date)}</td>
                  <td className="py-3 pr-4 text-white font-semibold">{formatCurrency(ev.price)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium ${ev.availableSeats === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {ev.availableSeats}/{ev.maxSeats}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditEvent(ev)}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/50 hover:text-indigo-300 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ev.id, ev.title)}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/50 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-white/30">No events match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editEvent && (
        <EditEventModal event={editEvent} onClose={() => setEditEvent(null)}
          onSaved={() => { setEditEvent(null); onRefresh(); }} addToast={addToast} />
      )}
    </div>
  );
};

// ── Departments Tab ────────────────────────────────────────────────────────────
const DepartmentsTab = ({ departments, onRefresh, addToast }) => {
  const [editDept,   setEditDept]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({ name: '', description: '', colorTag: '#6366f1' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { addToast('Department name is required', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/admin/departments', form);
      setForm({ name: '', description: '', colorTag: '#6366f1' });
      setShowCreate(false);
      addToast('Department created', 'success'); onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create department', 'error');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/departments/${editDept.id}`, editDept);
      setEditDept(null);
      addToast('Department updated', 'success'); onRefresh();
    } catch { addToast('Failed to update department', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"? This may affect existing events.`)) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      addToast(`"${name}" deleted`, 'success'); onRefresh();
    } catch { addToast('Failed to delete department', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Departments ({departments.length})</h2>
        <button onClick={() => setShowCreate(p => !p)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showCreate ? 'Cancel' : 'Add Department'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-5 space-y-4 border border-indigo-500/20">
          <h3 className="text-white font-semibold">New Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-white/50 text-xs mb-1 block">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                placeholder="e.g. CSE" className="input-glass" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Short description" className="input-glass" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.colorTag}
                  onChange={e => setForm(p => ({...p, colorTag: e.target.value}))}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20" />
                <input value={form.colorTag} onChange={e => setForm(p => ({...p, colorTag: e.target.value}))}
                  placeholder="#6366f1" className="input-glass flex-1 font-mono text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="glass-card p-5 relative group">
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl"
              style={{ backgroundColor: `${dept.colorTag}22`, border: `1px solid ${dept.colorTag}44` }}>
              🏛️
            </div>
            {editDept?.id === dept.id ? (
              <form onSubmit={handleUpdate} className="space-y-2">
                <input value={editDept.name} onChange={e => setEditDept(p => ({...p, name: e.target.value}))}
                  className="input-glass text-sm py-1.5" />
                <input value={editDept.description || ''} onChange={e => setEditDept(p => ({...p, description: e.target.value}))}
                  placeholder="Description" className="input-glass text-sm py-1.5" />
                <div className="flex gap-2">
                  <input type="color" value={editDept.colorTag || '#6366f1'}
                    onChange={e => setEditDept(p => ({...p, colorTag: e.target.value}))}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
                  <input value={editDept.colorTag || ''} onChange={e => setEditDept(p => ({...p, colorTag: e.target.value}))}
                    className="input-glass text-xs py-1 font-mono flex-1" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditDept(null)} className="btn-secondary text-xs py-1 flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary text-xs py-1 flex-1 disabled:opacity-60">Save</button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="text-white font-bold">{dept.name}</h3>
                <p className="text-white/50 text-xs mt-1 line-clamp-2">{dept.description || 'No description'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.colorTag }} />
                  <span className="text-white/30 text-xs font-mono">{dept.colorTag}</span>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditDept({...dept})}
                    className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/50 hover:text-indigo-300">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(dept.id, dept.name)}
                    className="w-7 h-7 rounded-lg glass flex items-center justify-center text-white/50 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Finance Tab ────────────────────────────────────────────────────────────────
const FinanceTab = ({ addToast }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/admin/transactions', { params });
      setTransactions(res.data);
    } catch { addToast('Failed to load transactions', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, [statusFilter]);

  const totalRevenue = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Transaction Ledger</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {transactions.length} transactions · Revenue:{' '}
            <span className="text-emerald-400 font-semibold">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {['', 'SUCCESS', 'FAILED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all
                ${statusFilter === s
                  ? s === 'SUCCESS' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : s === 'FAILED' ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                    : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                  : 'glass text-white/60 hover:text-white'}`}>
              {s === '' ? 'All' : s === 'SUCCESS' ? '✅ Success' : '❌ Failed'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner message="Loading transactions..." /> : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  <th className="text-left py-3 px-4">Transaction ID</th>
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Event</th>
                  <th className="text-left py-3 px-4">Dept</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-white/50 text-xs">{tx.id?.slice(0, 16)}…</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white text-xs font-medium">{tx.studentName}</p>
                      <p className="text-white/40 text-xs">{tx.studentEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-white/70 text-xs max-w-[160px] truncate">{tx.eventTitle}</td>
                    <td className="py-3 px-4 text-white/50 text-xs">{tx.departmentName || '—'}</td>
                    <td className="py-3 px-4 text-white font-semibold">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 px-4">
                      {tx.status === 'SUCCESS'
                        ? <span className="badge-paid flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/>PAID</span>
                        : <span className="badge-failed flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/>FAILED</span>}
                    </td>
                    <td className="py-3 px-4 text-white/40 text-xs">{formatDateTime(tx.timestamp)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-white/30">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared StatCard ────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    indigo:  'from-indigo-500/20  to-indigo-600/10  border-indigo-500/30  text-indigo-300',
    purple:  'from-purple-500/20  to-purple-600/10  border-purple-500/30  text-purple-300',
    cyan:    'from-cyan-500/20    to-cyan-600/10    border-cyan-500/30    text-cyan-300',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
  };
  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colorMap[color]} border`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-white/50 text-xs">{label}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
};

export default AdminPage;
