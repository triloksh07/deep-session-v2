import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/context/AuthProvider";
import InstallPWAButton from '@/components/InstallPWAButton';
import { Toaster } from "@/components/ui/sonner";
import { NetworkStatusHandler } from '@/components/NetworkStatusHandler';
import { Analytics } from '@vercel/analytics/next';
import ServiceWorkerRegister from '@/components/serviceWorker'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "v3 Testing - DeepSession",
  description: "Boost your productivity with AI-driven focus sessions, personalized insights, and seamless task management.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DeepSession-v3",
    statusBarStyle: "default",
  },
};

// IMPROVEMENT: Add viewport settings for theme-color and responsive design
export const viewport: Viewport = {
  themeColor: "#0f172a", // Matches bg-slate-900
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AuthProvider>
              {children}
              <Toaster />
              <div className="fixed bottom-4 right-4 z-50">
                <InstallPWAButton />
              </div>
              {/* It will run the hook on the client-side */}
              <NetworkStatusHandler />
              <ServiceWorkerRegister />
              <Analytics />
            </AuthProvider>
          </Providers>
        </ ThemeProvider>
      </body>
    </html>
  );
}
