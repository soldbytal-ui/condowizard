import Link from 'next/link';
import type { CtaButton } from '@/lib/blog-content';

interface Props {
  kind?: 'primary' | 'quiet';
  heading: string;
  body: string;
  buttons: CtaButton[];
}

export default function CtaBlock({ kind = 'primary', heading, body, buttons }: Props) {
  const isQuiet = kind === 'quiet';
  return (
    <aside
      aria-label={heading}
      className={`my-10 rounded-2xl p-6 md:p-8 print:hidden ${
        isQuiet
          ? 'border border-border bg-surface2/60'
          : 'border border-accent-blue/25 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-blue/5'
      }`}
    >
      <h3 className="text-xl md:text-2xl font-semibold text-text-primary leading-tight">
        {heading}
      </h3>
      <p className="mt-2 text-[15px] text-text-muted leading-relaxed max-w-2xl">{body}</p>
      {buttons.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          {buttons.map((btn, i) => {
            const style =
              btn.style === 'secondary'
                ? 'border border-border bg-surface text-text-primary hover:border-accent-blue/40 hover:bg-surface2'
                : 'bg-accent-blue text-white hover:brightness-110';
            return (
              <Link
                key={i}
                href={btn.href}
                className={`inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold transition ${style}`}
              >
                {btn.label}
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
