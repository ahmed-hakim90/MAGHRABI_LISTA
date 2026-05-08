import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";
import { WhatsAppFloatingButton } from "@/components/public/WhatsAppFloatingButton";

export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NotificationPromptModal />
      <PwaInstallModal />
      <WhatsAppFloatingButton />
      {children}
    </>
  );
}
