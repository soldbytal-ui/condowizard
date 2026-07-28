import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { generateBreadcrumbSchema } from '@/lib/seo';
import NewCondosClient from '@/components/preconstruction/NewCondosClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'New Homes in the GTA | Pre-Construction Towns & Detached',
  description: 'Browse pre-construction townhomes, semis and detached homes across the Greater Toronto Area. Register for floor plans, pricing and priority access.',
  alternates: { canonical: 'https://condowizard.ca/new-homes' },
  openGraph: {
    title: 'New Homes in the GTA | Pre-Construction Towns & Detached',
    description: 'Browse pre-construction low-rise communities across the GTA with interactive map.',
    url: 'https://condowizard.ca/new-homes',
    type: 'website',
  },
};

export default async function NewHomesPage() {
  const [{ data: projects }, { data: neighborhoods }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
      .neq('status', 'COMPLETED')
      .neq('status', 'ARCHIVED')
      .eq('buildingType', 'HOME')
      .order('createdAt', { ascending: false }),
    supabase.from('neighborhoods').select('*').order('name'),
  ]);

  const allProjects = (projects || []).sort((a: any, b: any) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const aReal = a.mainImageUrl && !a.mainImageUrl.includes('unsplash');
    const bReal = b.mainImageUrl && !b.mainImageUrl.includes('unsplash');
    if (aReal && !bReal) return -1;
    if (!aReal && bReal) return 1;
    return 0;
  });

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'New Homes', url: 'https://condowizard.ca/new-homes' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <NewCondosClient projects={allProjects} neighborhoods={neighborhoods || []} />
    </>
  );
}
