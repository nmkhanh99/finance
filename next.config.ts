import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // build gọn để đóng Docker image
};

export default nextConfig;
