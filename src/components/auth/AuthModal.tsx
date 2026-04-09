'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, signUp, signIn, signInWithGoogle, user, agreeToVow } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('register');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [vowChecked, setVowChecked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (!showAuthModal) return null;

  // If user is logged in but hasn't agreed to VOW, show VOW agreement
  if (user && !user.vowAgreed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">Terms of Use Agreement</h2>
          <p className="text-sm text-text-muted mb-4">To access MLS listing data, you must agree to the VOW Terms of Use.</p>
          <div className="bg-surface rounded-lg p-4 text-xs text-text-muted max-h-48 overflow-y-auto mb-4 leading-relaxed">
            <p className="font-medium text-text-primary mb-2">By continuing, you acknowledge:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>You are entering into a lawful broker-consumer relationship with Tal Shelef, Sales Representative, Rare Real Estate Inc., Brokerage.</li>
              <li>All MLS data is for your personal, non-commercial use only.</li>
              <li>You have a bona fide interest in the purchase, sale, or lease of real estate.</li>
              <li>You will not copy, redistribute, or retransmit any listing data.</li>
              <li>You acknowledge TRREB&apos;s ownership of and copyright in the MLS database.</li>
            </ol>
          </div>
          <label className="flex items-start gap-2 text-sm cursor-pointer mb-4">
            <input type="checkbox" checked={vowChecked} onChange={(e) => setVowChecked(e.target.checked)} className="rounded mt-0.5" />
            <span>I agree to the <a href="/terms/vow" target="_blank" className="text-accent-blue hover:underline">VOW Terms of Use</a></span>
          </label>
          <button disabled={!vowChecked} onClick={async () => { await agreeToVow(); setShowAuthModal(false); }}
            className="w-full py-2.5 bg-accent-blue text-white rounded-lg font-medium disabled:opacity-50">
            Agree &amp; Continue
          </button>
        </div>
      </div>
    );
  }

  // If user has incomplete profile (Google sign-in without phone)
  if (user && !user.phone) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">Complete Your Profile</h2>
          <p className="text-sm text-text-muted mb-4">Please provide your phone number to access full listing data.</p>
          <input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm mb-3" />
          <button disabled={!form.phone} onClick={async () => {
            const { completeGoogleProfile } = useAuth();
            await completeGoogleProfile(form.phone);
          }} className="w-full py-2.5 bg-accent-blue text-white rounded-lg font-medium disabled:opacity-50">
            Continue
          </button>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      setError('All fields are required'); return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (!vowChecked) { setError('You must agree to the VOW Terms of Use'); return; }

    setLoading(true);
    const result = await signUp({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password });
    if (result.error) { setError(result.error); setLoading(false); return; }
    await agreeToVow();
    setSuccess('Account created! Check your email to verify.');
    setLoading(false);
    setTimeout(() => setShowAuthModal(false), 2000);
  };

  const handleSignIn = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Email and password required'); return; }
    setLoading(true);
    const result = await signIn(form.email, form.password);
    if (result.error) { setError(result.error); setLoading(false); return; }
    setLoading(false);
    setShowAuthModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <div className="flex justify-end p-3 pb-0">
          <button onClick={() => setShowAuthModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface2">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Logo */}
          <div className="text-center mb-4">
            <span className="text-accent-blue font-bold text-xl">CONDO</span>
            <span className="text-text-primary font-bold text-xl">WIZARD</span>
            <span className="text-text-muted font-light text-sm">.CA</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            <button onClick={() => { setTab('register'); setError(''); }} className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${tab === 'register' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted'}`}>Register</button>
            <button onClick={() => { setTab('signin'); setError(''); }} className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${tab === 'signin' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted'}`}>Sign In</button>
          </div>

          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-3 bg-green-50 p-2 rounded">{success}</p>}

          {tab === 'register' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="px-3 py-2.5 border border-border rounded-lg text-sm" />
                <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="px-3 py-2.5 border border-border rounded-lg text-sm" />
              </div>
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" />
              <input type="tel" placeholder="Phone number (required)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" />
              <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" />
              <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" />
              <label className="flex items-start gap-2 text-xs text-text-muted cursor-pointer">
                <input type="checkbox" checked={vowChecked} onChange={(e) => setVowChecked(e.target.checked)} className="rounded mt-0.5" />
                <span>I agree to the <a href="/terms/vow" target="_blank" className="text-accent-blue hover:underline">VOW Terms of Use</a> and acknowledge a lawful broker-consumer relationship with Rare Real Estate Inc.</span>
              </label>
              <button onClick={handleRegister} disabled={loading} className="w-full py-2.5 bg-accent-blue text-white rounded-lg font-medium disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Free Account'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" />
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()} />
              <button onClick={handleSignIn} disabled={loading} className="w-full py-2.5 bg-accent-blue text-white rounded-lg font-medium disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-surface2 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>

          <p className="text-[10px] text-text-muted text-center mt-4">
            By signing up you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
            Tal Shelef, Sales Representative, Rare Real Estate Inc., Brokerage.
          </p>
        </div>
      </div>
    </div>
  );
}
