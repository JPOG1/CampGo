import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';

type LoginMode = 'phone' | 'email';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, user, error } = useAuthStore();
  const [mode, setMode] = useState<LoginMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);

  const roleRedirect: Record<string, string> = {
    CUSTOMER: '/dashboard',
    RIDER: '/rider/dashboard',
    VENDOR: '/vendor/dashboard',
    ADMIN: '/admin/dashboard',
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (user && !user.is_verified) {
        setShowVerifyBanner(true);
      } else if (user) {
        navigate({ to: roleRedirect[user.role] || '/dashboard' });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'phone' && !phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (mode === 'email' && !email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    try {
      await login(mode === 'phone' ? phone : email, password);
      toast.success('Login successful');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Invalid credentials');
    }
  };

  const handleSendVerification = async () => {
    try {
      const { sendVerificationEmail } = useAuthStore.getState();
      await sendVerificationEmail();
      toast.success('Verification email sent!');
    } catch {
      toast.error('Failed to send verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CampGo</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {showVerifyBanner && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">Please verify your email</p>
            <p className="text-yellow-600 text-xs mt-1">
              Check your inbox or{' '}
              <button onClick={handleSendVerification} className="underline font-semibold">
                resend verification email
              </button>
            </p>
          </div>
        )}

        <div className="card">
          <div className="flex mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'phone'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'email'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Email
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {mode === 'phone' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary font-semibold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-sm text-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
