export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'CondoWizard.ca',
    description: 'Toronto real estate marketplace — MLS listings, pre-construction condos, sold data & market stats. Operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.',
    url: 'https://condowizard.ca',
    logo: 'https://condowizard.ca/og-image.png',
    image: 'https://condowizard.ca/og-image.png',
    email: 'Contact@condowizard.ca',
    telephone: '647-890-4082',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1701 Avenue Rd',
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      postalCode: 'M5M 3Y3',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 43.7275,
      longitude: -79.4127,
    },
    areaServed: [
      { '@type': 'City', name: 'Toronto', containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario' } },
      { '@type': 'City', name: 'Mississauga' },
      { '@type': 'City', name: 'Vaughan' },
      { '@type': 'City', name: 'Markham' },
    ],
    priceRange: '$400K - $5M+',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    sameAs: [],
    knowsAbout: ['pre-construction condos', 'Toronto real estate', 'new construction', 'luxury condominiums', 'GTA developments'],
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CondoWizard.ca',
    url: 'https://condowizard.ca',
    logo: 'https://condowizard.ca/og-image.png',
    description: 'Greater Toronto Area\'s most comprehensive pre-construction condo marketplace connecting buyers and investors with 200+ new developments.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1701 Avenue Rd',
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      postalCode: 'M5M 3Y3',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'Contact@condowizard.ca',
      contactType: 'customer service',
      availableLanguage: ['English', 'French'],
    },
    sameAs: [],
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CondoWizard.ca',
    url: 'https://condowizard.ca',
    description: 'Toronto real estate marketplace — search MLS listings, pre-construction condos, sold data & market stats. Live TRREB data with AI-powered search.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://condowizard.ca/search?neighborhood={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateItemListSchema(items: { name: string; url: string; position: number }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

export function generateRealEstateListingSchema(project: {
  name: string;
  slug: string;
  address?: string | null;
  description?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  mainImageUrl?: string | null;
  totalUnits?: number | null;
  floors?: number | null;
  estCompletion?: string | null;
  neighborhood?: { name: string } | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    description: project.description?.slice(0, 300) || `${project.name} - New pre-construction development in Toronto`,
    url: `https://condowizard.ca/properties/${project.slug}`,
    ...(project.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: project.address,
        addressLocality: project.neighborhood?.name || 'Toronto',
        addressRegion: 'ON',
        addressCountry: 'CA',
      },
    }),
    ...(project.priceMin && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: project.priceMin,
        ...(project.priceMax && { highPrice: project.priceMax }),
        priceCurrency: 'CAD',
        availability: 'https://schema.org/PreSale',
      },
    }),
    ...(project.mainImageUrl && { image: project.mainImageUrl }),
    ...(project.totalUnits && { numberOfAccommodationUnits: project.totalUnits }),
    ...(project.floors && { numberOfFloors: project.floors }),
  };
}

export function generateArticleSchema(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  author: string;
  featuredImage?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: `https://condowizard.ca/blog/${post.slug}`,
    ...(post.excerpt && { description: post.excerpt }),
    ...(post.publishedAt && { datePublished: typeof post.publishedAt === 'string' ? post.publishedAt : post.publishedAt.toISOString() }),
    ...(post.updatedAt && { dateModified: typeof post.updatedAt === 'string' ? post.updatedAt : post.updatedAt.toISOString() }),
    ...(post.featuredImage && { image: post.featuredImage }),
    author: {
      '@type': 'Person',
      name: post.author || 'CondoWizard.ca',
      url: 'https://condowizard.ca/about',
      jobTitle: 'Real Estate Market Analyst',
      worksFor: {
        '@type': 'Organization',
        name: 'CondoWizard.ca',
        url: 'https://condowizard.ca',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'CondoWizard.ca',
      url: 'https://condowizard.ca',
      logo: {
        '@type': 'ImageObject',
        url: 'https://condowizard.ca/og-image.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://condowizard.ca/blog/${post.slug}`,
    },
  };
}

export function generateHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Buy a Pre-Construction Condo in Toronto',
    description: 'A four-step guide to purchasing a pre-construction condo in the Greater Toronto Area, from browsing to move-in.',
    totalTime: 'P24M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Browse Projects',
        text: 'Explore 200+ pre-construction developments across the Greater Toronto Area with detailed specs, pricing, and floor plans.',
        url: 'https://condowizard.ca/new-condos',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Reserve Your Unit',
        text: 'Secure your preferred unit with a reservation deposit, typically 5%-15%. Lock in pre-construction pricing before public launch.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Track Construction',
        text: 'Monitor construction milestones and make scheduled deposit payments following Ontario deposit structures, typically 15-20% total before completion.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Close and Move In',
        text: 'Receive your keys to a brand-new home. Close with a mortgage for the remaining balance at completion.',
      },
    ],
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
