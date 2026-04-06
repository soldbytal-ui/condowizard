export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

// Normalize Supabase timestamps to valid W3C Datetime (YYYY-MM-DD)
function toW3CDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://condowizard.ca';
  const today = new Date().toISOString().split('T')[0];

  const [{ data: projects }, { data: neighborhoods }, { data: blogPosts }, { data: developers }] = await Promise.all([
    supabase.from('projects').select('slug, updatedAt'),
    supabase.from('neighborhoods').select('slug, updatedAt'),
    supabase.from('blog_posts').select('slug, updatedAt').not('publishedAt', 'is', null),
    supabase.from('developers').select('slug, updatedAt'),
  ]);

  return [
    { url: baseUrl, lastModified: today, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/new-condos`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/developers`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact-us`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    ...(projects || []).map((p: any) => ({
      url: `${baseUrl}/properties/${p.slug}`,
      lastModified: toW3CDate(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(neighborhoods || []).map((n: any) => ({
      url: `${baseUrl}/new-condos-${n.slug}`,
      lastModified: toW3CDate(n.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(blogPosts || []).map((bp: any) => ({
      url: `${baseUrl}/blog/${bp.slug}`,
      lastModified: toW3CDate(bp.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...(developers || []).map((d: any) => ({
      url: `${baseUrl}/developers/${d.slug}`,
      lastModified: toW3CDate(d.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
