'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginModal() {
  const {
    loginModalOpen,
    loginModalTab,
    hideLoginModal,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>(loginModalTab);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isRealtor, setIsRealtor] = useState(false);
  const [vowAgreed, setVowAgreed] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => { setTab(loginModalTab); setError(''); setSuccess(''); }, [loginModalTab, loginModalOpen]);

  if (!loginModalOpen) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) return setError('Please enter your full name');
    if (!email.trim()) return setError('Please enter your email');
    if (!phone.trim()) return setError('Please enter your phone number');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (!vowAgreed) return setError('You must agree to the VOW Terms of Use');

    setSubmitting(true);
    const { error: err } = await signUp({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      isRealtor,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      if (/already registered|already exists|sign in instead/i.test(err)) setTab('signin');
      return;
    }
    // Modal auto-closes on session change; redirect to onboarding for a
    // guided welcome experience.
    if (typeof window !== 'undefined') {
      window.location.href = '/onboarding';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Please enter email and password');
    setSubmitting(true);
    const { error: err } = await signIn(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (err) setError(err);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim()) return setError('Please enter your email');
    setSubmitting(true);
    const { error: err } = await resetPassword(email.trim().toLowerCase());
    setSubmitting(false);
    if (err) return setError(err);
    setSuccess('Password reset email sent. Check your inbox.');
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={hideLoginModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-0.5">
            <span className="text-accent-blue font-bold text-[15px] tracking-tight">CONDO</span>
            <span className="text-text-primary font-bold text-[15px]">WIZARD</span>
            <span className="text-text-muted font-light text-xs">.CA</span>
          </div>
          <button
            type="button"
            onClick={hideLoginModal}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface2 text-text-muted"
          >
            ✕
          </button>
        </div>

        {!showForgotPassword && (
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'signup' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === 'signin' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Sign in
            </button>
          </div>
        )}

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <h3 className="text-lg font-semibold text-text-primary">Reset your password</h3>
              <p className="text-sm text-text-muted mt-1 mb-4">
                We&rsquo;ll email a link to reset it.
              </p>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full mb-3 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-accent-blue text-white rounded-lg font-semibold hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}
                className="w-full mt-2 py-2 text-sm text-text-muted hover:text-text-primary"
              >
                Back to sign in
              </button>
            </form>
          ) : tab === 'signup' ? (
            <form onSubmit={handleSignUp}>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
                />
                <input
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
                />
              </div>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full mb-3 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
              />
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full mb-3 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
              />
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                className="w-full mb-3 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
              />

              <div className="flex items-center justify-between mb-3 p-3 bg-surface2 rounded-lg">
                <span className="text-sm text-text-primary">Are you a licensed realtor?</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsRealtor(false)} className={`px-3 py-1 text-xs rounded-md ${!isRealtor ? 'bg-text-primary text-white' : 'bg-white border border-border text-text-muted'}`}>No</button>
                  <button type="button" onClick={() => setIsRealtor(true)} className={`px-3 py-1 text-xs rounded-md ${isRealtor ? 'bg-text-primary text-white' : 'bg-white border border-border text-text-muted'}`}>Yes</button>
                </div>
              </div>

              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vowAgreed}
                  onChange={(e) => setVowAgreed(e.target.checked)}
                  className="mt-1 rounded border-border text-accent-blue focus:ring-accent-blue"
                />
                <span className="text-xs text-text-muted leading-relaxed">
                  I agree to the <a href="/terms/vow" target="_blank" rel="noreferrer" className="text-accent-blue underline">VOW Terms of Use</a> and acknowledge a lawful broker-consumer relationship with Rare Real Estate Inc.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-accent-blue text-white rounded-lg font-semibold hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? 'Creating account…' : 'Create free account'}
              </button>

              <OrDivider />
              <GoogleButton onClick={signInWithGoogle} />
            </form>
          ) : (
            <form onSubmit={handleSignIn}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full mb-3 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full mb-3 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-accent-blue text-white rounded-lg font-semibold hover:brightness-110 disabled:opacity-60 mb-2"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); }}
                className="w-full py-2 text-sm text-accent-blue hover:underline"
              >
                Forgot password?
              </button>

              <OrDivider />
              <GoogleButton onClick={signInWithGoogle} />
            </form>
          )}

          <p className="text-[10px] text-text-muted text-center mt-4 leading-relaxed">
            By continuing you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>. CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
          </p>
        </div>
      </div>
    </div>
  );
}

function OrDivider() {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
      <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-text-muted">or</span></div>
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 border border-border rounded-lg font-medium text-sm hover:bg-surface2 flex items-center justify-center gap-2 text-text-primary"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  );
}
