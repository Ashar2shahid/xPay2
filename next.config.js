/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: '/api/proxy'
      }
    ]
  }
}

module.exports = nextConfig