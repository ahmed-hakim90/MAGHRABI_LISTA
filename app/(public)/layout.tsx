import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";

export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NotificationPromptModal />
      <PwaInstallModal />
      {children}
    </>
  );
}
