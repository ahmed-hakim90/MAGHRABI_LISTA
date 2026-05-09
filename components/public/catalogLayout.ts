/**
 * Responsive catalog grid: 1 col (&lt;360px), 3 cols mobile, 4 tablet, 5 desktop.
 * `min-w-0` prevents flex/grid overflow on narrow columns.
 */
export const CATALOG_GRID_CLASS =
  "grid w-full max-w-full grid-cols-3 gap-2 max-[359px]:grid-cols-1 md:grid-cols-4 md:gap-3 xl:grid-cols-5 xl:gap-4 [&>*]:min-w-0";
