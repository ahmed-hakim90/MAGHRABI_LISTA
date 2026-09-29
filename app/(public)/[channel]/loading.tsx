export default function CatalogChannelLoading() {
  return (
    <div
      className="mx-auto grid w-full max-w-[1320px] grid-cols-2 gap-3 px-4 pt-6 pb-safe-fab max-[359px]:grid-cols-1 sm:px-6 md:grid-cols-3 md:gap-4 lg:px-10 xl:grid-cols-4"
      aria-label="تحميل الكتالوج"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-lg border border-border/70 bg-card"
        >
          <div className="aspect-[3/4] w-full animate-pulse bg-slate-100" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
