"use client";

/**
 * Compact branded masthead for the wholesale PDF library. Sits transparently
 * on the page-level fixed brand backdrop so the field stays constant on scroll.
 */
export function WholesaleMasthead() {
  return (
    <section
      className="relative"
      aria-label="كتالوج الجملة — EL MAGHRABY"
    >
      <div className="relative mx-auto w-full max-w-[1320px] px-4 py-9 sm:px-6 sm:py-11 lg:px-10 lg:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-ivory/90 sm:text-xs">
          EL MAGHRABY
          <span className="mx-2 text-brand-gold" aria-hidden>
            /
          </span>
          WHOLESALE
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-[26px] lg:text-3xl">
          كتالوج الجملة
        </h1>
        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-brand-ivory/95 sm:text-[15px]">
          تصفح قوائم وكتالوجات المغربي المتاحة لشركائنا.
        </p>
      </div>
      <div className="h-[3px] w-full bg-brand-gold/80" aria-hidden />
    </section>
  );
}
