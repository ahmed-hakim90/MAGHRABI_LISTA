/**
 * Responsive catalog grid: 1 col (&lt;360px), 3 cols mobile, 4 tablet, 5 desktop.
 * `min-w-0` prevents flex/grid overflow on narrow columns.
 */
export const CATALOG_GRID_CLASS =
  "grid w-full max-w-full grid-cols-2 gap-3 max-[359px]:grid-cols-1 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6 [&>*]:min-w-0";

/** First N grid tiles get `next/image` priority (LCP) — covers xl first row (5 cols) plus one. */
export const CATALOG_GRID_PRIORITY_COUNT = 6;
