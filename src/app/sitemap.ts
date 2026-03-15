import { MetadataRoute } from 'next';
import { toolCategories } from '@/libs/tools-data';

// Required for static export (GitHub Pages)
export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://devpockit.hypkey.com';

// Helper to ensure trailing slash (required for GitHub Pages)
const withTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = toolCategories.map((category) => ({
    url: `${BASE_URL}/tools/${category.id}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Individual tool pages
  const toolPages: MetadataRoute.Sitemap = toolCategories.flatMap((category) =>
    category.tools.map((tool) => ({
      url: withTrailingSlash(`${BASE_URL}${tool.path}`),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }))
  );

  return [...staticPages, ...categoryPages, ...toolPages];
}

