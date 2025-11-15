/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Chỉ dùng basePath trong production (khi build static)
  // Trong dev mode, không dùng để dễ debug
  ...(isDev ? {} : { basePath: '/pora', assetPrefix: '/pora' }),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'api.placeholder.com',
      },
    ],
  },
}

module.exports = nextConfig
