"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AUDIENCE_LABELS_AR,
  publicPriceListPath,
  type CatalogAudience,
} from "@/lib/constants/catalogChannels";
import {
  listPriceListsAdmin,
  patchPriceListViaApi,
} from "@/lib/services/priceLists";
import type { PriceList } from "@/lib/types/priceList";
import { useAdminApiToken } from "@/hooks/useAdminApiToken";
import { formatPriceListError } from "@/lib/utils/priceListErrors";
import { useToast } from "@/components/ui/Toast";

const TABS: { value: CatalogAudience | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "wholesale", label: AUDIENCE_LABELS_AR.wholesale },
  { value: "retail", label: AUDIENCE_LABELS_AR.retail },
  { value: "no_prices", label: AUDIENCE_LABELS_AR.no_prices },
];

export default function AdminPriceListsPage() {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CatalogAudience | "all">("all");
  const { toast } = useToast();
  const { getToken } = useAdminApiToken();

  function load() {
    setLoading(true);
    void listPriceListsAdmin()
      .then(setLists)
      .catch((err) =>
        toast(formatPriceListError(err, "فشل تحميل القوائم"), "error"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listPriceListsAdmin();
        setLists(data);
      } catch (err) {
        toast(formatPriceListError(err, "فشل تحميل القوائم"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    if (tab === "all") return lists;
    return lists.filter((l) => l.audience === tab);
  }, [lists, tab]);

  async function toggleActive(list: PriceList) {
    try {
      const token = await getToken();
      if (!token) throw new Error("غير مصرّح");
      await patchPriceListViaApi(
        list.id,
        { isActive: !list.isActive },
        token,
      );
      toast(list.isActive ? "تم تعطيل القائمة" : "تم تفعيل القائمة", "success");
      load();
    } catch (e) {
      toast(formatPriceListError(e, "فشل التحديث"), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">قوائم الأسعار</h1>
        <Link
          href={
            tab !== "all"
              ? `/admin/price-lists/new?audience=${tab}`
              : "/admin/price-lists/new"
          }
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          قائمة جديدة
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              tab === t.value
                ? "bg-primary text-white"
                : "border border-border bg-card text-foreground hover:bg-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">جاري التحميل…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          لا توجد قوائم في هذا النوع. أنشئ قائمة وحدّد نوع الرابط (جملة/تجزئة/…).
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-right">
                <th className="px-4 py-3 font-medium">الاسم</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((list) => (
                <tr key={list.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{list.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {AUDIENCE_LABELS_AR[list.audience]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                    {list.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        list.isActive
                          ? "bg-green-100 text-green-900"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {list.isActive ? "نشطة" : "معطّلة"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/price-lists/${list.id}`}
                        className="text-primary hover:underline"
                      >
                        إدارة
                      </Link>
                      <Link
                        href={publicPriceListPath(list.audience, list.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:underline"
                      >
                        عرض
                      </Link>
                      <button
                        type="button"
                        onClick={() => void toggleActive(list)}
                        className="text-muted hover:text-foreground"
                      >
                        {list.isActive ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
