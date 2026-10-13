import type { NextConfig } from "next";

// Admin-uploaded product photos are served from Supabase Storage (public bucket `product-images`).
// Only that project's storage path is allowed for next/image.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  // Admin photo uploads are posted through a server action; the default 1 MB cap is below our 2 MB image limit.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
