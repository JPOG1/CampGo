import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error } = useAuthStore();
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }
    try {
      await forgotPassword(input);
      setSubmitted(true);
      toast.success('If the account exists, a reset link has been sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Request failed');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email/phone</h2>
            <p className="text-gray-600 mb-6">
              If an account exists with that email or phone, we've sent a password reset link.
            </p>
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEmail = input.includes('@');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CampGo</h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Phone Number
              </label>
              <input
                type={isEmail ? 'email' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="you@example.com or +2348012345678"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the email address or phone number associated with your account
              </p>
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
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-primary font-semibold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
