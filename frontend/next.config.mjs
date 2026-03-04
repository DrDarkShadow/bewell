/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
  // Enable standalone output for better deployment
  output: 'standalone',
  // Disable x-powered-by header
  poweredByHeader: false,
  // Enable compression
  compress: true,
}

export default nextConfig
