import type {
  SerializableFileCard,
  SerializableFileFolder,
} from "@/lib/server/publicCatalogData";

const now = Date.now();
const stamp = { ms: now };

const folderNames = ["أجهزة المطبخ", "الشاشات والترفيه", "التبريد", "العروض التجارية الطويلة"];
const images = [
  "/preview/wholesale-device-a.png",
  "/preview/wholesale-device-b.png",
  "/preview/wholesale-device-c.png",
  "/preview/wholesale-device-d.png",
];
const titles = [
  "غسالة أطباق مدمجة 14 فرد — ستانلس ستيل",
  "فرن بلت إن كهربائي متعدد الوظائف 60 سم",
  "ثلاجة فريزر نوفروست سعة كبيرة",
  "شاشة ذكية 55 بوصة 4K UHD",
  "شفاط مطبخ جداري بتصميم عصري",
  "ميكروويف رقمي 34 لتر مع شواية",
  "فرن بلت إن بلون أسود مطفي — إصدار المطابخ الحديثة",
  "ثلاجة بابين بتقنية التبريد المتوازن",
  "Smart TV 65-inch QLED Ultra HD Model EL-MG-6500",
  "Built-in Dishwasher Premium Series 14 Place Settings",
  "موقد غاز 90 سم بخمس شعلات وإشعال تلقائي",
  "غسالة ملابس أوتوماتيكية 9 كجم — كفاءة عالية",
];

function card(index: number): SerializableFileCard {
  const isUngrouped = index >= 16;
  const folderId = isUngrouped ? "" : `preview-folder-${index % folderNames.length}`;
  return {
    id: `preview-card-${index}`,
    audience: "wholesale",
    title: titles[index % titles.length],
    description: "بيانات معاينة مرئية فقط لاختبار واجهة كتالوج الجملة.",
    category: folderNames[index % folderNames.length],
    tags: ["preview", "wholesale"],
    thumbnailUrl: index === 10 ? "" : images[index % images.length],
    thumbnailPath: "",
    fileUrl: "#",
    filePath: "",
    fileName: `preview-catalog-${index + 1}.pdf`,
    fileSize: 1024 * (320 + index * 17),
    fileType: "pdf",
    storageFolder: "preview",
    folderId,
    folderName: isUngrouped ? "" : folderNames[index % folderNames.length],
    folderIsActive: true,
    order: index,
    isActive: true,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: "preview",
    updatedBy: "preview",
    version: 1,
    productCount: 12 + index,
    viewCount: 0,
  };
}

export const previewWholesaleFolders: SerializableFileFolder[] = folderNames.map(
  (name, index) => ({
    id: `preview-folder-${index}`,
    name,
    description: "قسم معاينة لاختبار ترتيب الكتالوج.",
    order: index,
    isActive: true,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: "preview",
    updatedBy: "preview",
  }),
);

export const previewWholesaleCards: SerializableFileCard[] = Array.from(
  { length: 24 },
  (_, index) => card(index),
);

export const previewWholesaleCatalog = {
  cards: previewWholesaleCards,
  folders: previewWholesaleFolders,
};

export function shouldUsePreviewWholesaleCatalog() {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DISABLE_WHOLESALE_PREVIEW !== "1";
}
