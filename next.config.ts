import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  compress: true,
  // Intentionally disabled to prevent double-render loops in dev
  // that interact badly with third-party auth state listeners
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.1.9:3000',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],
  turbopack: {},
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in production CI
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
