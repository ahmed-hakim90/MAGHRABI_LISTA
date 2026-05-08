"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function SearchBox({ value, onChange, placeholder }: Props) {
  return (
    <div className="mx-auto w-full max-w-xl px-4" dir="rtl">
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
        className="w-full rounded-2xl border border-[#E5E2DA] bg-white px-4 py-3.5 text-[15px] text-[#2F3437] shadow-sm outline-none transition placeholder:text-[#6B6B6B]/80 focus:border-[#2F3437]/25 focus:ring-2 focus:ring-[#2F3437]/10"
      />
    </div>
  );
}
