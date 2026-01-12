import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    
    // Ignore markdown files
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });
    
    return config;
  },
};

export default nextConfig;
