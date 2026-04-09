'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SavedListing {
  id: string;
  listing_id: string;
  listing_type: string;
  created_at: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters_json: any;
  alert_frequency: string;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  listing_id: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, signOut, setShowAuthModal, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('saved');
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      supabase.from('saved_listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]).then(([sl, ss, al]) => {
      setSavedListings(sl.data || []);
      setSavedSearches(ss.data || []);
      setRecentActivity(al.data || []);
      setLoading(false);
    });
  }, [user?.id]);

  if (authLoading) return <div className="pt-20 text-center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-16 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">My Dashboard</h1>
        <p className="text-text-muted mb-6">Sign in to access your dashboard, saved listings, and search alerts.</p>
        <button onClick={() => setShowAuthModal(true)} className="bg-accent-blue text-white px-8 py-3 rounded-lg font-medium">Sign In / Register</button>
      </div>
    );
  }

  const tabs = [
    { key: 'saved', label: 'Saved Listings', count: savedListings.length },
    { key: 'searches', label: 'Saved Searches', count: savedSearches.length },
    { key: 'activity', label: 'Recently Viewed', count: recentActivity.filter((a) => a.action === 'view_listing').length },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="pt-16 bg-bg min-h-screen">
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Dashboard</h1>
            <p className="text-text-muted text-sm mt-1">Welcome back, {user?.firstName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <span className="text-accent-blue font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-text-primary">{user?.firstName} {user?.lastName}</p>
              <p className="text-text-muted text-xs">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted'}`}>
              {t.label} {'count' in t && t.count !== undefined ? <span className="ml-1 text-xs bg-surface2 px-1.5 py-0.5 rounded-full">{t.count}</span> : null}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading...</div>
        ) : (
          <>
            {tab === 'saved' && (
              <div>
                {savedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    <h3 className="text-lg font-semibold text-text-primary">No saved listings yet</h3>
                    <p className="text-sm text-text-muted mt-1">Click the heart icon on any listing to save it here</p>
                    <Link href="/search" className="inline-block mt-4 bg-accent-blue text-white px-6 py-2 rounded-lg text-sm font-medium">Browse Listings</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedListings.map((sl) => (
                      <div key={sl.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-border">
                        <div>
                          <Link href={sl.listing_type === 'mls' ? `/listing/${sl.listing_id}` : `/projects/${sl.listing_id}`} className="font-medium text-text-primary hover:text-accent-blue">
                            {sl.listing_type === 'mls' ? `MLS# ${sl.listing_id}` : sl.listing_id}
                          </Link>
                          <p className="text-xs text-text-muted">Saved {new Date(sl.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={async () => {
                          await supabase.from('saved_listings').delete().eq('id', sl.id);
                          setSavedListings((prev) => prev.filter((s) => s.id !== sl.id));
                        }} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'searches' && (
              <div>
                {savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-text-primary">No saved searches</h3>
                    <p className="text-sm text-text-muted mt-1">Use the &quot;Get Alerts&quot; button on the search page to save a search</p>
                    <Link href="/search" className="inline-block mt-4 bg-accent-blue text-white px-6 py-2 rounded-lg text-sm font-medium">Search Listings</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSearches.map((ss) => (
                      <div key={ss.id} className="bg-white p-4 rounded-xl border border-border">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-text-primary">{ss.name || 'Untitled Search'}</h4>
                          <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full text-text-muted">{ss.alert_frequency}</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{JSON.stringify(ss.filters_json).slice(0, 80)}...</p>
                        <div className="flex gap-3 mt-2">
                          <Link href={`/search?${new URLSearchParams(ss.filters_json).toString()}`} className="text-xs text-accent-blue hover:underline">Run Search</Link>
                          <button onClick={async () => {
                            await supabase.from('user_saved_searches').delete().eq('id', ss.id);
                            setSavedSearches((prev) => prev.filter((s) => s.id !== ss.id));
                          }} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'activity' && (
              <div className="space-y-2">
                {recentActivity.filter((a) => a.action === 'view_listing').length === 0 ? (
                  <p className="text-center py-12 text-text-muted">No recently viewed listings</p>
                ) : (
                  recentActivity.filter((a) => a.action === 'view_listing').map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border">
                      <Link href={`/listing/${a.listing_id}`} className="text-sm font-medium text-text-primary hover:text-accent-blue">MLS# {a.listing_id}</Link>
                      <span className="text-xs text-text-muted">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div className="max-w-md space-y-4">
                <div className="bg-white p-6 rounded-xl border border-border space-y-3">
                  <h3 className="font-semibold text-text-primary">Profile</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-text-muted">First Name</label><p className="text-sm font-medium">{user?.firstName}</p></div>
                    <div><label className="text-xs text-text-muted">Last Name</label><p className="text-sm font-medium">{user?.lastName}</p></div>
                  </div>
                  <div><label className="text-xs text-text-muted">Email</label><p className="text-sm">{user?.email}</p></div>
                  <div><label className="text-xs text-text-muted">Phone</label><p className="text-sm">{user?.phone}</p></div>
                  <div><label className="text-xs text-text-muted">VOW Terms</label><p className="text-sm text-accent-green">Agreed</p></div>
                </div>
                <button onClick={signOut} className="w-full py-2.5 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">Sign Out</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
