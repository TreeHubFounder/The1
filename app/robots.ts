
import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/jobs',
          '/professionals',
          '/equipment',
          '/emergency',
          '/about',
          '/contact',
          '/safety',
          '/certifications',
          '/training',
          '/help',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/market-conquest/',
          '/auth/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/jobs',
          '/professionals',
          '/equipment',
          '/emergency',
          '/about',
          '/contact',
          '/safety',
          '/certifications',
          '/training',
          '/help',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/market-conquest/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
