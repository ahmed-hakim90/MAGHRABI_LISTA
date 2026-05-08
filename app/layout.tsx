import type { Metadata, Viewport } from "next";
import { ServiceWorkerNavigateListener } from "@/components/ServiceWorkerNavigateListener";
import "./globals.css";

export const metadata: Metadata = {
  title: "Public File Library",
  description: "Browse public PDF documents",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Library",
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
        <ServiceWorkerNavigateListener />
        {children}
      </body>
    </html>
  );
}
