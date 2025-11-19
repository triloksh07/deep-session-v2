import type { NextConfig } from "next";
import pwa from '@ducanh2912/next-pwa';

// Initialize the PWA functionality with your desired settings
const withPWA = pwa({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  // You can add more PWA options here
});

// Your main Next.js configuration
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
    ],
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', "10.214.175.151", "192.168.0.105"],
  // Add other Next.js configurations here

};

// Export the final configuration, wrapped in the PWA function
export default withPWA(nextConfig);