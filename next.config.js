/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  // HTTPS is handled via the dev:https script in package.json
}

module.exports = nextConfig
