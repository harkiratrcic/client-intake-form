import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  images: {
    domains: ['localhost'],
  },
  eslint: {
    // Warning: This allows production builds to complete even with lint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to complete even with type errors
    ignoreBuildErrors: true,
  },
  // Ensure Prisma and bcryptjs work properly
};

export default nextConfig;
