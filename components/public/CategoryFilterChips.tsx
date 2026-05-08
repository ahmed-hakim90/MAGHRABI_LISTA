"use client";

type Props = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export function CategoryFilterChips({
  categories,
  selected,
  onSelect,
}: Props) {
  if (categories.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        className="flex min-w-min flex-row-reverse flex-nowrap gap-2 py-1"
        role="tablist"
        aria-label="تصفية حسب التصنيف"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selected === null}
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
            selected === null
              ? "bg-primary text-white shadow-[var(--shadow-card)]"
              : "border border-border bg-card text-foreground shadow-sm hover:border-primary/25"
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => {
          const active = selected === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-primary text-white shadow-[var(--shadow-card)]"
                  : "border border-border bg-card text-foreground shadow-sm hover:border-primary/25"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
