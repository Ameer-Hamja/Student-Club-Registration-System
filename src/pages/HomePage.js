import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Shield, Sparkles } from 'lucide-react';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDepartmentIcon } from '../utils/helpers';

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, deptsRes] = await Promise.all([
          api.get('/events'),
          api.get('/departments').catch(() => ({ data: [] })),
        ]);
        setEvents(eventsRes.data);
        setDepartments(deptsRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEvents = selectedDept
    ? events.filter(e => e.department?.id === selectedDept)
    : events;

  const featuredEvents = filteredEvents.slice(0, 6);

  return (
    <div className="animated-bg min-h-screen">
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse-slow"
             style={{ animationDelay: '2s' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-white/70 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            Registrations open for the 2026 technical season
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up leading-tight">
            <span className="text-white">Technical</span>
            <br />
            <span className="gradient-text">Event Hub</span>
          </h1>

          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed">
            Discover hackathons, workshops, symposiums, guest lectures, and FDPs across every department.
            One hub for campus innovation, registrations, and admin operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/events" className="btn-primary text-base px-8 py-3">
              Explore Events <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link to="/register" className="btn-secondary text-base px-8 py-3">
              Create Account
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto">
            {[
              { value: events.length + '+', label: 'Events' },
              { value: departments.length + '+', label: 'Departments' },
              { value: '80%', label: 'Payment Success' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="text-2xl font-black gradient-text">{stat.value}</div>
                <div className="text-white/50 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Department Filters ───────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Browse by Department</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedDept(null)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                ${!selectedDept
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
                }`}
            >
              🎓 All Departments
            </button>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id === selectedDept ? null : dept.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${selectedDept === dept.id
                    ? 'text-white border'
                    : 'glass text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                style={selectedDept === dept.id ? {
                  backgroundColor: `${dept.colorTag}33`,
                  borderColor: `${dept.colorTag}66`,
                  color: dept.colorTag,
                } : {}}
              >
                {getDepartmentIcon(dept.name)} {dept.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Events ──────────────────────────────────────────────── */}
      <section className="py-8 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {selectedDept ? 'Filtered Events' : '🔥 Featured Events'}
            </h2>
            <Link to="/events" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading events..." />
          ) : featuredEvents.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <div className="text-5xl mb-4"><Cpu className="w-12 h-12 inline text-white/50" /></div>
              <p>No events found for this department</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-4">Build Your Next Breakthrough</h2>
              <p className="text-white/60 mb-8">
                Join the campus platform for technical symposiums, faculty programs, and high-energy hackathons.
              </p>
              <Link to="/register" className="btn-primary text-base px-10 py-3">
                Start Registering
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard icon={<Cpu className="w-5 h-5" />} title="Department-driven discovery" body="Scroll across CSE, AIML, AIDS, Cybersecurity, Data Science, ECE, EEE, and Civil to instantly narrow the event feed." />
          <FeatureCard icon={<Shield className="w-5 h-5" />} title="JWT-secured registrations" body="Students and faculty sign in once, register with payment simulation, and keep their event history synced." />
          <FeatureCard icon={<Sparkles className="w-5 h-5" />} title="Live admin control" body="Admins can publish new events and update symposium or FDP pricing from a focused dashboard." />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, body }) => (
  <div className="glass-card p-5">
    <div className="w-11 h-11 rounded-2xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center text-cyan-300 mb-4">
      {icon}
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-white/55 text-sm leading-relaxed">{body}</p>
  </div>
);

export default HomePage;
