/** مسارات نخفي فيها الأزرار العائمة (واتساب، مساعد، …) */
export const REELS_FEED_PATH = /^\/(wholesale|retail|lists)\/reels\/feed$/;

/** صفحة قائمة أسعار تفاعلية واحدة (جدول + شريط الطلب) */
export const INTERACTIVE_PRICE_LIST_PATH =
  /^\/(wholesale|retail|lists)\/price-lists\/[^/]+$/;

export function shouldHideFloatingCatalogButtons(pathname: string): boolean {
  return (
    REELS_FEED_PATH.test(pathname) ||
    INTERACTIVE_PRICE_LIST_PATH.test(pathname)
  );
}
