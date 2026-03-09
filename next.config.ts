import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 300,
  cacheHandler: require.resolve("./cache-handler.js"),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.notion.so" },
      { protocol: "https", hostname: "notion.so" },
      { protocol: "https", hostname: "*.notion.so" },
      { protocol: "https", hostname: "img.notionusercontent.com" },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      { protocol: "https", hostname: "s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
