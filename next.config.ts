import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/basepaint-toolbox",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
