import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/finance-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-10 w-full max-w-5xl text-center">
        {/* Hero text */}
        <div className="mb-10">
          <p className="text-xs md:text-sm tracking-[0.4em] font-semibold text-white mb-3">
            MAKE <span className="bg-blue-500 text-white px-2 py-1 rounded-sm">SAVING</span>{' '}
            EASY!
          </p>
          <h1 className="text-2xl md:text-4xl font-bold mb-3 text-white drop-shadow-lg">
            Smart Financial Literacy Assistant
          </h1>
          <p className="max-w-2xl mx-auto text-xs md:text-sm text-white/90 drop-shadow">
            AI-powered assistant to help youth manage money wisely, track spending, plan budgets,
            learn financial skills, and predict monthly savings.
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-sm text-gray-900 rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-7">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-center">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm text-left">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Enter Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Enter Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-600 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-600 text-center">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

