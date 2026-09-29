/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs', '@prisma/client'],
  async rewrites() {
    return [
      {
        source: '/tutor',
        destination: '/dashboard',
      },
      {
        source: '/parent',
        destination: '/dashboard',
      },
      {
        source: '/admin',
        destination: '/dashboard/admin',
      },
    ]
  },
};

export default nextConfig;
