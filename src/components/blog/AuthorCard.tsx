import Link from 'next/link';

interface Props {
  name?: string;
  imageSrc?: string | null;
  variant?: 'inline' | 'full';
}

const DEFAULT_NAME = 'Tal Shelef';
const TITLE = 'Sales Representative';
const BROKERAGE = 'Rare Real Estate Inc., Brokerage';
const BIO =
  'Tal Shelef is a Toronto Sales Representative focused on the Greater Toronto Area pre-construction and resale condominium markets. Tal writes CondoWizard\'s buyer guides for first-time buyers, investors, and end-users navigating new-build developments across Toronto.';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AuthorCard({ name, imageSrc, variant = 'full' }: Props) {
  const displayName = (name || DEFAULT_NAME).split(',')[0].trim();

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3">
        <Avatar name={displayName} imageSrc={imageSrc} size={40} />
        <div>
          <p className="text-sm font-medium text-text-primary leading-tight">{displayName}</p>
          <p className="text-xs text-text-muted leading-tight">
            {TITLE} · {BROKERAGE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label={`About the author, ${displayName}`}
      className="my-10 rounded-2xl border border-border bg-surface p-6 md:p-7"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <Avatar name={displayName} imageSrc={imageSrc} size={72} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            Written by
          </p>
          <p className="mt-1 text-lg font-semibold text-text-primary">{displayName}</p>
          <p className="text-sm text-text-muted">
            {TITLE} · {BROKERAGE}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-text-primary/90">{BIO}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/contact-us"
              className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
            >
              Contact Tal
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 font-medium text-text-primary hover:border-accent-blue/40 hover:bg-surface2 transition"
            >
              More articles by Tal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Avatar({
  name,
  imageSrc,
  size,
}: {
  name: string;
  imageSrc?: string | null;
  size: number;
}) {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        className="rounded-full object-cover border border-border shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-blue/10 font-semibold text-accent-blue"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials(name)}
    </span>
  );
}
