import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { // Added for bwipjs.com barcode generator
        protocol: 'https',
        hostname: 'bwipjs.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
