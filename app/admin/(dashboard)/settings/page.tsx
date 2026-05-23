"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/services/settings";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SiteSettings, WhatsAppContact } from "@/lib/types/models";
import { DEFAULT_SITE_PRIMARY_COLOR } from "@/lib/constants/siteDefaults";

export default function AdminSettingsPage() {
  const [initial, setInitial] = useState<SiteSettings | null>(null);
  const [appName, setAppName] = useState("");
  const [homeTitle, setHomeTitle] = useState("");
  const [homeSubtitle, setHomeSubtitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_SITE_PRIMARY_COLOR);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [whatsappRows, setWhatsappRows] = useState<WhatsAppContact[]>([]);
  const [priceListOrderIncludePrices, setPriceListOrderIncludePrices] =
    useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    void getSiteSettings().then((s) => {
      setInitial(s);
      setAppName(s.appName);
      setHomeTitle(s.homeTitle);
      setHomeSubtitle(s.homeSubtitle);
      setPrimaryColor(s.primaryColor || DEFAULT_SITE_PRIMARY_COLOR);
      setWhatsappRows(s.whatsappContacts);
      setPriceListOrderIncludePrices(s.priceListOrderIncludePrices);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initial) return;
    setBusy(true);
    setMsg(null);
    setUploadProgress(logoFile ? 0 : null);
    try {
      await updateSiteSettings(
        {
          appName,
          homeTitle,
          homeSubtitle,
          primaryColor,
          whatsappContacts: whatsappRows,
          priceListOrderIncludePrices,
          logoFile,
        },
        initial,
        logoFile
          ? { onUploadProgress: (p) => setUploadProgress(p) }
          : undefined,
      );
      const next = await getSiteSettings();
      setInitial(next);
      setWhatsappRows(next.whatsappContacts);
      setLogoFile(null);
      setMsg("تم الحفظ.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setUploadProgress(null);
      setBusy(false);
    }
  }

  if (!initial) {
    return <p className="text-muted">جاري التحميل…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground">إعدادات الموقع</h1>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        {msg ? (
          <p className="text-sm text-muted" role="status">
            {msg}
          </p>
        ) : null}
        {uploadProgress !== null ? (
          <ProgressBar
            label="جاري رفع الشعار…"
            value={uploadProgress}
            className="pt-1"
          />
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-foreground">اسم التطبيق</span>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">عنوان الصفحة الرئيسية</span>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={homeTitle}
            onChange={(e) => setHomeTitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">
            نص فرعي للصفحة الرئيسية
          </span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={homeSubtitle}
            onChange={(e) => setHomeSubtitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">
            اللون الأساسي (hex)
          </span>
          <input
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border"
            checked={priceListOrderIncludePrices}
            onChange={(e) => setPriceListOrderIncludePrices(e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">
              إظهار الأسعار في طلبات قوائم الأسعار (واتساب)
            </span>
            <span className="mt-1 block text-xs text-muted">
              افتراضيًا تُرسل الطلبات بدون أسعار — الاسم والكمية بالكرتونة فقط.
            </span>
          </span>
        </label>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <span className="text-sm font-medium text-foreground">
              أرقام واتساب
            </span>
            <p className="mt-1 text-xs text-muted">
              اسم يظهر للزائر عند اختيار الجهة. الرقم بصيغة دولية بدون + (مثال مصر:
              20 ثم الرقم كما في wa.me).
            </p>
          </div>
          <ul className="space-y-3">
            {whatsappRows.map((row, index) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-end"
              >
                <label className="block flex-1">
                  <span className="text-xs font-medium text-muted">
                    الاسم المعروض
                  </span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    value={row.displayName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setWhatsappRows((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, displayName: v } : r,
                        ),
                      );
                    }}
                    placeholder="مثال: مبيعات القاهرة"
                  />
                </label>
                <label className="block flex-1">
                  <span className="text-xs font-medium text-muted">الرقم</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                    dir="ltr"
                    value={row.phoneDigits}
                    onChange={(e) => {
                      const v = e.target.value;
                      setWhatsappRows((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, phoneDigits: v } : r,
                        ),
                      );
                    }}
                    placeholder="2010xxxxxxxx"
                  />
                </label>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    setWhatsappRows((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
            onClick={() =>
              setWhatsappRows((prev) => [
                ...prev,
                {
                  id:
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `wa-${Date.now()}`,
                  displayName: "",
                  phoneDigits: "",
                },
              ])
            }
          >
            + إضافة رقم
          </button>
        </div>

        <div>
          <span className="text-sm font-medium text-foreground">الشعار</span>
          {initial.logoUrl ? (
            <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-xl border border-border">
              <Image
                src={initial.logoUrl}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : null}
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm text-muted"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "جاري الحفظ…" : "حفظ"}
        </button>
      </form>
    </div>
  );
}
