'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  vowAgreed: boolean;
  avatarUrl: string | null;
  profileComplete: boolean;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  agreeToVow: () => Promise<void>;
  updateProfile: (data: Partial<{ firstName: string; lastName: string; phone: string }>) => Promise<void>;
  completeGoogleProfile: (phone: string) => Promise<void>;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  requireAuth: (action?: string) => boolean;
  savedListingIds: Set<string>;
  toggleSaveListing: (listingId: string, listingType: 'mls' | 'precon') => Promise<void>;
  refreshSavedListings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  // Load user profile from Supabase
  const loadProfile = useCallback(async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setUser({
        id: userId,
        email: profile.email || email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        vowAgreed: profile.vow_agreed,
        avatarUrl: profile.avatar_url,
        profileComplete: !!(profile.phone && profile.vow_agreed),
      });
      return true;
    }
    return false;
  }, []);

  // Load saved listing IDs
  const refreshSavedListings = useCallback(async () => {
    if (!user?.id) { setSavedListingIds(new Set()); return; }
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id);
    setSavedListingIds(new Set((data || []).map((d: any) => d.listing_id)));
  }, [user?.id]);

  // Init: check session
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSavedListingIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Load saved listings when user changes
  useEffect(() => { refreshSavedListings(); }, [refreshSavedListings]);

  const signUp = async (data: SignUpData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) return { error: error.message };
    if (!authData.user) return { error: 'Sign up failed' };

    // Create profile
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authData.user.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
    });
    if (profileError) return { error: profileError.message };

    await loadProfile(authData.user.id, data.email);
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSavedListingIds(new Set());
  };

  const agreeToVow = async () => {
    if (!user) return;
    await supabase.from('user_profiles').update({
      vow_agreed: true,
      vow_agreed_at: new Date().toISOString(),
    }).eq('id', user.id);
    setUser((prev) => prev ? { ...prev, vowAgreed: true, profileComplete: !!(prev.phone && true) } : null);
    // Log activity
    await supabase.from('user_activity_log').insert({
      user_id: user.id, action: 'vow_agreement', metadata: { timestamp: new Date().toISOString() },
    });
  };

  const updateProfile = async (data: Partial<{ firstName: string; lastName: string; phone: string }>) => {
    if (!user) return;
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.firstName) update.first_name = data.firstName;
    if (data.lastName) update.last_name = data.lastName;
    if (data.phone) update.phone = data.phone;
    await supabase.from('user_profiles').update(update).eq('id', user.id);
    setUser((prev) => prev ? { ...prev, ...data } : null);
  };

  const completeGoogleProfile = async (phone: string) => {
    if (!user) return;
    await supabase.from('user_profiles').update({
      phone,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setUser((prev) => prev ? { ...prev, phone, profileComplete: prev.vowAgreed } : null);
  };

  const requireAuth = (action?: string) => {
    if (user?.profileComplete) return true;
    setShowAuthModal(true);
    return false;
  };

  const toggleSaveListing = async (listingId: string, listingType: 'mls' | 'precon') => {
    if (!user) { setShowAuthModal(true); return; }

    if (savedListingIds.has(listingId)) {
      await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', listingId);
      setSavedListingIds((prev) => { const next = new Set(prev); next.delete(listingId); return next; });
    } else {
      await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: listingId, listing_type: listingType });
      setSavedListingIds((prev) => new Set([...prev, listingId]));
      // Log
      await supabase.from('user_activity_log').insert({ user_id: user.id, action: 'save_listing', listing_id: listingId });
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, signUp, signIn, signInWithGoogle, signOut,
      agreeToVow, updateProfile, completeGoogleProfile,
      isAuthenticated: !!user?.profileComplete,
      showAuthModal, setShowAuthModal, requireAuth,
      savedListingIds, toggleSaveListing, refreshSavedListings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
