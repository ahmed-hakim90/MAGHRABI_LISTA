import type {
  SerializableFileCard,
  SerializableFileFolder,
} from "@/lib/server/publicCatalogData";

const now = Date.now();
const stamp = { ms: now };

const titles = [
  "قائمة أسعار سوكاني",
  "كتالوج الأجهزة المنزلية",
  "قائمة أسعار الشاشات والترفيه",
  "كتالوج المطابخ والأجهزة المدمجة",
  "قائمة أسعار التبريد",
  "كتالوج المغربي التجاري",
  "قائمة عروض الجملة — سبتمبر 2026",
  "كتالوج الأجهزة الصغيرة",
  "قائمة أسعار شركاء المغربي",
  "كتالوج العناية المنزلية",
  "قائمة أسعار الموسم الجديد",
  "كتالوج الجملة العام",
];

function card(index: number): SerializableFileCard {
  return {
    id: `preview-pdf-${index}`,
    audience: "wholesale",
    title: titles[index % titles.length],
    description: "قائمة أسعار وكتالوج PDF للعرض فقط.",
    category: "",
    tags: ["preview", "wholesale", "pdf"],
    thumbnailUrl: "",
    thumbnailPath: "",
    fileUrl: "#",
    filePath: "",
    fileName: `wholesale-catalog-${index + 1}.pdf`,
    fileSize: 1024 * (480 + index * 31),
    fileType: "pdf",
    storageFolder: "preview",
    folderId: "",
    folderName: "",
    folderIsActive: true,
    order: index,
    isActive: true,
    createdAt: stamp,
    updatedAt: stamp,
    createdBy: "preview",
    updatedBy: "preview",
    version: 1,
    productCount: 0,
    viewCount: 0,
  };
}

export const previewWholesaleFolders: SerializableFileFolder[] = [];

export const previewWholesaleCards: SerializableFileCard[] = Array.from(
  { length: 12 },
  (_, index) => card(index),
);

export const previewWholesaleCatalog = {
  cards: previewWholesaleCards,
  folders: previewWholesaleFolders,
};

export function shouldUsePreviewWholesaleCatalog() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DISABLE_WHOLESALE_PREVIEW !== "1"
  );
}
