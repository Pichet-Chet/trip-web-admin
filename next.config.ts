import type { NextConfig } from "next";
import BundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  transpilePackages: ["@trip/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
} satisfies NextConfig;

export default withBundleAnalyzer(nextConfig);
