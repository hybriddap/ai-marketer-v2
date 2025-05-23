// src/app/layout.tsx
import "./globals.css";
import { BackendHealthProvider } from "@/components/providers/BackendHealthProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Footer from "@/components/layout/Footer";
import { NotificationProvider } from "@/context/NotificationContext";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Marketer | AKA Studio",
  description:
    "AI-powered social media manager that generates captions, schedules posts, and suggests promotions based on your business data. Automate your Facebook and Instagram marketing with intelligent AI assistance.",
  keywords: [
    "AI Marketing",
    "Social Media Management",
    "Marketing Automation",
    "Content Creation",
    "Caption Generation",
    "Business Marketing",
  ],
  authors: [{ name: "AKA Studio" }],
  creator: "AKA Studio",
  publisher: "AKA Studio",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai-marketer-v2.vercel.app",
    siteName: "AI Marketer",
    title: "AI Marketer | AKA Studio",
    description:
      "AI-powered social media manager that generates captions, schedules posts, and suggests promotions based on your business data. Automate your Facebook and Instagram marketing with intelligent AI assistance.",
    images: [
      {
        url: "/AKA.png",
        width: 1200,
        height: 630,
        alt: "AI Marketer - AI-powered marketing automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Marketer | AKA Studio",
    description:
      "AI-powered social media manager that generates captions, schedules posts, and suggests promotions based on your business data. Automate your Facebook and Instagram marketing with intelligent AI assistance.",
    images: ["/AKA.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <BackendHealthProvider>
            <NotificationProvider>
              <NavbarWrapper>
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center h-64">
                      <p className="text-gray-500">Loading...</p>
                    </div>
                  }
                >
                  <main className="flex-grow bg-gray-50">{children}</main>
                </Suspense>
              </NavbarWrapper>
              <Footer />
            </NotificationProvider>
          </BackendHealthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
