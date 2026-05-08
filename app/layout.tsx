import type { Metadata, Viewport } from "next";
import { PwaUpdatePull } from "@/components/PwaUpdatePull";
import { ServiceWorkerNavigateListener } from "@/components/ServiceWorkerNavigateListener";
import { SplashScreen } from "@/components/SplashScreen";
import { DEFAULT_SITE_HOME_TITLE } from "@/lib/constants/siteDefaults";
import "./globals.css";

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
  themeColor: "#F7F6F3",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full splash-launch">
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
