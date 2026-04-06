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
              <span className="text-accent-blue font-semibold text-xl">CONDO</span>
              <span className="text-white font-semibold text-xl">WIZARD</span>
              <span className="text-gray-400 font-light text-sm">.CA</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Toronto&apos;s premier marketplace for pre-construction condos. Access 200+ new developments across 24+ neighborhoods from Downtown Core to the Greater Toronto Area.
            </p>
            <div className="mt-6 text-xs text-gray-500 leading-relaxed">
              <p>Tal Shelef, Sales Representative</p>
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
                  <Link href={`/new-condos-${n.slug}`} className="text-sm text-gray-400 hover:text-accent-blue transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">GTA</h4>
            <ul className="space-y-1.5">
              {GTA.map((n) => (
                <li key={n.slug}>
                  <Link href={`/new-condos-${n.slug}`} className="text-sm text-gray-400 hover:text-accent-blue transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-1.5">
              <li><Link href="/new-condos" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">All Properties</Link></li>
              <li><Link href="/developers" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Developers</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Market Insights Blog</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">About Us</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">1701 Avenue Rd, Toronto, ON M5M 3Y3</li>
              <li className="text-gray-400">647-890-4082</li>
              <li className="text-gray-400">Contact@condowizard.ca</li>
              <li><Link href="/contact-us" className="text-accent-blue hover:underline transition-colors">Get in Touch &rarr;</Link></li>
            </ul>
            <div className="mt-8">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Popular Searches</h4>
              <ul className="space-y-1.5">
                <li><Link href="/new-condos?category=LUXURY" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Luxury Condos</Link></li>
                <li><Link href="/new-condos?status=PRE_LAUNCH" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Pre-Launch Projects</Link></li>
                <li><Link href="/new-condos?status=UNDER_CONSTRUCTION" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Under Construction</Link></li>
                <li><Link href="/new-condos?sort=price_asc" className="text-sm text-gray-400 hover:text-accent-blue transition-colors">Most Affordable</Link></li>
              </ul>
            </div>
          </div>
        </div>
        {/* Copyright + Legal Links */}
        <div className="border-t border-gray-700/50 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} CondoWizard.ca. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage. All pricing and project details are approximate and subject to change.</p>
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
