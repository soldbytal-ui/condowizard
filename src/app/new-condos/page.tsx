export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import { generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'New Condos in Toronto | Browse All Pre-Construction Projects',
  description: 'Browse 200+ new pre-construction condo projects across the Greater Toronto Area. Filter by neighborhood, price, status, and category.',
  alternates: {
    canonical: 'https://condowizard.ca/new-condos',
  },
  openGraph: {
    title: 'New Condos in Toronto | Browse All Pre-Construction Projects',
    description: 'Browse 200+ new pre-construction condo projects across the Greater Toronto Area.',
    url: 'https://condowizard.ca/new-condos',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New Condos in Toronto | Browse All Pre-Construction Projects',
    description: 'Browse 200+ new pre-construction condo projects across the Greater Toronto Area.',
  },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function NewCondosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, neighborhood, status, category, sort } = params;

  let projectQuery = supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)');

  if (q) projectQuery = projectQuery.ilike('name', `%${q}%`);
  if (status) projectQuery = projectQuery.eq('status', status);
  if (category) projectQuery = projectQuery.eq('category', category);

  if (sort === 'price_asc') projectQuery = projectQuery.order('priceMin', { ascending: true });
  else if (sort === 'price_desc') projectQuery = projectQuery.order('priceMin', { ascending: false });
  else if (sort === 'units_desc') projectQuery = projectQuery.order('totalUnits', { ascending: false });
  else projectQuery = projectQuery.order('createdAt', { ascending: false });

  const [{ data: allProjects }, { data: neighborhoods }] = await Promise.all([
    projectQuery,
    supabase.from('neighborhoods').select('*').order('name'),
  ]);

  // Filter by neighborhood slug in JS since it's a relation filter
  let projects = allProjects || [];
  if (neighborhood) {
    projects = projects.filter((p: any) => p.neighborhood?.slug === neighborhood);
  }
  // Sort so projects with their own photos appear first
  projects = projects.sort((a: any, b: any) => {
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });
  const total = projects.length;

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'New Condos', url: 'https://condowizard.ca/new-condos' },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    <div className="container-main pt-24 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
          New Condos in Toronto
        </h1>
        <p className="text-text-muted mt-2">
          {total} {total === 1 ? 'project' : 'projects'} available across the Greater Toronto Area
        </p>
      </div>

      <Suspense fallback={<div className="h-20" />}>
        <ProjectFilters neighborhoods={neighborhoods || []} />
      </Suspense>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-text-primary mb-2">No projects found</h3>
          <p className="text-text-muted">Try adjusting your filters</p>
        </div>
      )}
    </div>
    </>
  );
}
