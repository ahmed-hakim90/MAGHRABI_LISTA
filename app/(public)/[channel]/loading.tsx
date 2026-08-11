export default function CatalogChannelLoading() {
  return (
    <div
      className="grid grid-cols-3 gap-2 px-3 pt-2 pb-safe-fab sm:grid-cols-4 sm:gap-3 sm:px-4 lg:grid-cols-5"
      aria-label="تحميل الكتالوج"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
        >
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-1.5 border-t border-border/70 p-2">
            <div className="mx-auto h-3 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="mx-auto h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
