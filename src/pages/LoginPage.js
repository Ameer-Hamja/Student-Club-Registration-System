import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, ShieldCheck, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Demo accounts — seeded by DataSeeder on first startup.
 * admin@club.com / student@club.com are the canonical accounts from the auth spec.
 */
const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@club.com',
    password: 'admin123',
    icon: ShieldCheck,
    color: 'amber',
    hint: 'Full access',
  },
  {
    label: 'Student',
    email: 'student@club.com',
    password: 'student123',
    icon: GraduationCap,
    color: 'indigo',
    hint: 'Register events',
  },
  {
    label: 'Faculty',
    email: 'rajan@hub.com',
    password: 'faculty123',
    icon: BookOpen,
    color: 'emerald',
    hint: 'View & attend',
  },
];

const COLOR_MAP = {
  amber:   'text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300 border-amber-500/20',
  indigo:  'text-indigo-400/80 hover:bg-indigo-500/10 hover:text-indigo-300 border-indigo-500/20',
  emerald: 'text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300 border-emerald-500/20',
};

const LoginPage = () => {
  const { handleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await handleLogin(form.email, form.password);
      // Redirect: ADMIN → /admin, others → previous page or home
      navigate(user.role === 'ADMIN' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg min-h-screen flex items-center justify-center px-4 pt-16">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass-card p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center shadow-xl mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Technical Event Hub</h1>
            <p className="text-white/50 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Demo account quick-fill */}
          <div className="mb-6">
            <p className="text-white/30 text-xs text-center mb-2 uppercase tracking-wider">
              Quick demo login
            </p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map(({ label, email, password, icon: Icon, color, hint }) => (
                <button
                  key={label}
                  onClick={() => { setForm({ email, password }); setError(''); }}
                  title={`${email} / ${password} — ${hint}`}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 glass rounded-xl
                              border transition-all text-xs font-medium ${COLOR_MAP[color]}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <p className="text-white/20 text-xs text-center mt-1.5">
              Click a role to pre-fill credentials
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError(''); }}
                placeholder="you@club.com"
                className="input-glass"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                  placeholder="••••••••"
                  className="input-glass pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            No account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Credential hint card */}
        <div className="mt-4 glass rounded-2xl p-4 text-xs text-white/40 space-y-1">
          <p className="font-semibold text-white/60 mb-2">Seeded credentials (BCrypt-encoded in DB)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
            <span className="text-amber-400/70">admin@club.com</span>
            <span>admin123</span>
            <span className="text-indigo-400/70">student@club.com</span>
            <span>student123</span>
            <span className="text-emerald-400/70">rajan@hub.com</span>
            <span>faculty123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
