'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string | null;
  filters: Record<string, unknown>;
  alert_frequency: 'daily' | 'weekly' | 'off' | string;
  is_active: boolean;
  last_notified_at: string | null;
  created_at: string;
}

function generateSearchName(filters: any): string {
  const parts: string[] = [];
  if (filters?.class === 'condo') parts.push('Condos');
  else if (filters?.class === 'residential') parts.push('Houses');
  else if (filters?.class) parts.push(String(filters.class));
  if (filters?.minBedrooms || filters?.bedsMin) parts.push(`${filters.minBedrooms || filters.bedsMin}+ bed`);
  if (filters?.neighborhood) parts.push(`in ${filters.neighborhood}`);
  if (filters?.minPrice || filters?.maxPrice) {
    const min = filters.minPrice ? `$${Math.round(filters.minPrice / 1000)}K` : '';
    const max = filters.maxPrice ? `$${Math.round(filters.maxPrice / 1000)}K` : '';
    if (min && max) parts.push(`${min}–${max}`);
    else if (min) parts.push(`from ${min}`);
    else if (max) parts.push(`under ${max}`);
  }
  return parts.length ? parts.join(', ') : 'All properties';
}

export function useSavedSearches() {
  const { authUser, isAuthenticated, showLoginModal } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearchRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { setSavedSearches([]); return; }
    setLoading(true);
    supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSavedSearches((data as any) || []);
        setLoading(false);
      });
  }, [authUser]);

  const saveSearch = useCallback(async (filters: any, name?: string) => {
    if (!isAuthenticated || !authUser) {
      showLoginModal('signup');
      return { data: null, error: 'not signed in' };
    }
    const finalName = name || generateSearchName(filters);
    const { data, error } = await supabase.from('saved_searches').insert({
      user_id: authUser.id,
      name: finalName,
      filters,
      alert_frequency: 'daily',
      is_active: true,
    }).select().single();
    if (data) setSavedSearches((prev) => [data as any, ...prev]);
    return { data, error };
  }, [authUser, isAuthenticated, showLoginModal]);

  const deleteSearch = useCallback(async (id: string) => {
    if (!authUser) return;
    await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', authUser.id);
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  }, [authUser]);

  const toggleAlert = useCallback(async (id: string, isActive: boolean) => {
    if (!authUser) return;
    await supabase.from('saved_searches').update({ is_active: isActive }).eq('id', id).eq('user_id', authUser.id);
    setSavedSearches((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));
  }, [authUser]);

  const setFrequency = useCallback(async (id: string, alert_frequency: SavedSearchRow['alert_frequency']) => {
    if (!authUser) return;
    await supabase.from('saved_searches').update({ alert_frequency }).eq('id', id).eq('user_id', authUser.id);
    setSavedSearches((prev) => prev.map((s) => (s.id === id ? { ...s, alert_frequency } : s)));
  }, [authUser]);

  return { savedSearches, loading, saveSearch, deleteSearch, toggleAlert, setFrequency };
}
