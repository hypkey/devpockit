import { MetadataRoute } from 'next';

// Required for static export (GitHub Pages)
export const dynamic = 'force-static';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://devpockit.hypkey.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/_next/static/',
        disallow: ['/_next/data/', '/_next/image', '/api/', '/tools/*/*/*/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
