import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { formatPrice, CATEGORY_LABELS } from '@/lib/utils';

const NEIGHBORHOOD_FALLBACK_IMAGES: Record<string, string> = {
  'downtown-core': 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop',
  'king-west': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'liberty-village': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
  'queen-west': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'yorkville': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'the-annex': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'midtown': 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop',
  'yonge-eglinton': 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop',
  'north-york': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'scarborough': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'etobicoke': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
  'leaside': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'leslieville': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'riverside': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'danforth': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
  'high-park': 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&h=400&fit=crop',
  'junction': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
  'waterfront': 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop',
  'cityplace': 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop',
  'fort-york': 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop',
  'mississauga': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'vaughan': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'richmond-hill': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'markham': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
};

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1517090504332-6f2b5ec8ccc6?w=600&h=400&fit=crop';

type ProjectCardProps = {
  project: {
    slug: string;
    name: string;
    status: string;
    category: string;
    priceMin: number | null;
    priceMax: number | null;
    totalUnits: number | null;
    floors: number | null;
    estCompletion: string | null;
    mainImageUrl: string | null;
    neighborhood: { name: string; slug: string } | null;
    developer: { name: string } | null;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const imageUrl =
    project.mainImageUrl ||
    NEIGHBORHOOD_FALLBACK_IMAGES[project.neighborhood?.slug || ''] ||
    DEFAULT_FALLBACK;

  return (
    <Link href={`/properties/${project.slug}`} className="card group hover:border-accent-blue/30 transition-all">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${project.name} - Pre-Construction in ${project.neighborhood?.name || 'Toronto'}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {!project.mainImageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
            <span className="text-white/80 text-xs">{project.neighborhood?.name || 'Toronto'}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={project.status} />
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-text-muted text-xs font-medium px-2 py-1 rounded border border-border">
            {CATEGORY_LABELS[project.category] || project.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors leading-tight">
          {project.name}
        </h3>
        {project.developer && (
          <p className="text-sm text-text-muted mt-1">by {project.developer.name}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-accent-blue font-mono font-medium">
            {project.priceMin ? `From ${formatPrice(project.priceMin)}` : 'Contact for pricing'}
          </span>
          {project.neighborhood && (
            <span className="text-xs text-text-muted bg-surface2 px-2 py-1 rounded">
              {project.neighborhood.name}
            </span>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-text-muted">
          {project.totalUnits && <span><span className="font-mono text-text-primary">{project.totalUnits}</span> Units</span>}
          {project.floors && <span><span className="font-mono text-text-primary">{project.floors}</span> Floors</span>}
          {project.estCompletion && <span>Est. {project.estCompletion}</span>}
        </div>
      </div>
    </Link>
  );
}
