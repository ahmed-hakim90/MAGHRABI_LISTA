import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { PublicSiteFooterGate } from "@/components/public/SiteFooter";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";
import { WhatsAppFloatingButton } from "@/components/public/WhatsAppFloatingButton";

export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl">
      <NotificationPromptModal />
      <PwaInstallModal />
      <WhatsAppFloatingButton />
      {children}
      <PublicSiteFooterGate />
    </div>
  );
}
