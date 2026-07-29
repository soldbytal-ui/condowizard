'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Thin wrapper around the saved_listings table. Reads from the same shared
// AuthContext set so the heart-icon state stays consistent across the app.
export function useSavedListings() {
  const {
    authUser,
    isAuthenticated,
    showLoginModal,
    savedListingIds,
    toggleSaveListing,
    refreshSavedListings,
  } = useAuth();
  const [rows, setRows] = useState<Array<{ listing_id: string; listing_type: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { setRows([]); return; }
    setLoading(true);
    supabase
      .from('saved_listings')
      .select('listing_id, listing_type, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows((data as any) || []);
        setLoading(false);
      });
  }, [authUser, savedListingIds]);

  const toggleSave = useCallback(async (listingId: string, listingType: 'mls' | 'precon' = 'mls') => {
    if (!isAuthenticated) {
      showLoginModal('signup');
      return;
    }
    await toggleSaveListing(listingId, listingType);
  }, [isAuthenticated, showLoginModal, toggleSaveListing]);

  const isSaved = useCallback((id: string) => savedListingIds.has(id), [savedListingIds]);

  return {
    savedIds: savedListingIds,
    savedRows: rows,
    savedCount: savedListingIds.size,
    isSaved,
    toggleSave,
    refresh: refreshSavedListings,
    loading,
  };
}
