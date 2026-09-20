import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UokLogo } from '../components/UokLogo';
import { PublicSplitLayout } from '../components/PublicSplitLayout';
import { appPath } from '../utils/appPaths';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@uok.ac.rw');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      if (result.success) {
        navigate(appPath('dashboard'));
      } else {
        setError(result.message || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicSplitLayout
      visualTitle="Automatic Failure Detection and Recovery System"
      visualText="Monitor UoK LAN nodes, detect genuine failures, and automatically restore services with minimal downtime."
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 shrink-0">
          <UokLogo />
        </div>
        <div>
          <h4 className="m-0 text-[0.95rem] font-bold text-[#1e3c72] leading-tight">University of Kigali</h4>
          <p className="m-0 text-xs text-gray-500">Automatic Failure Detection and Recovery System</p>
        </div>
      </div>

      <h1 className="text-[1.75rem] sm:text-2xl font-bold text-center text-gray-900 mb-6">Sign in</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@uok.ac.rw"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00628b]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#00628b]/30"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#00628b] text-white py-2.5 text-sm font-semibold hover:bg-[#004f70] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500 space-y-1">
        <span className="block">Admin: admin@uok.ac.rw / Admin@123</span>
        <span className="block">ICT Officer: ict@uok.ac.rw / Ict@12345</span>
        <span className="block">Viewer: viewer@uok.ac.rw / View@12345</span>
      </p>
    </PublicSplitLayout>
  );
};
