import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const RegisterPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    departmentId: '',
  });
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api.get('/departments')
      .then((response) => setDepartments(response.data))
      .catch(() => setDepartments([]));
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      });
      // Auto-login after registration
      await login(form.email, form.password);
      navigate(form.role === 'ADMIN' ? '/admin' : '/events');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Email may already be in use.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 
                            flex items-center justify-center shadow-xl mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Create Account</h1>
            <p className="text-white/50 text-sm mt-1">Join the Technical Event Hub</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`input-glass ${errors.name ? 'border-red-500/50' : ''}`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`input-glass ${errors.email ? 'border-red-500/50' : ''}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-1.5">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="input-glass bg-transparent"
                >
                  <option value="STUDENT" className="bg-slate-900">Student</option>
                  <option value="FACULTY" className="bg-slate-900">Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1.5">Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleChange}
                    className="input-glass bg-transparent pl-10"
                  >
                    <option value="" className="bg-slate-900">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id} className="bg-slate-900">
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={`input-glass pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className={`input-glass ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                {errors.general}
              </div>
            )}

            {/* Password Strength */}
            {form.password && (
              <PasswordStrength password={form.password} />
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300
            ${i <= strength ? colors[strength] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className="text-xs text-white/40">{labels[strength]}</p>
    </div>
  );
};

export default RegisterPage;
