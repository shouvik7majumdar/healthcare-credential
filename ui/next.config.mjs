/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled: Strict Mode double-invokes effects in dev, interfering with Lace authorization flow
  transpilePackages: ['@midnight-ntwrk/dapp-connector-api', '@midnight-ntwrk/compact-runtime'],
  webpack: (config, { isServer }) => {
    config.resolve.symlinks = false;
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
