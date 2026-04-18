'use client';

// Tenants list is embedded in the main platform dashboard.
// This route redirects there.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/platform'); }, [router]);
  return null;
}
