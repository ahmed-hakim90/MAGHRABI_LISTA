"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Merges with default wrapper classes (e.g. flex-1 min-w-0 for toolbar row). */
  className?: string;
};

export function SearchBox({ value, onChange, placeholder, className }: Props) {
  const wrapperClass = [
    "mx-auto w-full max-w-xl px-0 sm:px-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass} dir="rtl">
      <label htmlFor="library-search" className="sr-only">
        بحث في الملفات
      </label>
      <input
        id="library-search"
        type="search"
        autoComplete="off"
        placeholder={
          placeholder ??
          "ابحث بالعنوان أو الوصف أو التصنيف أو الوسوم…"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[3.25rem] rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-foreground shadow-[var(--shadow-card)] outline-none transition placeholder:text-muted/85 focus:border-primary/35 focus:ring-[3px] focus:ring-primary/15 sm:min-h-[3.5rem] sm:rounded-3xl sm:px-5 sm:py-3.5 sm:text-base"
      />
    </div>
  );
}
