export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

function toW3CDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
}

const NEIGHBORHOODS = [
  'downtown-core', 'king-west', 'liberty-village', 'queen-west', 'yorkville',
  'the-annex', 'midtown', 'yonge-eglinton', 'north-york', 'scarborough',
  'etobicoke', 'leaside', 'leslieville', 'riverside', 'danforth',
  'high-park', 'junction', 'waterfront', 'cityplace', 'fort-york',
  'mississauga', 'vaughan', 'richmond-hill', 'markham',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://condowizard.ca';
  const today = new Date().toISOString().split('T')[0];

  const [{ data: projects }, { data: neighborhoods }, { data: blogPosts }, { data: developers }, { data: preconProjects }] = await Promise.all([
    supabase.from('projects').select('slug, updatedAt'),
    supabase.from('neighborhoods').select('slug, updatedAt'),
    supabase.from('blog_posts').select('slug, updatedAt').not('publishedAt', 'is', null),
    supabase.from('developers').select('slug, updatedAt'),
    supabase.from('precon_projects').select('slug, updated_at').eq('is_published', true),
  ]);

  return [
    // Core pages
    { url: baseUrl, lastModified: today, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: today, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/sold`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/market`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/new-condos`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/developers`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact-us`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },

    // Pre-construction project pages (from original projects table)
    ...(projects || []).map((p: any) => ({
      url: `${baseUrl}/properties/${p.slug}`,
      lastModified: toW3CDate(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // Pre-construction projects (from new precon_projects table)
    ...(preconProjects || []).map((p: any) => ({
      url: `${baseUrl}/projects/${p.slug}`,
      lastModified: toW3CDate(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // Neighborhood pages
    ...NEIGHBORHOODS.map((slug) => ({
      url: `${baseUrl}/neighborhood/${slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // Legacy neighborhood rewrites
    ...(neighborhoods || []).map((n: any) => ({
      url: `${baseUrl}/new-condos-${n.slug}`,
      lastModified: toW3CDate(n.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),

    // Blog posts
    ...(blogPosts || []).map((bp: any) => ({
      url: `${baseUrl}/blog/${bp.slug}`,
      lastModified: toW3CDate(bp.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),

    // Developer pages
    ...(developers || []).map((d: any) => ({
      url: `${baseUrl}/developers/${d.slug}`,
      lastModified: toW3CDate(d.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
