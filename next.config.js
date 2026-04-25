/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable optimized images
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
  // Compress pages and static assets
  compress: true,
  // Enable React Strict Mode for development
  reactStrictMode: true,
  // Generate source maps for production (useful for error tracking)
  productionBrowserSourceMaps: false,
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
}

module.exports = nextConfig
