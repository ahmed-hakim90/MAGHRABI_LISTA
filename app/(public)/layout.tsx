import { PublicSiteFooterGate } from "@/components/public/SiteFooter";

export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl">
      {children}
      <PublicSiteFooterGate />
    </div>
  );
}
