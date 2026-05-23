"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { publicPriceListPath } from "@/lib/constants/catalogChannels";
import { getPriceList, patchPriceListViaApi } from "@/lib/services/priceLists";
import { formatPriceListError } from "@/lib/utils/priceListErrors";
import type { PriceList } from "@/lib/types/priceList";
import { PriceListForm } from "@/components/admin/price-lists/PriceListForm";
import { ExcelImportPanel } from "@/components/admin/price-lists/ExcelImportPanel";
import { LastImportReportCard } from "@/components/admin/price-lists/LastImportReportCard";
import { useAdminApiToken } from "@/hooks/useAdminApiToken";
import { useToast } from "@/components/ui/Toast";

type Props = { params: Promise<{ listId: string }> };

export default function AdminPriceListDetailPage({ params }: Props) {
  const { listId } = use(params);
  const [list, setList] = useState<PriceList | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getToken } = useAdminApiToken();

  function load() {
    setLoading(true);
    void getPriceList(listId)
      .then(setList)
      .catch((err) =>
        toast(formatPriceListError(err, "فشل التحميل"), "error"),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getPriceList(listId);
        setList(data);
      } catch (err) {
        toast(formatPriceListError(err, "فشل التحميل"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [listId, toast]);

  if (loading) return <p className="text-muted">جاري التحميل…</p>;
  if (!list) return <p className="text-red-800">القائمة غير موجودة</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-foreground">{list.name}</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/admin/price-lists/${listId}/items`}
            className="rounded-xl border border-border px-3 py-1.5 hover:bg-surface"
          >
            الأصناف
          </Link>
          <Link
            href={publicPriceListPath(list.audience, list.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border px-3 py-1.5 hover:bg-surface"
          >
            معاينة عامة
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-medium text-foreground">بيانات القائمة</h2>
        <PriceListForm
          initial={{
            name: list.name,
            slug: list.slug,
            pdfUrl: list.pdfUrl,
            coverImage: list.coverImage,
            audience: list.audience,
            linkedFileCardId: list.linkedFileCardId,
          }}
          onSubmit={async (data) => {
            try {
              const token = await getToken();
              if (!token) throw new Error("غير مصرّح — سجّل الدخول كمسؤول");
              await patchPriceListViaApi(listId, data, token);
              toast("تم الحفظ", "success");
              load();
            } catch (err) {
              toast(formatPriceListError(err, "فشل الحفظ"), "error");
            }
          }}
        />
      </div>

      <ExcelImportPanel listId={listId} onImported={load} />

      {list.lastImportReport ? (
        <LastImportReportCard report={list.lastImportReport} />
      ) : null}

      <p className="text-xs text-muted">
        معرّف القائمة للـ Excel: <code dir="ltr">{listId}</code>
      </p>
    </div>
  );
}
