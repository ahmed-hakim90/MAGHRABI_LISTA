"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FileCard, FileFolder } from "@/lib/types/models";
import Image from "next/image";
import {
  createFileCard,
  removeFileCardThumbnail,
  replaceFileCardThumbnail,
  updateFileCardMeta,
} from "@/lib/services/fileCards";
import { listAllFileFoldersAdmin } from "@/lib/services/fileFolders";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UploadField } from "./UploadField";

type Props = {
  mode: "create" | "edit";
  uid: string;
  initial?: FileCard | null;
};

export function FileForm({ mode, uid, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [productCountStr, setProductCountStr] = useState(
    initial?.productCount != null ? String(initial.productCount) : "",
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [folderId, setFolderId] = useState(initial?.folderId ?? "");
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [removeThumb, setRemoveThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    void listAllFileFoldersAdmin().then(setFolders);
  }, []);

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function resolveFolderFields(): {
    folderId: string;
    folderName: string;
    folderIsActive: boolean;
  } {
    if (!folderId) {
      return { folderId: "", folderName: "", folderIsActive: true };
    }
    const f = folders.find((x) => x.id === folderId);
    return {
      folderId,
      folderName: f?.name ?? "",
      folderIsActive: f?.isActive ?? true,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const productCount = (() => {
      const t = productCountStr.trim();
      if (!t) return null;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0) return undefined;
      return Math.floor(n);
    })();
    if (productCount === undefined) {
      setError("عدد المنتجات يجب أن يكون رقمًا صحيحًا غير سالب أو فارغًا.");
      return;
    }
    setSaving(true);
    setUploadProgress(
      mode === "create" || (mode === "edit" && thumb && !removeThumb)
        ? 0
        : null,
    );
    try {
      const folderFields = resolveFolderFields();
      if (mode === "create") {
        if (!pdf) {
          setError("ملف PDF مطلوب.");
          setSaving(false);
          setUploadProgress(null);
          return;
        }
        await createFileCard(
          {
            title,
            description: "",
            category,
            tags,
            order: Number(order) || 0,
            isActive,
            productCount,
            ...folderFields,
            pdfFile: pdf,
            thumbnailFile: thumb ?? undefined,
            uid,
          },
          { onProgress: (p) => setUploadProgress(p) },
        );
        setUploadProgress(null);
        router.push("/admin/files");
        router.refresh();
        return;
      }
      if (!initial) return;
      if (removeThumb) {
        await removeFileCardThumbnail(initial.id, uid);
      } else if (thumb) {
        await replaceFileCardThumbnail(initial.id, thumb, uid, {
          onProgress: (p) => setUploadProgress(p),
        });
      }
      await updateFileCardMeta(initial.id, {
        title,
        description,
        category,
        tags,
        order: Number(order) || 0,
        isActive,
        productCount,
        ...folderFields,
        uid,
      });
      router.push("/admin/files");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold text-foreground">
        {mode === "create" ? "ملف جديد" : "تعديل الملف"}
      </h1>
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {uploadProgress !== null ? (
        <ProgressBar
          label={
            mode === "create"
              ? "جاري رفع الملفات…"
              : "جاري رفع الصورة المصغّرة…"
          }
          value={uploadProgress}
          className="pt-1"
        />
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-foreground">العنوان</span>
        <input
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      {mode === "edit" ? (
        <label className="block">
          <span className="text-sm font-medium text-foreground">الوصف</span>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-foreground">التصنيف</span>
        <input
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          عدد المنتجات (اختياري)
        </span>
        <input
          type="number"
          min={0}
          step={1}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={productCountStr}
          onChange={(e) => setProductCountStr(e.target.value)}
          placeholder="مثال: عدد الأصناف"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">المجلد</span>
        <select
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-[15px]"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">— بدون مجلد —</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {f.isActive ? "" : " (غير نشط)"}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          الوسوم (مفصولة بفاصلة)
        </span>
        <input
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">الترتيب</span>
        <input
          type="number"
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span className="text-sm text-foreground">نشط (يظهر للزوار)</span>
      </label>
      {mode === "create" ? (
        <>
          <UploadField
            label="ملف PDF"
            accept="application/pdf"
            file={pdf}
            onFile={setPdf}
            required
          />
          <UploadField
            label="صورة مصغّرة (اختياري — إن تُركت فارغة يُستخدم أيقونة PDF)"
            accept="image/*"
            file={thumb}
            onFile={setThumb}
          />
        </>
      ) : initial ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface/50 p-4">
          <p className="text-sm font-medium text-foreground">
            الصورة المصغّرة
          </p>
          {initial.thumbnailUrl?.trim() && !removeThumb ? (
            <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-border bg-card">
              <Image
                src={initial.thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <p className="text-xs text-muted">
              لا توجد صورة مخصّصة — يُعرض معاينة PDF أو أيقونة افتراضية.
            </p>
          )}
          {removeThumb ? (
            <p className="text-xs text-amber-800">
              سيتم إزالة الصورة المخصّصة عند الحفظ.
            </p>
          ) : null}
          <UploadField
            label="تغيير الصورة المصغّرة"
            accept="image/*"
            file={thumb}
            onFile={(f) => {
              setThumb(f);
              setRemoveThumb(false);
            }}
          />
          {thumb ? (
            <button
              type="button"
              onClick={() => setThumb(null)}
              className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              إلغاء اختيار الصورة الجديدة
            </button>
          ) : null}
          {initial.thumbnailUrl?.trim() && !removeThumb ? (
            <button
              type="button"
              onClick={() => {
                setThumb(null);
                setRemoveThumb(true);
              }}
              className="text-sm text-red-700 underline-offset-2 hover:underline"
            >
              إزالة الصورة المصغّرة من التخزين
            </button>
          ) : null}
          {removeThumb ? (
            <button
              type="button"
              onClick={() => setRemoveThumb(false)}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              إلغاء الإزالة
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "جاري الحفظ…" : "حفظ"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
