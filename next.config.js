/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH || '';
const nextConfig = {
  basePath: basePath || undefined, // e.g. /devpockit for GitHub Pages project site
  output: 'export', // Enable static export for GitHub Pages
  trailingSlash: true, // Required for GitHub Pages
  images: {
    unoptimized: true, // Disable Next.js image optimization for static export
    domains: [],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'DevPockit',
    // Version comes from GitHub release tag (v*) during CI/CD builds, shows 'dev' locally
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    // Base URL for metadata, sitemap, canonical URLs. Required for self-hosting.
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://devpockit.hypkey.com',
    // Base path for assets when serving from subpath (e.g. /devpockit). Used for logo, etc.
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '',
  },
  // HTTPS is handled via the dev:https script in package.json
}

module.exports = nextConfig
