import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signup as apiSignup } from '../services/api';
import { Zap, UserPlus } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await apiSignup(name, email, password);
      loginUser(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">JobAgent</h1>
          <p className="text-sm text-zinc-500 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-100 border border-white/[0.06] rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface-0 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-brand-600/20 cursor-pointer"
          >
            {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
