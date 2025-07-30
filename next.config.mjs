/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },

  // Production optimizations to prevent ChunkLoadError
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },

  // Webpack configuration to handle chunk loading issues
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Optimize chunk splitting for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Output configuration for better chunk management
  output: 'standalone',

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Temporarily disable rewrites to test admin pages
  // async rewrites() {
  //   return [
  //     // Only rewrite specific API routes to Python backend
  //     {
  //       source: '/api/leads/:path*',
  //       destination: 'http://localhost:8000/api/leads/:path*',
  //     },
  //     {
  //       source: '/api/upload/:path*',
  //       destination: 'http://localhost:8000/api/upload/:path*',
  //     },
  //     {
  //       source: '/api/check-duplicates',
  //       destination: 'http://localhost:8000/check-duplicates',
  //     },
  //     {
  //       source: '/api/auto-mapping',
  //       destination: 'http://localhost:8000/auto-mapping',
  //     },
  //     // Add other specific Python backend routes as needed
  //   ];
  // },
}

export default nextConfig
