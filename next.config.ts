import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Optimized image handling
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Compress pages and static assets
  compress: true,
  // React Strict Mode - intentionally disabled to prevent double-render loops in dev
  // that interact badly with third-party auth state listeners
  reactStrictMode: false,
  // Source maps disabled in production
  productionBrowserSourceMaps: false,
  // Allow ngrok and local network access to webpack-hmr
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.1.9:3000',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],
  // Turbopack (default in Next.js 16) — empty config silences the "webpack config
  // present but no turbopack config" warning without changing behaviour.
  turbopack: {},
}

export default nextConfig
