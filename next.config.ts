import type { NextConfig } from "next";
import pwa from '@ducanh2912/next-pwa';

// Initialize the PWA functionality with your desired settings
const withPWA = pwa({
  dest: 'public',
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

  // Enforce headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // Prevents clickjacking (iframe attacks)
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: generateCSP()
          }
        ],
      },
    ];
  },
};

// Helper to generate the CSP string (Content Security Policy)
function generateCSP() {
  // 1. Define allowed domains
  const scriptSrc = [
    "'self'",
    "'unsafe-eval'", // Required for Next.js during dev (HMR), often needed for React frameworks
    "'unsafe-inline'", // Required for Next.js generic scripts
    "https://apis.google.com", // Firebase Auth
    "https://www.googletagmanager.com", // Analytics (if used)
    "https://www.google-analytics.com"
  ];

  const connectSrc = [
    "'self'",
    "https://*.googleapis.com", // Firebase APIs (Firestore, Auth)
    "https://*.firebaseio.com", // Realtime DB
    "https://identitytoolkit.googleapis.com", // Auth
    "wss://*.firebaseio.com", // Firebase WebSockets
    "https://securetoken.googleapis.com",
  ];

  const imgSrc = [
    "'self'",
    "data:", // Allows base64 images
    "blob:",
    "https://lh3.googleusercontent.com", // Google Avatar Images
    "https://firebasestorage.googleapis.com" // If you use Firebase Storage
  ];

  const frameSrc = [
    "'self'",
    "https://*.firebaseapp.com", // Auth redirects
    "https://accounts.google.com" // OAuth popups
  ];

  // 2. Construct the policy string
  const policy = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'"], // 'unsafe-inline' needed for CSS-in-JS or Tailwind
    'img-src': imgSrc,
    'font-src': ["'self'", "data:"],
    'connect-src': connectSrc,
    'frame-src': frameSrc,
    'object-src': ["'none'"], // Block Flash/Java plugins
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  // 3. Join into a single string
  return Object.entries(policy)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

export default withPWA(nextConfig);
