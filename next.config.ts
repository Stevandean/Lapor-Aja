import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vehzsvnozhnsbflnbhdh.supabase.co",
        pathname: "/storage/v1/object/sign/report-photos/**",
      },
      {
        protocol: "https",
        hostname: "vehzsvnozhnsbflnbhdh.supabase.co",
        pathname: "/storage/v1/object/sign/verification-photos/**",
      },
      {
        protocol: "https",
        hostname: "vehzsvnozhnsbflnbhdh.supabase.co",
        pathname: "/storage/v1/object/sign/progress-photos/**",
      },
      {
        protocol: "https",
        hostname: "vehzsvnozhnsbflnbhdh.supabase.co",
        pathname: "/storage/v1/object/sign/profile-avatars/**",
      },
    ],
  },
};

export default nextConfig;
