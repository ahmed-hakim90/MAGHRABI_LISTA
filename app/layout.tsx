import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { PwaUpdatePull } from "@/components/PwaUpdatePull";
import { ServiceWorkerNavigateListener } from "@/components/ServiceWorkerNavigateListener";
import { SplashScreen } from "@/components/SplashScreen";
import { DEFAULT_SITE_HOME_TITLE } from "@/lib/constants/siteDefaults";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: DEFAULT_SITE_HOME_TITLE,
  description: "Browse public PDF documents",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: DEFAULT_SITE_HOME_TITLE,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F7FA",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={`h-full splash-launch ${ibmPlexSansArabic.variable} font-sans`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/icons/icon-512.png"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full antialiased">
        <PwaUpdatePull />
        <ServiceWorkerNavigateListener />
        {children}
        <SplashScreen />
      </body>
    </html>
  );
}
