/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  // Next.js 14: usar experimental.serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ["nodemailer", "cloudinary", "ical-generator"],
  },
};

export default nextConfig;
