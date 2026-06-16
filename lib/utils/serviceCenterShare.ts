import type { SokanyServiceCenter } from "@/lib/constants/sokanyServiceCenters";
import { whatsAppUrl } from "@/lib/utils/priceListWhatsApp";

const SIGNATURE = "شركة المغربي — الوكيل الحصري لمنتجات سوكاني في مصر";

function kindLabel(kind: SokanyServiceCenter["kind"]): string {
  return kind === "sales" ? "فرع بيع واستلام" : "مركز صيانة معتمد";
}

export function buildServiceCenterShareMessage(center: SokanyServiceCenter): string {
  const lines = [
    kindLabel(center.kind),
    center.name,
    `العنوان: ${center.address}`,
    `مواعيد العمل: ${center.workingHours}`,
    `الموقع على الخريطة: ${center.mapUrl}`,
    "",
    SIGNATURE,
  ];
  return lines.join("\n");
}

function directGreeting(center: SokanyServiceCenter): string {
  const intro =
    center.kind === "sales"
      ? "السلام عليكم، أود الاستفسار عن فرع البيع والمعاينة:"
      : "السلام عليكم، أود الاستفسار عن مركز الصيانة:";
  return `${intro}\n\n${buildServiceCenterShareMessage(center)}`;
}

export type ServiceCenterWhatsAppMode = "direct" | "share";

export function serviceCenterWhatsAppUrl(
  center: SokanyServiceCenter,
  mode: ServiceCenterWhatsAppMode,
): string | null {
  const message =
    mode === "direct" ? directGreeting(center) : buildServiceCenterShareMessage(center);

  if (mode === "share") {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  if (!center.phoneDigits.trim()) {
    return null;
  }

  return whatsAppUrl(center.phoneDigits, message);
}
