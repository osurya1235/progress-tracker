import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "pg", "pg-native", "@prisma/adapter-pg"],
};

export default nextConfig;
