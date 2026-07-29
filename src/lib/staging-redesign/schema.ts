import { STAGING_FAQS, TEAM_COPY } from './content';

const SITE_URL = 'https://condowizard.ca';

export function stagingBreadcrumbSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Staging', item: `${SITE_URL}/staging` },
    ],
  };
}

export function stagingServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Home Staging and Listing Preparation',
    serviceType: 'Home staging',
    description:
      'Professional condo and home staging for Toronto sellers, coordinated as part of the listing preparation process by CondoWizard.',
    areaServed: [
      { '@type': 'City', name: 'Toronto', containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario' } },
    ],
    url: `${SITE_URL}/staging`,
    provider: {
      '@type': 'RealEstateAgent',
      name: 'CondoWizard.ca',
      url: SITE_URL,
      telephone: TEAM_COPY.agent.phone,
      email: TEAM_COPY.agent.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1701 Avenue Rd',
        addressLocality: 'Toronto',
        addressRegion: 'ON',
        postalCode: 'M5M 3Y3',
        addressCountry: 'CA',
      },
      brand: {
        '@type': 'Organization',
        name: TEAM_COPY.agent.brokerage,
      },
      member: {
        '@type': 'Person',
        name: TEAM_COPY.agent.name,
        jobTitle: TEAM_COPY.agent.title,
        url: `${SITE_URL}/about`,
      },
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Toronto home sellers',
    },
  };
}

export function stagingPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: TEAM_COPY.agent.name,
    jobTitle: TEAM_COPY.agent.title,
    url: `${SITE_URL}/about`,
    telephone: TEAM_COPY.agent.phone,
    email: TEAM_COPY.agent.email,
    worksFor: {
      '@type': 'RealEstateAgent',
      name: TEAM_COPY.agent.brokerage,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1701 Avenue Rd',
        addressLocality: 'Toronto',
        addressRegion: 'ON',
        postalCode: 'M5M 3Y3',
        addressCountry: 'CA',
      },
    },
  };
}

export function stagingOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CondoWizard.ca',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: TEAM_COPY.agent.email,
      telephone: TEAM_COPY.agent.phone,
      contactType: 'customer service',
      areaServed: 'CA-ON',
      availableLanguage: ['English'],
    },
  };
}

export function stagingFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STAGING_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}
