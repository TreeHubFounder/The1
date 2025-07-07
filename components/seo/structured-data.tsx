
'use client';

import Script from 'next/script';
import { SITE_CONFIG, CONTACT_INFO } from '@/lib/constants';

interface StructuredDataProps {
  type?: 'WebSite' | 'Organization' | 'LocalBusiness';
}

export default function StructuredData({ type = 'WebSite' }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
    };

    switch (type) {
      case 'Organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.url,
          description: SITE_CONFIG.description,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: CONTACT_INFO.phoneNumber,
            contactType: 'customer service',
            email: CONTACT_INFO.email,
          },
          sameAs: [
            'https://twitter.com/treehub',
            'https://linkedin.com/company/treehub',
          ],
        };

      case 'LocalBusiness':
        return {
          ...baseData,
          '@type': 'LocalBusiness',
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.url,
          description: SITE_CONFIG.description,
          telephone: CONTACT_INFO.phoneNumber,
          email: CONTACT_INFO.email,
          areaServed: 'United States',
          serviceType: 'Tree Care Services',
          knowsAbout: [
            'Tree Removal',
            'Tree Trimming',
            'Arborist Services',
            'Emergency Tree Services',
            'Tree Equipment',
          ],
        };

      default:
        return {
          ...baseData,
          '@type': 'WebSite',
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.url,
          description: SITE_CONFIG.description,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        };
    }
  };

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  );
}
