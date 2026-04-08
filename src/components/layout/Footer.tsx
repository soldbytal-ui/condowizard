import Link from 'next/link';

const TORONTO = [
  { name: 'Downtown Core', slug: 'downtown-core' },
  { name: 'King West', slug: 'king-west' },
  { name: 'Liberty Village', slug: 'liberty-village' },
  { name: 'Queen West', slug: 'queen-west' },
  { name: 'Yorkville', slug: 'yorkville' },
  { name: 'The Annex', slug: 'the-annex' },
  { name: 'Midtown', slug: 'midtown' },
  { name: 'Yonge & Eglinton', slug: 'yonge-eglinton' },
  { name: 'Waterfront', slug: 'waterfront' },
  { name: 'CityPlace', slug: 'cityplace' },
  { name: 'Fort York', slug: 'fort-york' },
  { name: 'Leslieville', slug: 'leslieville' },
  { name: 'Riverside', slug: 'riverside' },
  { name: 'Danforth', slug: 'danforth' },
  { name: 'High Park', slug: 'high-park' },
  { name: 'Junction', slug: 'junction' },
  { name: 'Leaside', slug: 'leaside' },
];

const GTA = [
  { name: 'North York', slug: 'north-york' },
  { name: 'Scarborough', slug: 'scarborough' },
  { name: 'Etobicoke', slug: 'etobicoke' },
  { name: 'Mississauga', slug: 'mississauga' },
  { name: 'Vaughan', slug: 'vaughan' },
  { name: 'Richmond Hill', slug: 'richmond-hill' },
  { name: 'Markham', slug: 'markham' },
  { name: 'Oakville', slug: 'oakville' },
  { name: 'Burlington', slug: 'burlington' },
  { name: 'Hamilton', slug: 'hamilton' },
  { name: 'Brampton', slug: 'brampton' },
];

export default function Footer() {
  return (
    <footer className="bg-[#111827]">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-accent-blue font-bold text-xl">CONDO</span>
              <span className="text-white font-bold text-xl">WIZARD</span>
              <span className="text-gray-400 font-light text-sm">.CA</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Toronto&apos;s real estate marketplace. Search MLS listings, pre-construction condos, sold data &amp; market stats — all in one place.
            </p>
            <div className="mt-6 text-xs text-gray-500 leading-relaxed">
              <p className="font-medium text-gray-400">Tal Shelef, Sales Representative</p>
              <p>Rare Real Estate Inc., Brokerage</p>
              <p>1701 Avenue Rd, Toronto, ON M5M 3Y3</p>
              <p>647-890-4082 | Contact@condowizard.ca</p>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Toronto</h4>
            <ul className="space-y-1.5">
              {TORONTO.map((n) => (
                <li key={n.slug}>
                  <Link href={`/neighborhood/${n.slug}`} className="text-sm text-gray-400 hover:text-accent-blue transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">GTA</h4>
            <ul className="space-y-1.5">
              {GTA.map((n) => (
                <li key={n.slug}>
                  <Link href={`/neighborhood/${n.slug}`} className="text-sm text-gray-400 hover:text-accent-blue transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-1.5">
              <li><Link href="/search" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Buy</Link></li>
              <li><Link href="/search?tab=rent" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Rent</Link></li>
              <li><Link href="/sold" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Sold Data</Link></li>
              <li><Link href="/new-condos" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Pre-Construction</Link></li>
              <li><Link href="/market" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Market Stats</Link></li>
              <li><Link href="/developers" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Developers</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Blog</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Tal Shelef, Sales Representative</li>
              <li className="text-gray-400">Rare Real Estate Inc., Brokerage</li>
              <li className="text-gray-400">1701 Avenue Rd, Toronto, ON M5M 3Y3</li>
              <li className="text-gray-400">647-890-4082</li>
              <li className="text-gray-400">Contact@condowizard.ca</li>
              <li><Link href="/contact-us" className="text-accent-blue hover:underline transition-colors">Get in Touch &rarr;</Link></li>
            </ul>
            <div className="mt-8">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Popular</h4>
              <ul className="space-y-1.5">
                <li><Link href="/search?tab=sale&sortBy=newest" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">New Listings</Link></li>
                <li><Link href="/sold" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Recently Sold</Link></li>
                <li><Link href="/search?tab=precon" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Pre-Construction</Link></li>
                <li><Link href="/market" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Market Report</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700/50 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} CondoWizard.ca. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
              All pricing and project details are approximate and subject to change. Not intended to solicit buyers or sellers currently under contract.
              Governing law: Province of Ontario. PIPEDA compliant.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link href="/about" className="text-gray-400 hover:text-accent-blue transition-colors">About</Link>
            <Link href="/contact-us" className="text-gray-400 hover:text-accent-blue transition-colors">Contact</Link>
            <Link href="/blog" className="text-gray-400 hover:text-accent-blue transition-colors">Blog</Link>
            <span className="text-gray-700">|</span>
            <Link href="/terms" className="text-gray-400 hover:text-accent-blue transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-accent-blue transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
