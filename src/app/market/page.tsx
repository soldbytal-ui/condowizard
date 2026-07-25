import Link from 'next/link';
import type { Metadata } from 'next';
import MarketDashboard from '@/components/market/MarketDashboard';

export const metadata: Metadata = {
  title: 'Toronto Resale Market Data | CondoWizard',
  description:
    'Live Toronto resale market data powered by Repliers — median sold price, days on market, sale-to-list, neighbourhood breakdown, and price band distribution.',
};

export default function MarketPage() {
  return (
    <div className="pt-14 bg-white min-h-screen">
      <div className="container-main py-10">
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-accent-blue">
            Home
          </Link>
          <span>/</span>
          <span className="text-text-primary">Market Data</span>
        </nav>

        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Toronto Resale Market</h1>
          <p className="text-text-muted mt-2">
            Live prices, activity, and time-on-market from MLS. Filter by property type, bedrooms, and window.
          </p>
        </div>

        <div className="mt-8">
          <MarketDashboard />
        </div>

        <div className="mt-12 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
          <p>
            Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082
          </p>
          <p className="mt-1">Market data provided by TRREB via Repliers. Deemed reliable but not guaranteed.</p>
        </div>
      </div>
    </div>
  );
}
