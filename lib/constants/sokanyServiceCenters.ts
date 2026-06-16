export type ServiceCenterKind = "maintenance" | "sales";

export type SokanyServiceCenter = {
  id: string;
  kind: ServiceCenterKind;
  name: string;
  address: string;
  workingHours: string;
  /** wa.me digits; empty when not available */
  phoneDigits: string;
  mapUrl: string;
};

export const SOKANY_MAINTENANCE_HOURS =
  "يومياً من 10 صباحاً إلى 8 مساءً ما عدا الجمعة";

export const SOKANY_SALES_HOURS =
  "يومياً من 10 صباحاً إلى 11 مساءً";

/** Mirrors sokany.vercel.app/branches — update manually when branches change. */
export const SOKANY_SERVICE_CENTERS: SokanyServiceCenter[] = [
  {
    id: "cairo-main",
    kind: "maintenance",
    name: "القاهرة الرئيسي (وسط البلد)",
    address:
      "22 ا، شارع الجمهورية، غيط العدة، عابدين، محافظة القاهرة 4283010",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201044001058",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=22%20%D8%A7%D8%8C%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A7%D9%84%D8%AC%D9%85%D9%87%D9%88%D8%B1%D9%8A%D8%A9%D8%8C%20%D8%BA%D9%8A%D8%B7%20%D8%A7%D9%84%D8%B9%D8%AF%D8%A9%D8%8C%20%D8%B9%D8%A7%D8%A8%D8%AF%D9%8A%D9%86%D8%8C%20%D9%85%D8%AD%D8%A7%D9%81%D8%B8%D8%A9%20%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9%E2%80%AC%204283010",
  },
  {
    id: "cairo-october",
    kind: "maintenance",
    name: "القاهرة (أكتوبر الحصري)",
    address: "المحور المركزي أبراج المدينة 1 بجوار سنتر شاهين",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201044001056",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=%D8%A7%D9%84%D9%85%D8%AD%D9%88%D8%B1%20%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%D9%8A%20%D8%A3%D8%A8%D8%B1%D8%A7%D8%AC%20%D8%A7%D9%84%D9%85%D8%AF%D9%8A%D9%86%D8%A9%201%20%D8%A8%D8%AC%D9%88%D8%A7%D8%B1%20%D8%B3%D9%86%D8%AA%D8%B1%20%D8%B4%D8%A7%D9%87%D9%8A%D9%86",
  },
  {
    id: "dakahlia-mansoura",
    kind: "maintenance",
    name: "الدقهلية (المنصورة)",
    address: "ميدان الطميهي – برج الطاهري الدور 6",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201044001053",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=%D9%85%D9%8A%D8%AF%D8%A7%D9%86%20%D8%A7%D9%84%D8%B7%D9%85%D9%8A%D9%87%D9%8A%20%E2%80%93%20%D8%A8%D8%B1%D8%AC%20%D8%A7%D9%84%D8%B7%D8%A7%D9%87%D8%B1%D9%8A%20%D8%A7%D9%84%D8%AF%D9%88%D8%B1%206",
  },
  {
    id: "sharqia-zagazig",
    kind: "maintenance",
    name: "الشرقية (الزقازيق)",
    address: "ش د/ طلبة عويضة ناصية «تاج بسام»",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201044001071",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=%D8%B4%20%D8%AF%2F%20%D8%B7%D9%84%D8%A8%D8%A9%20%D8%B9%D9%88%D9%8A%D8%B6%D8%A9%20%D9%86%D8%A7%D8%B5%D9%8A%D8%A9%20%C2%AB%D8%AA%D8%A7%D8%AC%20%D8%A8%D8%B3%D8%A7%D9%85%C2%BB",
  },
  {
    id: "alexandria-azarita",
    kind: "maintenance",
    name: "الإسكندرية (الأزاريطة)",
    address: "33 ش د/ عبدالحميد بدوي الدور الأرضي",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201044001054",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=33%20%D8%B4%20%D8%AF%2F%20%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%AD%D9%85%D9%8A%D8%AF%20%D8%A8%D8%AF%D9%88%D9%8A%20%D8%A7%D9%84%D8%AF%D9%88%D8%B1%20%D8%A7%D9%84%D8%A3%D8%B1%D8%B6%D9%8A",
  },
  {
    id: "fayoum-fawal",
    kind: "maintenance",
    name: "الفيوم (الفوال)",
    address: "50 ش توفيق – الفوال – بجوار سنتر الصاف",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201044001057",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=50%20%D8%B4%20%D8%AA%D9%88%D9%81%D9%8A%D9%82%20%E2%80%93%20%D8%A7%D9%84%D9%81%D9%88%D8%A7%D9%84%20%E2%80%93%20%D8%A8%D8%AC%D9%88%D8%A7%D8%B1%20%D8%B3%D9%86%D8%AA%D8%B1%20%D8%A7%D9%84%D8%B5%D8%A7%D9%81",
  },
  {
    id: "tanta-bahr",
    kind: "maintenance",
    name: "طنطا - أول شارع البحر",
    address:
      "طنطا - أول شارع البحر - داون تاون مول - الدور الـ 4 - وحدة رقم 6",
    workingHours: SOKANY_MAINTENANCE_HOURS,
    phoneDigits: "201034450333",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=%20%D8%B7%D9%86%D8%B7%D8%A7%20-%20%D8%A3%D9%88%D9%84%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A7%D9%84%D8%A8%D8%AD%D8%B1%20-%20%D8%AF%D8%A7%D9%88%D9%86%20%D8%AA%D8%A7%D9%8A%D9%86%20%D9%85%D9%88%D9%84%20-%20%D8%A7%D9%84%D8%AF%D9%88%D8%B1%20%D8%A7%D9%84%D9%80%204%20-%20%D9%88%D8%AD%D8%AF%D8%A9%20%D8%B1%D9%82%D9%85%206",
  },
  {
    id: "october-plaza-sales",
    kind: "sales",
    name: "فرع ستور أكتوبر بلازا (بيع ومعاينة)",
    address: "مول أكتوبر بلازا خلف سيلانترو الحصري - مدينة 6 أكتوبر",
    workingHours: SOKANY_SALES_HOURS,
    phoneDigits: "",
    mapUrl: "https://maps.app.goo.gl/Bwsj7WCNUeguAEdX7",
  },
];

export function maintenanceCenters(): SokanyServiceCenter[] {
  return SOKANY_SERVICE_CENTERS.filter((c) => c.kind === "maintenance");
}

export function salesCenters(): SokanyServiceCenter[] {
  return SOKANY_SERVICE_CENTERS.filter((c) => c.kind === "sales");
}
