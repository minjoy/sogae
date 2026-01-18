import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/xq9k2m-admin-panel/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
