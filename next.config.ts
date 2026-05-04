import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@gltf-transform/core', '@gltf-transform/functions'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
}

export default nextConfig
