import { DEFAULT_SITE_APP_NAME } from "@/lib/constants/siteDefaults";

/** Egypt local 011… → digits for https://wa.me/… (no +, no spaces). */
export const PUBLIC_WHATSAPP_WA_ME_NUMBER = "201100606547";

/**
 * Pre-filled message so the customer clearly came from the public site.
 * Edit here if wording should change.
 */
export const PUBLIC_WHATSAPP_ORDER_PREFILL = `السلام عليكم ورحمة الله وبركاته،

أتواصل معكم بعد زيارة موقع «${DEFAULT_SITE_APP_NAME}س وأرغب في تقديم طلب شراء جديد.

أرجو توجيهي للخطوات المناسبة أو تأكيد استلام الطلب.

مع خالص الشكر والتقدير.`;
