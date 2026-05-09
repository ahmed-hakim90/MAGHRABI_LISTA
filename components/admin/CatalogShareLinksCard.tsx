"use client";

import { useEffect, useState } from "react";
import {
  AUDIENCE_LABELS_AR,
  CATALOG_CHANNEL_SEGMENTS,
  CHANNEL_TO_AUDIENCE,
} from "@/lib/constants/catalogChannels";

type Props = {
  /** يُذكر في نص المشاركة (مثل اسم التطبيق من الإعدادات) */
  appName: string;
};

function buildShareMessage(appName: string, channelLabelAr: string, url: string) {
  const name = appName.trim() || "الكتالوج";
  return `${name} — ${channelLabelAr}\n${url}`;
}

export function CatalogShareLinksCard({ appName }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  async function copyText(text: string, copyId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(copyId);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("err");
      window.setTimeout(() => setCopied(null), 2000);
    }
  }

  const ready = Boolean(origin);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <span className="text-sm font-medium text-foreground">
          روابط الكتالوج للمشاركة
        </span>
        <p className="mt-1 text-xs text-muted">
          الروابط تُبنى من الدومين الحالي للنافذة (نفس الموقع المفتوح). انسخ
          الرابط أو رسالة جاهزة للصقها في واتساب أو أي تطبيق.
        </p>
      </div>
      <ul className="space-y-4">
        {CATALOG_CHANNEL_SEGMENTS.map((segment) => {
          const aud = CHANNEL_TO_AUDIENCE[segment];
          const label = AUDIENCE_LABELS_AR[aud];
          const path = `/${segment}`;
          const url = ready ? `${origin}${path}` : "";
          const msg = ready ? buildShareMessage(appName, label, url) : "";
          const baseId = segment;
          return (
            <li
              key={segment}
              className="space-y-2 rounded-xl border border-border bg-card p-3"
            >
              <div className="text-sm font-semibold text-foreground">
                {label}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  readOnly
                  dir="ltr"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground"
                  value={ready ? url : "جاري تحميل الدومين…"}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!ready}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60 disabled:opacity-50"
                    onClick={() => void copyText(url, `${baseId}-url`)}
                  >
                    {copied === `${baseId}-url` ? "تم نسخ الرابط" : "نسخ الرابط"}
                  </button>
                  <button
                    type="button"
                    disabled={!ready}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60 disabled:opacity-50"
                    onClick={() => void copyText(msg, `${baseId}-msg`)}
                  >
                    {copied === `${baseId}-msg`
                      ? "تم نسخ الرسالة"
                      : "نسخ رسالة + الرابط"}
                  </button>
                  <a
                    href={
                      ready
                        ? `https://wa.me/?text=${encodeURIComponent(msg)}`
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center rounded-lg bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:opacity-90 ${
                      !ready ? "pointer-events-none opacity-50" : ""
                    }`}
                    aria-disabled={!ready}
                  >
                    واتساب
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {copied === "err" ? (
        <p className="text-xs text-destructive" role="status">
          تعذر النسخ. جرّب يدويًا أو تأكد من صلاحيات المتصفح.
        </p>
      ) : null}
    </div>
  );
}
