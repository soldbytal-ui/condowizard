'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // PKCE flow: Google/Supabase redirects here with `?code=…`. Explicitly
      // exchange it for a session; idempotent alongside detectSessionInUrl.
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        try { await supabase.auth.exchangeCodeForSession(code); } catch {}
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace('/'); return; }

      // Check whether we already have a completed profile.
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone, first_name, last_name')
        .eq('id', session.user.id)
        .single();

      const complete = !!(profile?.phone && profile?.first_name);
      if (!complete) {
        // Seed a profile row from Google metadata if none exists yet.
        if (!profile) {
          const meta = session.user.user_metadata || {};
          const fullName = String(meta.full_name || meta.name || '');
          const [firstName, ...rest] = fullName.split(' ');
          await supabase.from('user_profiles').upsert({
            id: session.user.id,
            first_name: firstName || 'User',
            last_name: rest.join(' ') || '',
            email: session.user.email || '',
            phone: '',
            avatar_url: (meta.avatar_url as string) || (meta.picture as string) || null,
            vow_agreed: false,
          });
        }
        router.replace('/onboarding');
      } else {
        router.replace('/');
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 mx-auto mb-3 border-2 border-accent-blue border-t-transparent rounded-full" />
        <p className="text-text-muted text-sm">Completing sign in…</p>
      </div>
    </div>
  );
}
