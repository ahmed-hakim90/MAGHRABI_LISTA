import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="ltr" lang="en" className="min-h-dvh">
      {children}
    </div>
  );
}
