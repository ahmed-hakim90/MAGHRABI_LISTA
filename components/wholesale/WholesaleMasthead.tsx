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
      <div className="relative mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-10 lg:pb-3 lg:pt-4">
        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.22em] text-brand-ivory/90 sm:text-xs">
          EL MAGHRABY
          <span className="mx-2 text-brand-gold" aria-hidden>
            /
          </span>
          WHOLESALE
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-[1.15] text-white sm:text-[26px] lg:text-[28px]">
          كتالوج الجملة
        </h1>
        <p className="mt-1 max-w-xl text-[14px] leading-5 text-brand-ivory/95 sm:text-[15px] sm:leading-6">
          تصفح قوائم وكتالوجات المغربي المتاحة لشركائنا.
        </p>
      </div>
      <div className="h-[3px] w-full bg-brand-gold/80" aria-hidden />
    </section>
  );
}
