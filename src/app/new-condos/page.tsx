import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { generateBreadcrumbSchema } from '@/lib/seo';
import NewCondosClient from '@/components/preconstruction/NewCondosClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'New Condos in Toronto | Pre-Construction Projects',
  description: 'Browse 600+ pre-construction condo, townhome, and detached projects across the Greater Toronto Area with interactive 3D map.',
  alternates: { canonical: 'https://condowizard.ca/new-condos' },
  openGraph: {
    title: 'New Condos in Toronto | Pre-Construction Projects',
    description: 'Browse 800+ pre-construction projects across the GTA with interactive 3D map.',
    url: 'https://condowizard.ca/new-condos',
    type: 'website',
  },
};

export default async function NewCondosPage() {
  const [{ data: projects }, { data: neighborhoods }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
      .neq('status', 'COMPLETED')
      .neq('status', 'ARCHIVED')
      .order('createdAt', { ascending: false }),
    supabase.from('neighborhoods').select('*').order('name'),
  ]);

  // Sort: featured first, then real images + data, then Unsplash, then no image
  const allProjects = (projects || []).sort((a: any, b: any) => {
    // Featured always first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    // Then real renderings (non-Unsplash images)
    const aReal = a.mainImageUrl && !a.mainImageUrl.includes('unsplash');
    const bReal = b.mainImageUrl && !b.mainImageUrl.includes('unsplash');
    if (aReal && !bReal) return -1;
    if (!aReal && bReal) return 1;
    // Among same image tier, prefer projects with more data
    const aData = (a.description ? 2 : 0) + (a.floors ? 1 : 0) + (a.priceMin ? 1 : 0);
    const bData = (b.description ? 2 : 0) + (b.floors ? 1 : 0) + (b.priceMin ? 1 : 0);
    if (aData !== bData) return bData - aData;
    // Then Unsplash images vs no image
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'New Condos', url: 'https://condowizard.ca/new-condos' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <NewCondosClient projects={allProjects} neighborhoods={neighborhoods || []} />
    </>
  );
}
