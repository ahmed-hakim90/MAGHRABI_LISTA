import { getAdminFirestore } from "@/lib/firebase/admin";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import type {
  PriceListItemPublic,
  PriceListPublic,
} from "@/lib/types/priceList";

const LISTS = "price_lists";
const ITEMS = "price_list_items";

function toPublicList(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PriceListPublic {
  return {
    id,
    audience: normalizeAudienceFromDoc(data.audience),
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    pdfUrl: String(data.pdfUrl ?? ""),
    coverImage: String(data.coverImage ?? ""),
    linkedFileCardId: String(data.linkedFileCardId ?? "") || undefined,
  };
}

function toPublicItem(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PriceListItemPublic {
  return {
    id,
    sku: String(data.sku ?? ""),
    name: String(data.name ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    unit: String(data.unit ?? ""),
    cartonQty: Number(data.cartonQty ?? 1),
    price: Number(data.price ?? 0),
    sortOrder: Number(data.sortOrder ?? 0),
  };
}

export async function getActivePriceLists(
  audience?: CatalogAudience,
): Promise<PriceListPublic[]> {
  const db = getAdminFirestore();
  let q = db.collection(LISTS).where("isActive", "==", true);
  if (audience) {
    q = q.where("audience", "==", audience);
  }
  const snap = await q.orderBy("name").get();
  return snap.docs.map((d) => toPublicList(d.id, d.data()));
}

export async function getActivePriceListBySlug(
  slug: string,
  audience: CatalogAudience,
): Promise<PriceListPublic | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(LISTS)
    .where("slug", "==", slug)
    .where("audience", "==", audience)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return toPublicList(d.id, d.data());
}

/** Resolve slug across channels (legacy /price-lists/[slug] redirect). */
export async function findActivePriceListBySlug(
  slug: string,
): Promise<PriceListPublic | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(LISTS)
    .where("slug", "==", slug)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return toPublicList(d.id, d.data());
}

export async function getActiveItemsForList(
  listId: string,
): Promise<PriceListItemPublic[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(ITEMS)
    .where("listId", "==", listId)
    .where("listIsActive", "==", true)
    .where("isActive", "==", true)
    .get();
  return snap.docs
    .map((d) => toPublicItem(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.sku.localeCompare(b.sku));
}
