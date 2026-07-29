'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_realtor: boolean;
  vow_agreed: boolean;
  avatar_url?: string | null;
  preferred_areas?: string[] | null;
  preferences?: Record<string, unknown> | null;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isRealtor?: boolean;
}

// Legacy shape retained so the many consumers that read
// user.firstName / user.lastName / user.email / user.vowAgreed continue
// to work without a sweeping refactor. `user` is null when signed out.
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  vowAgreed: boolean;
  avatarUrl: string | null;
  profileComplete: boolean;
  isRealtor: boolean;
}

interface AuthContextType {
  // New primary API
  authUser: User | null;                         // Raw Supabase User
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  showLoginModal: (tab?: 'signin' | 'signup') => void;
  hideLoginModal: () => void;
  loginModalOpen: boolean;
  loginModalTab: 'signin' | 'signup';

  // Backwards-compat: legacy user shape + old-style modal control
  user: AuthUser | null;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  requireAuth: (action?: string) => boolean;

  // Saved listings (kept on context for legacy consumers)
  savedListingIds: Set<string>;
  toggleSaveListing: (listingId: string, listingType?: 'mls' | 'precon') => Promise<void>;
  refreshSavedListings: () => Promise<void>;

  // Legacy signup-completion callbacks that are no-ops in the new flow
  agreeToVow: () => Promise<void>;
  updateProfile: (data: Partial<{ firstName: string; lastName: string; phone: string }>) => Promise<void>;
  completeGoogleProfile: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'signin' | 'signup'>('signup');
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data && !error) {
        setProfile(data as UserProfile);
        return data as UserProfile;
      }
    } catch (err) {
      console.error('[Auth] loadProfile failed:', err);
    }
    return null;
  }, []);

  const loadSaved = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('saved_listings')
        .select('listing_id')
        .eq('user_id', userId);
      setSavedListingIds(new Set((data || []).map((d: any) => d.listing_id as string)));
    } catch {
      setSavedListingIds(new Set());
    }
  }, []);

  // Subscribe to auth state — Supabase fires INITIAL_SESSION on mount,
  // then SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT / USER_UPDATED.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user || null;
      setAuthUser(u);
      if (u) {
        await loadProfile(u.id);
        await loadSaved(u.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const u = session?.user || null;
      setAuthUser(u);
      if (u && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        await loadProfile(u.id);
        await loadSaved(u.id);
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSavedListingIds(new Set());
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, loadSaved]);

  const showLoginModal = useCallback((tab: 'signin' | 'signup' = 'signup') => {
    setLoginModalTab(tab);
    setLoginModalOpen(true);
  }, []);

  const hideLoginModal = useCallback(() => setLoginModalOpen(false), []);

  // Auto-close on successful auth
  useEffect(() => {
    if (authUser && loginModalOpen) setLoginModalOpen(false);
  }, [authUser, loginModalOpen]);

  // ── Auth actions ────────────────────────────────────────────

  const signUp = useCallback(async (data: SignUpData): Promise<{ error: string | null }> => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            is_realtor: !!data.isRealtor,
          },
        },
      });

      if (signUpError) {
        if (/already registered|already exists|user already/i.test(signUpError.message)) {
          return { error: 'This email is already registered. Please sign in instead.' };
        }
        return { error: signUpError.message };
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          is_realtor: !!data.isRealtor,
          vow_agreed: true,
          vow_agreed_at: new Date().toISOString(),
        });
        if (profileError) console.error('[Auth] profile upsert failed:', profileError);
        await loadProfile(authData.user.id);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'An unexpected error occurred' };
    }
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login|invalid credentials/i.test(error.message)) {
        return { error: 'Invalid email or password. Please try again.' };
      }
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error('[Auth] Google sign-in failed:', error);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    setSavedListingIds(new Set());
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  // ── Saved listings ──────────────────────────────────────────

  const refreshSavedListings = useCallback(async () => {
    if (!authUser) { setSavedListingIds(new Set()); return; }
    await loadSaved(authUser.id);
  }, [authUser, loadSaved]);

  const toggleSaveListing = useCallback(async (listingId: string, listingType: 'mls' | 'precon' = 'mls') => {
    if (!authUser) { showLoginModal('signup'); return; }
    if (savedListingIds.has(listingId)) {
      await supabase.from('saved_listings').delete().eq('user_id', authUser.id).eq('listing_id', listingId);
      setSavedListingIds((prev) => { const next = new Set(prev); next.delete(listingId); return next; });
    } else {
      await supabase.from('saved_listings').insert({ user_id: authUser.id, listing_id: listingId, listing_type: listingType });
      setSavedListingIds((prev) => new Set(prev).add(listingId));
    }
  }, [authUser, savedListingIds, showLoginModal]);

  // ── Legacy shape ────────────────────────────────────────────

  const legacyUser: AuthUser | null = authUser ? {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? '',
    firstName: profile?.first_name ?? (authUser.user_metadata?.first_name as string) ?? '',
    lastName: profile?.last_name ?? (authUser.user_metadata?.last_name as string) ?? '',
    phone: profile?.phone ?? (authUser.user_metadata?.phone as string) ?? '',
    vowAgreed: profile?.vow_agreed ?? false,
    avatarUrl: profile?.avatar_url ?? (authUser.user_metadata?.avatar_url as string) ?? null,
    profileComplete: !!(profile?.phone && profile?.vow_agreed),
    isRealtor: profile?.is_realtor ?? false,
  } : null;

  const requireAuth = useCallback((_action?: string) => {
    if (authUser) return true;
    showLoginModal('signup');
    return false;
  }, [authUser, showLoginModal]);

  const setShowAuthModalCompat = useCallback((open: boolean) => {
    if (open) showLoginModal('signup');
    else hideLoginModal();
  }, [showLoginModal, hideLoginModal]);

  // Legacy no-ops preserved so imports don't crash
  const agreeToVow = useCallback(async () => {
    if (!authUser) return;
    await supabase.from('user_profiles').update({
      vow_agreed: true,
      vow_agreed_at: new Date().toISOString(),
    }).eq('id', authUser.id);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const updateProfile = useCallback(async (data: Partial<{ firstName: string; lastName: string; phone: string }>) => {
    if (!authUser) return;
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.firstName) update.first_name = data.firstName;
    if (data.lastName) update.last_name = data.lastName;
    if (data.phone) update.phone = data.phone;
    await supabase.from('user_profiles').update(update).eq('id', authUser.id);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  const completeGoogleProfile = useCallback(async (phone: string) => {
    if (!authUser) return;
    await supabase.from('user_profiles').update({ phone }).eq('id', authUser.id);
    await loadProfile(authUser.id);
  }, [authUser, loadProfile]);

  return (
    <AuthContext.Provider value={{
      // New API
      authUser,
      profile,
      loading,
      isAuthenticated: !!authUser,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      showLoginModal,
      hideLoginModal,
      loginModalOpen,
      loginModalTab,

      // Compat
      user: legacyUser,
      showAuthModal: loginModalOpen,
      setShowAuthModal: setShowAuthModalCompat,
      requireAuth,

      // Saved
      savedListingIds,
      toggleSaveListing,
      refreshSavedListings,

      // Legacy no-ops
      agreeToVow,
      updateProfile,
      completeGoogleProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
