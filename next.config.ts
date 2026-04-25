import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Optimized image handling
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
  // Compress pages and static assets
  compress: true,
  // React Strict Mode - intentionally disabled to prevent double-render loops in dev
  // that interact badly with third-party auth state listeners
  reactStrictMode: false,
  // Source maps disabled in production
  productionBrowserSourceMaps: false,
}

export default nextConfig
