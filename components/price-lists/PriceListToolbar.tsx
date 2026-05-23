"use client";

type Props = {
  pdfUrl: string;
  onPrint: () => void;
  onShare: () => void;
};

export function PriceListToolbar({ pdfUrl, onPrint, onShare }: Props) {
  return (
    <div className="price-list-no-print flex flex-wrap gap-2">
      {pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[#ca8a04] bg-[#FACC15] px-4 py-2 text-sm font-semibold text-[#1a1a1a] transition hover:bg-[#FDE047]"
        >
          فتح PDF
        </a>
      ) : null}
      <button
        type="button"
        onClick={onPrint}
        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
      >
        طباعة الجدول
      </button>
      <button
        type="button"
        onClick={onShare}
        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
      >
        مشاركة القائمة
      </button>
    </div>
  );
}
