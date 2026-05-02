import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * handleLogin — sends POST /auth/login, persists JWT + role to localStorage.
   * Returns the user object so callers can redirect based on role.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{name, email, role}>}
   */
  const handleLogin = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: jwt, name, email: userEmail, role } = response.data;

    const userData = { name, email: userEmail, role };

    // Persist credentials
    localStorage.setItem('token',    jwt);
    localStorage.setItem('user',     JSON.stringify(userData));
    localStorage.setItem('role',     role);     // quick role lookup without JSON.parse
    localStorage.setItem('userRole', role);     // alias used by Sidebar for admin check

    setToken(jwt);
    setUser(userData);

    return userData;
  };

  // Alias so existing code using `login` still works
  const login = handleLogin;

  const register = async ({ name, email, password, role = 'STUDENT', departmentId = null }) => {
    await api.post('/auth/register', { name, email, password, role, departmentId });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');
    setToken(null);
    setUser(null);
  };

  const isAdmin         = () => user?.role === 'ADMIN';
  const isStudent       = () => user?.role === 'STUDENT';
  const isFaculty       = () => user?.role === 'FACULTY';
  const isAuthenticated = () => !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, handleLogin,   // both names available
      register, logout,
      isAdmin, isStudent, isFaculty, isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
