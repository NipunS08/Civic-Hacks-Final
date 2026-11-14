import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents requires partialPrefetching; both enabled or both off.
  // ISR (revalidate) is not compatible with cacheComponents — using default dynamic rendering.
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
