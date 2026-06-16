"use client";

import type { SokanyServiceCenter } from "@/lib/constants/sokanyServiceCenters";
import { serviceCenterWhatsAppUrl } from "@/lib/utils/serviceCenterShare";

type Props = {
  center: SokanyServiceCenter;
};

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ServiceCenterCard({ center }: Props) {
  const directWa = serviceCenterWhatsAppUrl(center, "direct");
  const shareWa = serviceCenterWhatsAppUrl(center, "share");
  const hasPhone = Boolean(center.phoneDigits.trim());
  const telHref = hasPhone ? `tel:+${center.phoneDigits}` : null;

  return (
    <article className="rounded-xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            center.kind === "sales"
              ? "bg-amber-100 text-amber-950"
              : "bg-blue-100 text-blue-950"
          }`}
        >
          {center.kind === "sales" ? "بيع واستلام" : "صيانة"}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[#2F3437]">{center.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B]">
        {center.address}
      </p>
      <p className="mt-1 text-xs text-[#6B6B6B]">
        مواعيد العمل: {center.workingHours}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {directWa ? (
          <button
            type="button"
            onClick={() => openUrl(directWa)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#20BD5A]"
          >
            <WhatsAppGlyph className="h-4 w-4" />
            واتساب
          </button>
        ) : null}

        {shareWa ? (
          <button
            type="button"
            onClick={() => openUrl(shareWa)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-[#F7F6F3] px-3 py-2 text-sm font-medium text-[#2F3437] transition hover:bg-white"
          >
            <ShareGlyph className="h-4 w-4" />
            مشاركة
          </button>
        ) : null}

        {telHref ? (
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-white px-3 py-2 text-sm font-medium text-[#2F3437] transition hover:bg-[#F7F6F3]"
          >
            <PhoneGlyph className="h-4 w-4" />
            اتصال
          </a>
        ) : null}

        <a
          href={center.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-white px-3 py-2 text-sm font-medium text-[#2F3437] transition hover:bg-[#F7F6F3]"
        >
          <MapGlyph className="h-4 w-4" />
          الخريطة
        </a>
      </div>
    </article>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ShareGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
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
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
