import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/components/AuthProvider";
import InstallPWAButton from '@/components/InstallPWAButton';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepSession - AI-Powered Focus Coach",
  description: "Boost your productivity with AI-driven focus sessions, personalized insights, and seamless task management.",
  manifest: "/manifest.json",
  // themeColor: "#4F46E5",
  appleWebApp: {
    capable: true,
    title: "DeepSession",
    statusBarStyle: "default",
  },
};

// IMPROVEMENT: Add viewport settings for theme-color and responsive design
export const viewport: Viewport = {
  themeColor: "#4F46E5",
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
        <Providers>
          {children}
          <div className="fixed bottom-4 right-4 z-50">
              <InstallPWAButton />
            </div>
        </Providers>
      </body>
    </html>
  );
}
