import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Deutsch mit Omar — Learn German Professionally",
  description:
    "Professional German language learning platform with Omar. Structured courses from A1 to C1, video lessons, and a premium learning experience.",
  icons: {
    icon: "/images/logo-official.png",
    shortcut: "/images/logo-official.png",
    apple: "/images/logo-official.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoArabic.variable} ${cairo.variable} antialiased`}
      >
        {children}
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
