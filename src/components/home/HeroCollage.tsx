import type { HomeListing } from '@/lib/homepage-data';
import Link from 'next/link';

interface Props {
  listings: HomeListing[];
}

function short(n: number | null): string {
  if (!n) return '—';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default function HeroCollage({ listings }: Props) {
  const items = (listings || []).filter((l) => l.image).slice(0, 3);
  if (items.length === 0) return null;
  const [main, second, third] = items;

  return (
    <div className="relative hidden md:block h-full min-h-[420px]" aria-hidden={false}>
      <div className="grid grid-cols-6 grid-rows-6 gap-3 h-full">
        {main && (
          <Link href={main.href} className="col-span-4 row-span-6 relative overflow-hidden rounded-2xl border border-black/5 group">
            <img src={main.image!} alt={main.address} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4">
              <div className="flex items-center gap-1.5 text-[10px] text-white/85 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" aria-hidden />
                <span className="uppercase tracking-wider">Live MLS</span>
              </div>
              <p className="text-white text-lg font-semibold leading-tight">{short(main.price)}</p>
              <p className="text-white/80 text-xs mt-0.5 truncate">{main.address}</p>
              <p className="text-white/60 text-[11px] truncate">{main.neighborhood || 'Toronto'}</p>
            </div>
          </Link>
        )}
        {second && (
          <Link href={second.href} className="col-span-2 row-span-3 relative overflow-hidden rounded-2xl border border-black/5 group">
            <img src={second.image!} alt={second.address} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-sm font-semibold">{short(second.price)}</p>
              <p className="text-white/75 text-[11px] truncate">{second.neighborhood || 'Toronto'}</p>
            </div>
          </Link>
        )}
        {third && (
          <Link href={third.href} className="col-span-2 row-span-3 relative overflow-hidden rounded-2xl border border-black/5 group">
            <img src={third.image!} alt={third.address} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-sm font-semibold">{short(third.price)}</p>
              <p className="text-white/75 text-[11px] truncate">{third.neighborhood || 'Toronto'}</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
