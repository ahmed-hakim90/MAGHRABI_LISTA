"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { WhatsAppOrderDialog } from "@/components/public/WhatsAppOrderDialog";
import { useSiteSettings } from "@/components/public/PublicSiteSettingsProvider";
import { FAB_CLASS } from "@/lib/constants/fabStyles";
import { shouldHideFloatingCatalogButtons } from "@/lib/utils/catalogChrome";
import { resolveSiteHotlineNumber } from "@/lib/utils/hotlineNumber";

export function FloatingContactButtons() {
  const pathname = usePathname();
  const site = useSiteSettings();
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  if (shouldHideFloatingCatalogButtons(pathname)) {
    return null;
  }

  const hotline = resolveSiteHotlineNumber(site.hotlineNumber);
  const hasWhatsapp = site.whatsappContacts.length > 0;
  const hasHotline = Boolean(hotline);

  if (!hasWhatsapp && !hasHotline) {
    return null;
  }

  return (
    <>
      {hasWhatsapp ? (
        <WhatsAppOrderDialog
          open={whatsappOpen}
          onClose={() => setWhatsappOpen(false)}
        />
      ) : null}
      <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-[max(1.25rem,env(safe-area-inset-right))] z-[100] flex flex-col-reverse items-center gap-2">
        {hasHotline ? (
          <a
            href={`tel:${hotline}`}
            className={`${FAB_CLASS} bg-emerald-600`}
            aria-label={`اتصل بالخط الساخن ${hotline}`}
            title={`الخط الساخن — ${hotline}`}
          >
            <PhoneGlyph className="h-7 w-7" aria-hidden />
          </a>
        ) : null}
        {hasWhatsapp ? (
          <button
            type="button"
            onClick={() => setWhatsappOpen(true)}
            className={`${FAB_CLASS} bg-[#25D366]`}
            aria-label="التواصل عبر واتساب لتقديم طلب من موقع المغربي"
            title="واتساب — اكتب رسالتك واختر الملف إن وجد"
          >
            <WhatsAppGlyph className="h-8 w-8" aria-hidden />
          </button>
        ) : null}
      </div>
    </>
  );
}

function PhoneGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
