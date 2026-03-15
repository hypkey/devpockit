import { getCategoryById, getToolById, getTools } from '@/libs/tools-data';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface ToolPageProps {
  params: Promise<{
    category: string;
    toolId: string;
  }>;
}

// Disallow dynamic params that weren't generated at build time
// This ensures invalid routes show 404 instead of causing errors
export const dynamicParams = false;

// Force static generation (required for static export)
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const tools = getTools();
  return tools.map((tool) => ({
    category: tool.category,
    toolId: tool.id,
  }));
}

// Generate SEO-optimized metadata for each tool
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolId, category } = await params;
  const tool = getToolById(toolId);
  const categoryData = getCategoryById(category);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  // Generate tool-specific keywords
  const toolKeywords = [
    tool.name.toLowerCase(),
    `online ${tool.name.toLowerCase()}`,
    `free ${tool.name.toLowerCase()}`,
    `${tool.name.toLowerCase()} online`,
    `${tool.name.toLowerCase()} tool`,
    categoryData?.name.toLowerCase() || category,
    'developer tools',
    'devpockit',
  ];

  const title = `${tool.name} - Free Online Tool`;
  const description = `${tool.description} Free, fast, and runs locally in your browser. No sign-up required.`;

  // Ensure trailing slash for GitHub Pages compatibility
  const toolUrl = tool.path.endsWith('/') ? tool.path : `${tool.path}/`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://devpockit.hypkey.com';

  return {
    title,
    description,
    keywords: toolKeywords,
    openGraph: {
      title: `${tool.name} | DevPockit`,
      description,
      url: `${baseUrl}${toolUrl}`,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} | DevPockit`,
      description,
    },
    alternates: {
      canonical: `${baseUrl}${toolUrl}`,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  try {
    const { category, toolId } = await params;

    // Early validation - if params are missing or invalid, show 404
    if (!category || !toolId) {
      notFound();
    }

    const tool = getToolById(toolId);

    // Validate tool exists
    if (!tool) {
      notFound();
    }

    // Verify the tool belongs to the specified category
    if (tool.category !== category) {
      notFound();
    }

    // The AppLayout is now handled by the layout.tsx file
    return null;
  } catch (error) {
    // If anything goes wrong (including route validation errors), show 404
    console.error('Tool page error:', error);
    notFound();
  }
}
