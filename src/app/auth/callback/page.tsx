'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          // Create profile from Google data
          const meta = session.user.user_metadata;
          await supabase.from('user_profiles').insert({
            id: session.user.id,
            first_name: meta?.full_name?.split(' ')[0] || meta?.name || 'User',
            last_name: meta?.full_name?.split(' ').slice(1).join(' ') || '',
            email: session.user.email || '',
            phone: '', // Will need to complete
            avatar_url: meta?.avatar_url || meta?.picture || null,
          });
        }
      }
      router.replace('/');
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-muted">Completing sign in...</p>
    </div>
  );
}
