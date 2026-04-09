import Link from 'next/link';

export default function ListingNotFound() {
  return (
    <div className="pt-20 pb-16 container-main text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-surface2 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Listing Not Found</h1>
        <p className="text-text-muted mb-6">
          This listing may have been removed, sold, or is no longer active on the MLS.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="bg-accent-blue text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors">
            Back to Search
          </Link>
          <Link href="/" className="border border-border text-text-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:border-accent-blue/30 transition-colors">
            Go to Homepage
          </Link>
        </div>
        <p className="text-xs text-text-muted mt-8">
          Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 647-890-4082
        </p>
      </div>
    </div>
  );
}
