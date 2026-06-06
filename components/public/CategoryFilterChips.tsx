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
  if (categories.length <= 1) return null;

  return (
    <div
      className="w-full touch-pan-x overflow-x-auto overscroll-x-contain pe-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      dir="rtl"
    >
      <div
        className="flex min-w-min snap-x snap-mandatory flex-row-reverse flex-nowrap gap-2 py-0.5"
        role="tablist"
        aria-label="تصفية حسب التصنيف"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selected === null}
          onClick={() => onSelect(null)}
          className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
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
              className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
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
