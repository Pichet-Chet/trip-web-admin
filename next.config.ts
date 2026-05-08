import type { NextConfig } from "next";
import BundleAnalyzer from "@next/bundle-analyzer";
import path from "path";

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  transpilePackages: ["@trip/ui"],
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
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
