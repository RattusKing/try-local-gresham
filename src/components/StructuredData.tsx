import Script from 'next/script'

interface LocalBusinessSchema {
  name: string
  description: string
  address: {
    streetAddress?: string
    addressLocality: string
    addressRegion: string
    postalCode?: string
    addressCountry: string
  }
  telephone?: string
  url?: string
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Try Local Gresham',
    description:
      'A digital marketplace connecting local people with local businesses in Gresham, Oregon.',
    url: 'https://trylocalor.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://trylocalor.com/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Try Local',
    description:
      'Building a stronger Gresham, one local business at a time. A community platform connecting residents with local businesses.',
    url: 'https://trylocalor.com',
    logo: 'https://trylocalor.com/logo.png',
    sameAs: [
      // Add social media links here when available
      // 'https://facebook.com/trylocalgresham',
      // 'https://twitter.com/trylocalgresham',
      // 'https://instagram.com/trylocalgresham',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gresham',
      addressRegion: 'OR',
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: 'Gresham',
      '@id': 'https://www.wikidata.org/wiki/Q203615',
    },
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function LocalBusinessSchema({ business }: { business: LocalBusinessSchema }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    address: {
      '@type': 'PostalAddress',
      ...business.address,
    },
    telephone: business.telephone,
    url: business.url,
  }

  return (
    <Script
      id={`business-schema-${business.name}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
