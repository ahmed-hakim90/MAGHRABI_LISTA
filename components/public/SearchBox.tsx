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
        className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2.5 text-sm text-[#2F3437] shadow-sm outline-none transition placeholder:text-[#6B6B6B]/80 focus:border-[#2F3437]/25 focus:ring-2 focus:ring-[#2F3437]/10 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-[15px]"
      />
    </div>
  );
}
