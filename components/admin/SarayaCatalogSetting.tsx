"use client";

import { useState } from "react";
import {
  SARAYA_FLIP_HREF,
  SARAYA_FLIP_TITLE,
} from "@/lib/catalog/sarayaFlipCatalog";

type CopyState = "idle" | "copied" | "failed";

/**
 * Admin control for the Saraya flip catalog: show or hide its card in the
 * wholesale catalog, and copy the private link that always works.
 */
export function SarayaCatalogSetting({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const shareUrl = `${window.location.origin}${SARAYA_FLIP_HREF}`;

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-border"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm">
          <span className="font-medium text-foreground">
            إظهار كارت «{SARAYA_FLIP_TITLE}» في كتالوج الجملة
          </span>
          <span className="mt-1 block text-xs text-muted">
            مخفي افتراضيًا. عند إيقافه لا يظهر الكارت للزوار، ويظل الرابط الخاص
            أدناه يعمل لمن يملكه.
          </span>
        </span>
      </label>

      <div>
        <span className="text-xs font-medium text-muted">الرابط الخاص</span>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            dir="ltr"
            aria-label={`الرابط الخاص بكتالوج ${SARAYA_FLIP_TITLE}`}
            className="w-full min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm"
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
            onClick={() => void copyShareUrl()}
          >
            نسخ الرابط
          </button>
        </div>
        <p className="mt-1 text-xs text-muted" role="status">
          {copyState === "copied"
            ? "تم نسخ الرابط."
            : copyState === "failed"
              ? "تعذر النسخ تلقائيًا — حدد الرابط وانسخه يدويًا."
              : "أي شخص لديه الرابط يستطيع فتح الكتالوج، ولا يظهر في نتائج البحث."}
        </p>
      </div>
    </div>
  );
}
