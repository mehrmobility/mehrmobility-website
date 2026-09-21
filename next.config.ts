import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Legacy WordPress URLs use a trailing slash. Let the explicit legacy route
  // issue one direct permanent redirect instead of Next first stripping it.
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
