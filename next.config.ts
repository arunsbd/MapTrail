import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // Pages supplies /MapTrail; local development uses the domain root.
  basePath: process.env.BASE_PATH ?? "",
};

export default nextConfig;
