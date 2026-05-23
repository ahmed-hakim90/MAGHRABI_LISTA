"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUDIENCE_LABELS_AR,
  type CatalogAudience,
} from "@/lib/constants/catalogChannels";
import { useAdminApiToken } from "@/hooks/useAdminApiToken";
import { listReelsAdminViaApi } from "@/lib/services/reels";
import type { CatalogReel, ReelAudience } from "@/lib/types/reels";
import { PROVIDER_LABELS_AR } from "@/lib/utils/videoEmbed";
import { useToast } from "@/components/ui/Toast";

const AUDIENCE_OPTIONS: { value: ReelAudience; label: string }[] = [
  { value: "all", label: "كل القنوات" },
  { value: "wholesale", label: AUDIENCE_LABELS_AR.wholesale },
  { value: "retail", label: AUDIENCE_LABELS_AR.retail },
  { value: "no_prices", label: AUDIENCE_LABELS_AR.no_prices },
];

export default function AdminReelsPage() {
  const { getToken } = useAdminApiToken();
  const { toast } = useToast();
  const [reels, setReels] = useState<CatalogReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [audience, setAudience] = useState<ReelAudience>("all");
  const [sortOrder, setSortOrder] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("غير مصرّح — سجّل الدخول كمسؤول");
      }
      const data = await listReelsAdminViaApi(token);
      setReels(data);
      setSortOrder(data.length);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "فشل تحميل الفيديوهات",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSourceUrl("");
    setAudience("all");
    setSortOrder(reels.length);
  }

  function startEdit(reel: CatalogReel) {
    setEditingId(reel.id);
    setTitle(reel.title);
    setSourceUrl(reel.sourceUrl);
    setAudience(reel.audience);
    setSortOrder(reel.sortOrder);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("غير مصرّح");

      const payload = {
        title,
        sourceUrl,
        audience,
        sortOrder,
        isActive: true,
      };

      const res = editingId
        ? await fetch(`/api/admin/reels/${editingId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/reels", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");

      toast(editingId ? "تم التحديث" : "تمت الإضافة", "success");
      resetForm();
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "فشل الحفظ", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(reel: CatalogReel) {
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("غير مصرّح");
      const res = await fetch(`/api/admin/reels/${reel.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !reel.isActive }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "فشل التحديث");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "فشل التحديث", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(reel: CatalogReel) {
    if (!confirm(`حذف «${reel.title}»؟`)) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("غير مصرّح");
      const res = await fetch(`/api/admin/reels/${reel.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "فشل الحذف");
      toast("تم الحذف", "success");
      if (editingId === reel.id) resetForm();
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "فشل الحذف", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">فيديوهات وريلز</h1>
        <p className="mt-1 text-sm text-muted">
          الصق رابط يوتيوب، فيسبوك (ريل/فيديو)، أو Google Drive. يُعرض للزوار في
          صفحة الفيديوهات وعلى الصفحة الرئيسية للقناة.
        </p>
      </div>

      <form
        onSubmit={(e) => void save(e)}
        className="space-y-4 rounded-2xl border border-border bg-card p-4"
      >
        <h2 className="font-medium text-foreground">
          {editingId ? "تعديل فيديو" : "إضافة فيديو"}
        </h2>
        <label className="block text-sm">
          العنوان
          <input
            required
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          رابط الفيديو
          <input
            required={!editingId}
            dir="ltr"
            placeholder="https://youtube.com/... أو facebook.com/... أو drive.google.com/..."
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-left"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          {editingId ? (
            <span className="mt-1 block text-xs text-muted">
              اتركه كما هو إن لم تُرد تغيير الرابط
            </span>
          ) : null}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            القناة
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              value={audience}
              onChange={(e) => setAudience(e.target.value as ReelAudience)}
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            الترتيب
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "جاري الحفظ…" : editingId ? "حفظ التعديل" : "إضافة"}
          </button>
          {editingId ? (
            <button
              type="button"
              disabled={busy}
              onClick={resetForm}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              إلغاء
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="font-medium text-foreground">الفيديوهات المحفوظة</h2>
        {loading ? (
          <p className="text-muted">جاري التحميل…</p>
        ) : reels.length === 0 ? (
          <p className="text-muted">لا توجد فيديوهات بعد.</p>
        ) : (
          <ul className="space-y-2">
            {reels.map((reel) => (
              <li
                key={reel.id}
                className={`rounded-xl border p-3 ${
                  reel.isActive
                    ? "border-border bg-card"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{reel.title}</p>
                    <p className="text-xs text-muted">
                      {PROVIDER_LABELS_AR[reel.provider]} ·{" "}
                      {reel.audience === "all"
                        ? "كل القنوات"
                        : AUDIENCE_LABELS_AR[reel.audience as CatalogAudience]}
                      {" · "}ترتيب {reel.sortOrder}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-muted"
                      dir="ltr"
                    >
                      {reel.sourceUrl}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(reel)}
                      className="text-xs text-primary hover:underline"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggleActive(reel)}
                      className="text-xs text-primary hover:underline"
                    >
                      {reel.isActive ? "إخفاء" : "تفعيل"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(reel)}
                      className="text-xs text-red-700 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
