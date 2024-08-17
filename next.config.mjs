/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['v0.dev'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
      };
    }
    return config;
  },
};

export default nextConfig;