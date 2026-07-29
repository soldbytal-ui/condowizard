import Link from 'next/link';

interface Props {
  name: string;
  slug: string;
  blurb: string;
  imageUrl: string | null;
  active: number;
  medianPrice: number | null;
  toneClass?: string;
}

function fmtPrice(n: number | null): string {
  if (!n) return '—';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}K`;
}

export default function NeighbourhoodCard({ name, slug, blurb, imageUrl, active, medianPrice, toneClass }: Props) {
  return (
    <Link
      href={`/neighborhood/${slug}`}
      className="group block relative overflow-hidden rounded-xl border border-border bg-text-primary aspect-[3/4]"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name}, Toronto`}
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-[1.04] group-hover:opacity-100 transition-all duration-500"
          loading="lazy"
        />
      ) : (
        <div className={`absolute inset-0 ${toneClass || 'bg-gradient-to-br from-[#1A2C4B] to-[#0F1D33]'}`} aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden />
      <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
        <p className="font-serif text-2xl font-bold leading-tight">{name}</p>
        <p className="text-xs text-white/75 mt-1 line-clamp-2">{blurb}</p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-white/85">
          <span>{active > 0 ? `${active.toLocaleString('en-CA')} active` : 'View neighbourhood'}</span>
          {medianPrice ? <span aria-hidden>·</span> : null}
          {medianPrice ? <span>Median {fmtPrice(medianPrice)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
