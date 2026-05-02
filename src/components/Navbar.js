import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 
                            flex items-center justify-center text-lg shadow-lg 
                            group-hover:scale-110 transition-transform duration-200">
              🎓
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">
              Tech Event Hub
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={isActive('/')}>Home</NavLink>
            <NavLink to="/events" active={isActive('/events')}>Events</NavLink>
            {isAuthenticated() && !isAdmin() && (
              <NavLink to="/dashboard" active={isActive('/dashboard')}>My Events</NavLink>
            )}
            {isAdmin() && (
              <NavLink to="/admin" active={location.pathname.startsWith('/admin')}>Admin</NavLink>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-xl glass glass-card-hover flex items-center justify-center text-lg"
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated() ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 glass px-3 py-1.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 
                                  flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/80 max-w-[100px] truncate">{user?.name}</span>
                  {isAdmin() && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 
                                     px-2 py-0.5 rounded-full">Admin</span>
                  )}
                </div>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-4">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Sign Up</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 rounded-xl glass flex items-center justify-center"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-1">
              <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>🏠 Home</MobileNavLink>
              <MobileNavLink to="/events" onClick={() => setMenuOpen(false)}>🎪 Events</MobileNavLink>
              {isAuthenticated() && !isAdmin() && (
                <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>📋 My Events</MobileNavLink>
              )}
              {isAdmin() && (
                <MobileNavLink to="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</MobileNavLink>
              )}
              {isAuthenticated() && (
                <button onClick={handleLogout}
                  className="text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
      ${active
        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={onClick}
    className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
  >
    {children}
  </Link>
);

export default Navbar;
