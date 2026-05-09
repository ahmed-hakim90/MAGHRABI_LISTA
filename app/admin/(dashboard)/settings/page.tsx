"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/services/settings";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SiteSettings } from "@/lib/types/models";
import { DEFAULT_SITE_PRIMARY_COLOR } from "@/lib/constants/siteDefaults";

export default function AdminSettingsPage() {
  const [initial, setInitial] = useState<SiteSettings | null>(null);
  const [appName, setAppName] = useState("");
  const [homeTitle, setHomeTitle] = useState("");
  const [homeSubtitle, setHomeSubtitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_SITE_PRIMARY_COLOR);
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
          logoFile,
        },
        initial,
        logoFile
          ? { onUploadProgress: (p) => setUploadProgress(p) }
          : undefined,
      );
      const next = await getSiteSettings();
      setInitial(next);
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
    <div className="mx-auto max-w-lg space-y-4">
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
