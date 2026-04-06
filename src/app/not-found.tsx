import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist. Browse our pre-construction condo listings in Toronto.',
};

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="text-8xl font-bold text-accent-blue/20 mb-4">404</div>
      <h1 className="text-3xl md:text-4xl font-semibold text-text-primary mb-4">
        Page Not Found
      </h1>
      <p className="text-text-muted max-w-md mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Browse our latest pre-construction developments below.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-accent-blue text-white font-medium rounded-xl hover:bg-accent-blue/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/new-condos"
          className="px-6 py-3 border border-border text-text-primary font-medium rounded-xl hover:border-accent-blue/30 transition-colors"
        >
          Browse New Condos
        </Link>
        <Link
          href="/developers"
          className="px-6 py-3 border border-border text-text-primary font-medium rounded-xl hover:border-accent-blue/30 transition-colors"
        >
          View Developers
        </Link>
      </div>
    </div>
  );
}
