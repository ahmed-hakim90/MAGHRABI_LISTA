"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/services/settings";
import type { SiteSettings } from "@/lib/types/models";

export default function AdminSettingsPage() {
  const [initial, setInitial] = useState<SiteSettings | null>(null);
  const [appName, setAppName] = useState("");
  const [homeTitle, setHomeTitle] = useState("");
  const [homeSubtitle, setHomeSubtitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2F3437");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getSiteSettings().then((s) => {
      setInitial(s);
      setAppName(s.appName);
      setHomeTitle(s.homeTitle);
      setHomeSubtitle(s.homeSubtitle);
      setPrimaryColor(s.primaryColor || "#2F3437");
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initial) return;
    setBusy(true);
    setMsg(null);
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
      );
      const next = await getSiteSettings();
      setInitial(next);
      setLogoFile(null);
      setMsg("Saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!initial) {
    return <p className="text-[#6B6B6B]">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-[#2F3437]">Site settings</h1>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-sm"
      >
        {msg ? (
          <p className="text-sm text-[#6B6B6B]" role="status">
            {msg}
          </p>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">App name</span>
          <input
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">Home title</span>
          <input
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={homeTitle}
            onChange={(e) => setHomeTitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">
            Home subtitle
          </span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={homeSubtitle}
            onChange={(e) => setHomeSubtitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">
            Primary color (hex)
          </span>
          <input
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
        </label>
        <div>
          <span className="text-sm font-medium text-[#2F3437]">Logo</span>
          {initial.logoUrl ? (
            <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-xl border border-[#E5E2DA]">
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
            className="mt-2 block w-full text-sm text-[#6B6B6B]"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#2F3437] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
