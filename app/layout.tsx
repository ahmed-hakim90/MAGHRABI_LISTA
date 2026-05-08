import type { Metadata, Viewport } from "next";
import { PwaServiceWorker } from "@/components/PwaServiceWorker";
import { ServiceWorkerNavigateListener } from "@/components/ServiceWorkerNavigateListener";
import { DEFAULT_SITE_HOME_TITLE } from "@/lib/constants/siteDefaults";
import "./globals.css";

export const metadata: Metadata = {
  title: DEFAULT_SITE_HOME_TITLE,
  description: "Browse public PDF documents",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: DEFAULT_SITE_HOME_TITLE,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F6F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <PwaServiceWorker />
        <ServiceWorkerNavigateListener />
        {children}
      </body>
    </html>
  );
}
