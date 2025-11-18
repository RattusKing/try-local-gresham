import Script from 'next/script'
import { Business, Product } from '@/lib/types'

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Try Local Gresham',
    description:
      'A digital marketplace connecting local people with local businesses in Gresham, Oregon.',
    url: 'https://try-local.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://try-local.com/?search={search_term_string}',
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
    url: 'https://try-local.com',
    logo: 'https://try-local.com/logo.png',
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

export function LocalBusinessSchema({ business }: { business: Business }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description || `${business.name} - Local business in Gresham, Oregon`,
    image: business.cover || '/assets/gresham.jpg',
    telephone: business.phone,
    url: business.website || `https://try-local.com/business/${business.id}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gresham',
      addressRegion: 'OR',
      addressCountry: 'US',
      streetAddress: business.neighborhood || 'Gresham',
    },
    ...(business.map ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: business.map.split(',')[0]?.trim(),
        longitude: business.map.split(',')[1]?.trim(),
      },
    } : {}),
    openingHours: business.hours || undefined,
    priceRange: '$$',
    ...(business.averageRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: business.averageRating.toString(),
        reviewCount: business.reviewCount?.toString() || '0',
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
    paymentAccepted: 'Cash, Credit Card, Debit Card',
    currenciesAccepted: 'USD',
    areaServed: {
      '@type': 'City',
      name: 'Gresham',
      '@id': 'https://www.wikidata.org/wiki/Q972989',
    },
  }

  return (
    <Script
      id={`business-schema-${business.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ProductSchema({ product, business }: { product: Product; business: Business }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} from ${business.name}`,
    image: product.image || business.cover || '/assets/gresham.jpg',
    brand: {
      '@type': 'Brand',
      name: business.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'LocalBusiness',
        name: business.name,
      },
      ...(product.trackInventory && product.stockQuantity !== undefined ? {
        inventoryLevel: {
          '@type': 'QuantitativeValue',
          value: product.stockQuantity.toString(),
        },
      } : {}),
    },
    category: product.category || 'General',
  }

  return (
    <Script
      id={`product-schema-${product.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://try-local.com${item.url}`,
    })),
  }

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
