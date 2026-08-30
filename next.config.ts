import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // NPS Data API images — broadened from just /common/uploads/** since
      // the API is not documented to guarantee that one path forever.
      { protocol: "https", hostname: "www.nps.gov" },
      // NPGallery high-resolution originals (used by the future hero manifest).
      { protocol: "https", hostname: "npgallery.nps.gov" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560, 3200],
    qualities: [75, 85],
    minimumCacheTTL: 2678400, // 31 days — official NPS photos don't change
  },
};

export default nextConfig;
