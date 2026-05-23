"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  parseAudienceFromDoc,
  type CatalogAudience,
} from "@/lib/constants/catalogChannels";
import { createPriceListViaApi } from "@/lib/services/priceLists";
import { formatPriceListError } from "@/lib/utils/priceListErrors";
import { PriceListForm } from "@/components/admin/price-lists/PriceListForm";
import { useAdminApiToken } from "@/hooks/useAdminApiToken";
import { useToast } from "@/components/ui/Toast";

function NewPriceListForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { getToken } = useAdminApiToken();
  const audienceParam = searchParams.get("audience");
  const defaultAudience: CatalogAudience =
    parseAudienceFromDoc(audienceParam) ?? "wholesale";

  return (
    <PriceListForm
      submitLabel="إنشاء"
      initial={{
        name: "",
        slug: "",
        pdfUrl: "",
        coverImage: "",
        audience: defaultAudience,
      }}
      onSubmit={async (data) => {
        try {
          const token = await getToken();
          if (!token) throw new Error("غير مصرّح — سجّل الدخول كمسؤول");
          const id = await createPriceListViaApi(data, token);
          toast("تم إنشاء القائمة", "success");
          router.push(`/admin/price-lists/${id}`);
        } catch (err) {
          toast(formatPriceListError(err, "فشل الإنشاء"), "error");
        }
      }}
    />
  );
}

export default function NewPriceListPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-foreground">قائمة أسعار جديدة</h1>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Suspense fallback={<p className="text-muted">جاري التحميل…</p>}>
          <NewPriceListForm />
        </Suspense>
      </div>
    </div>
  );
}
