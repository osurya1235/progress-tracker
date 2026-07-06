import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "@neondatabase/serverless"],
};

export default nextConfig;
