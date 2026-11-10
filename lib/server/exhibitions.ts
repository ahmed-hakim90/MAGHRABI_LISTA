import {
  AggregateField,
  FieldValue,
  type DocumentData,
  type Firestore,
  type Query,
} from "firebase-admin/firestore";
import {
  EXHIBITION_COLLECTIONS,
  REGISTRATIONS_PAGE_SIZE,
} from "@/lib/constants/exhibition";
import type {
  AttendanceStatus,
  Exhibition,
  ExhibitionDetails,
  ExhibitionRegistration,
  ExhibitionStats,
  ExhibitionSummary,
  PublicExhibition,
  RegistrationInput,
  RegistrationResult,
} from "@/lib/types/exhibition";
import {
  buildGoogleCalendarUrl,
  exhibitionIcsPath,
  resolveExhibitionInstant,
} from "@/lib/utils/exhibitionSchedule";
import {
  formatRegistrationNumber,
  isValidRegistrationDocId,
  normalizeEgyptianMobile,
  registrationDocId,
  validateAnnouncedSchedule,
  type ExhibitionPatch,
  type MessageLogInput,
  type NewExhibitionInput,
} from "@/lib/utils/exhibitionValidation";

/** Domain failure with a user-safe Arabic message and HTTP status. */
export class ExhibitionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Public invitation data holds no customer data, so Vercel's CDN may share it
 * briefly. Browsers always revalidate, so a published schedule shows on the
 * next page load once the CDN copy (at most ~1 minute) expires.
 */
export const PUBLIC_EXHIBITION_CACHE_HEADERS = {
  "Cache-Control": "no-cache",
  "Vercel-CDN-Cache-Control": "max-age=30, stale-while-revalidate=30",
} as const;

const GRPC_ALREADY_EXISTS = 6;
const GRPC_FAILED_PRECONDITION = 9;

/** Arabic, user-safe message for a Firestore index failure, or null for other errors. */
export function describeIndexFailure(err: unknown): string | null {
  if ((err as { code?: unknown })?.code !== GRPC_FAILED_PRECONDITION) return null;
  const detail = String(
    (err as { details?: unknown }).details ?? (err as Error).message ?? "",
  );
  return detail.includes("currently building")
    ? "فهارس المعرض قيد الإنشاء في Firebase الآن. أعد المحاولة بعد دقائق."
    : "فهارس قاعدة البيانات الخاصة بالمعرض غير منشورة بعد. انشر firestore.indexes.json ثم أعد المحاولة.";
}

/** Maps known Firestore failures to safe responses; unknown errors stay generic. */
export function exhibitionErrorResponse(err: unknown, context: string): Response {
  if (err instanceof ExhibitionError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const code = (err as { code?: unknown })?.code;
  const indexMessage = describeIndexFailure(err);
  if (indexMessage) {
    console.error(`[exhibitions] ${context}: Firestore index not ready`);
    return Response.json({ error: indexMessage }, { status: 503 });
  }
  console.error(`[exhibitions] ${context} failed`, {
    code: typeof code === "number" || typeof code === "string" ? code : undefined,
  });
  return Response.json(
    { error: "تعذّر إتمام العملية. حاول مرة أخرى." },
    { status: 500 },
  );
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function millis(v: unknown): number | null {
  const fn = (v as { toMillis?: () => number } | null)?.toMillis;
  return typeof fn === "function" ? fn.call(v) : null;
}

function exhibitionsCol(db: Firestore) {
  return db.collection(EXHIBITION_COLLECTIONS.exhibitions);
}

function registrationsCol(db: Firestore) {
  return db.collection(EXHIBITION_COLLECTIONS.registrations);
}

function toExhibition(id: string, data: DocumentData): Exhibition {
  return {
    id,
    codePrefix: str(data.codePrefix),
    title: str(data.title),
    shortTitle: str(data.shortTitle),
    description: str(data.description),
    scheduleStatus: data.scheduleStatus === "announced" ? "announced" : "pending",
    date: str(data.date),
    startTime: str(data.startTime),
    endTime: str(data.endTime),
    venueName: str(data.venueName),
    mapUrl: str(data.mapUrl),
    isActive: data.isActive === true,
    registrationSeq: Number(data.registrationSeq ?? 0),
    updatedAtMs: millis(data.updatedAt),
  };
}

function toRegistration(id: string, data: DocumentData): ExhibitionRegistration {
  const status = data.attendanceStatus;
  return {
    id,
    registrationNumber: str(data.registrationNumber),
    name: str(data.name),
    phone: str(data.phone),
    attendeeCount: Number(data.attendeeCount ?? 0),
    attendanceStatus:
      status === "confirmed" || status === "declined" ? status : "pending",
    contactCount: Number(data.contactCount ?? 0),
    lastMessageKind:
      data.lastMessageKind === "invitation" || data.lastMessageKind === "reminder"
        ? data.lastMessageKind
        : null,
    lastContactedAtMs: millis(data.lastContactedAt),
    createdAtMs: millis(data.createdAt),
  };
}

export function toPublicExhibition(ex: Exhibition): PublicExhibition {
  const instant = resolveExhibitionInstant(ex);
  return {
    id: ex.id,
    title: ex.title,
    shortTitle: ex.shortTitle,
    description: ex.description,
    venueName: ex.venueName,
    mapUrl: ex.mapUrl,
    schedule: instant
      ? {
          date: ex.date,
          startTime: ex.startTime,
          endTime: ex.endTime,
          ...instant,
        }
      : null,
    calendar: instant
      ? {
          googleUrl: buildGoogleCalendarUrl({ ...ex, ...instant }),
          icsPath: exhibitionIcsPath(ex.id),
        }
      : null,
  };
}

export async function getActiveExhibition(
  db: Firestore,
): Promise<Exhibition | null> {
  const snap = await exhibitionsCol(db).where("isActive", "==", true).limit(1).get();
  const doc = snap.docs[0];
  return doc ? toExhibition(doc.id, doc.data()) : null;
}

export async function getExhibition(
  db: Firestore,
  id: string,
): Promise<Exhibition | null> {
  const snap = await exhibitionsCol(db).doc(id).get();
  return snap.exists ? toExhibition(snap.id, snap.data()!) : null;
}

export async function listExhibitionSummaries(
  db: Firestore,
): Promise<ExhibitionSummary[]> {
  const snap = await exhibitionsCol(db).orderBy("createdAt", "desc").limit(50).get();
  return snap.docs.map((d) => {
    const ex = toExhibition(d.id, d.data());
    return {
      id: ex.id,
      title: ex.title,
      shortTitle: ex.shortTitle,
      isActive: ex.isActive,
      scheduleStatus: ex.scheduleStatus,
    };
  });
}

export async function createExhibition(
  db: Firestore,
  input: NewExhibitionInput,
  adminUid: string,
): Promise<void> {
  try {
    await exhibitionsCol(db)
      .doc(input.id)
      .create({
        codePrefix: input.codePrefix,
        title: input.title,
        shortTitle: input.shortTitle,
        description: input.description,
        scheduleStatus: "pending",
        date: "",
        startTime: "",
        endTime: "",
        venueName: input.venueName,
        mapUrl: input.mapUrl,
        isActive: false,
        registrationSeq: 0,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: adminUid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: adminUid,
      });
  } catch (err) {
    if ((err as { code?: unknown })?.code === GRPC_ALREADY_EXISTS) {
      throw new ExhibitionError("يوجد معرض بنفس المعرّف.", 409);
    }
    throw err;
  }
}

/**
 * Applies an admin edit atomically. Activating one exhibition deactivates the
 * others so the public site always shows exactly one invitation.
 */
export async function updateExhibition(
  db: Firestore,
  id: string,
  patch: ExhibitionPatch,
  adminUid: string,
): Promise<Exhibition> {
  const ref = exhibitionsCol(db).doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ExhibitionError("المعرض غير موجود.", 404);
    const othersActive =
      patch.isActive === true
        ? await tx.get(exhibitionsCol(db).where("isActive", "==", true))
        : null;

    const current = toExhibition(id, snap.data()!);
    const merged: ExhibitionDetails = { ...current, ...patch };
    const check = validateAnnouncedSchedule(merged);
    if (!check.ok) throw new ExhibitionError(check.error, 400);

    for (const other of othersActive?.docs ?? []) {
      if (other.id === id) continue;
      tx.update(other.ref, {
        isActive: false,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: adminUid,
      });
    }
    tx.update(ref, {
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminUid,
    });
  });
  const updated = await getExhibition(db, id);
  if (!updated) throw new ExhibitionError("المعرض غير موجود.", 404);
  return updated;
}

/**
 * Creates the registration and its sequential number in one transaction.
 * A repeat submit for the same mobile returns the existing number.
 */
export async function registerForExhibition(
  db: Firestore,
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const exRef = exhibitionsCol(db).doc(input.exhibitionId);
  const regRef = registrationsCol(db).doc(
    registrationDocId(input.exhibitionId, input.phone),
  );

  return db.runTransaction(async (tx) => {
    const [exSnap, regSnap] = await tx.getAll(exRef, regRef);
    if (!exSnap.exists || exSnap.data()?.isActive !== true) {
      throw new ExhibitionError("التسجيل في هذا المعرض غير متاح حاليًا.", 404);
    }
    if (regSnap.exists) {
      return {
        registrationNumber: str(regSnap.data()?.registrationNumber),
        alreadyRegistered: true,
      };
    }

    const ex = toExhibition(exSnap.id, exSnap.data()!);
    const seq = ex.registrationSeq + 1;
    const registrationNumber = formatRegistrationNumber(ex.codePrefix, seq);
    tx.update(exRef, { registrationSeq: seq });
    tx.create(regRef, {
      exhibitionId: input.exhibitionId,
      registrationNumber,
      name: input.name,
      phone: input.phone,
      attendeeCount: input.attendeeCount,
      whatsappConsent: true,
      consentAt: FieldValue.serverTimestamp(),
      attendanceStatus: "pending",
      contacted: false,
      contactCount: 0,
      lastMessageKind: null,
      lastContactedAt: null,
      source: "website",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { registrationNumber, alreadyRegistered: false };
  });
}

export async function getExhibitionStats(
  db: Firestore,
  exhibitionId: string,
): Promise<ExhibitionStats> {
  const base = registrationsCol(db).where("exhibitionId", "==", exhibitionId);
  const [totals, declined, contacted, confirmed] = await Promise.all([
    base
      .aggregate({
        count: AggregateField.count(),
        attendees: AggregateField.sum("attendeeCount"),
      })
      .get(),
    base
      .where("attendanceStatus", "==", "declined")
      .aggregate({ attendees: AggregateField.sum("attendeeCount") })
      .get(),
    base.where("contacted", "==", true).count().get(),
    base.where("attendanceStatus", "==", "confirmed").count().get(),
  ]);
  const totalAttendees = Number(totals.data().attendees ?? 0);
  const declinedAttendees = Number(declined.data().attendees ?? 0);
  return {
    registrations: totals.data().count,
    expectedAttendees: Math.max(0, totalAttendees - declinedAttendees),
    contacted: contacted.data().count,
    confirmed: confirmed.data().count,
  };
}

export type RegistrationFilters = {
  status: AttendanceStatus | null;
  contacted: boolean | null;
  search: string;
  cursor: string;
};

/**
 * Newest-first page. Search is an exact match on mobile or registration
 * number so it stays index-backed as the list grows.
 */
export async function listRegistrationsPage(
  db: Firestore,
  exhibitionId: string,
  filters: RegistrationFilters,
): Promise<{ items: ExhibitionRegistration[]; nextCursor: string | null }> {
  const search = filters.search.trim();
  if (search) {
    const phone = normalizeEgyptianMobile(search);
    if (phone) {
      const snap = await registrationsCol(db)
        .doc(registrationDocId(exhibitionId, phone))
        .get();
      return {
        items: snap.exists ? [toRegistration(snap.id, snap.data()!)] : [],
        nextCursor: null,
      };
    }
    const snap = await registrationsCol(db)
      .where("exhibitionId", "==", exhibitionId)
      .where("registrationNumber", "==", search.toUpperCase())
      .limit(1)
      .get();
    return {
      items: snap.docs.map((d) => toRegistration(d.id, d.data())),
      nextCursor: null,
    };
  }

  let query: Query = registrationsCol(db).where("exhibitionId", "==", exhibitionId);
  if (filters.status) query = query.where("attendanceStatus", "==", filters.status);
  if (filters.contacted !== null) {
    query = query.where("contacted", "==", filters.contacted);
  }
  query = query.orderBy("createdAt", "desc");

  if (filters.cursor && isValidRegistrationDocId(filters.cursor)) {
    const cursorSnap = await registrationsCol(db).doc(filters.cursor).get();
    if (cursorSnap.exists && cursorSnap.data()?.exhibitionId === exhibitionId) {
      query = query.startAfter(cursorSnap);
    }
  }

  const snap = await query.limit(REGISTRATIONS_PAGE_SIZE + 1).get();
  const docs = snap.docs.slice(0, REGISTRATIONS_PAGE_SIZE);
  return {
    items: docs.map((d) => toRegistration(d.id, d.data())),
    nextCursor:
      snap.docs.length > REGISTRATIONS_PAGE_SIZE
        ? docs[docs.length - 1]!.id
        : null,
  };
}

async function getOwnedRegistrationRef(
  db: Firestore,
  exhibitionId: string,
  registrationId: string,
) {
  if (!isValidRegistrationDocId(registrationId)) {
    throw new ExhibitionError("التسجيل غير موجود.", 404);
  }
  const ref = registrationsCol(db).doc(registrationId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.exhibitionId !== exhibitionId) {
    throw new ExhibitionError("التسجيل غير موجود.", 404);
  }
  return ref;
}

export async function setAttendanceStatus(
  db: Firestore,
  exhibitionId: string,
  registrationId: string,
  status: AttendanceStatus,
  adminUid: string,
): Promise<void> {
  const ref = await getOwnedRegistrationRef(db, exhibitionId, registrationId);
  await ref.update({
    attendanceStatus: status,
    attendanceUpdatedAt: FieldValue.serverTimestamp(),
    attendanceUpdatedBy: adminUid,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Records that an admin opened a WhatsApp chat with the prepared text.
 * WhatsApp does not report delivery, so this is an "opened" log.
 */
export async function recordWhatsAppOpened(
  db: Firestore,
  exhibitionId: string,
  input: MessageLogInput,
  adminUid: string,
): Promise<void> {
  const regRef = await getOwnedRegistrationRef(
    db,
    exhibitionId,
    input.registrationId,
  );
  const batch = db.batch();
  batch.create(db.collection(EXHIBITION_COLLECTIONS.messageLogs).doc(), {
    exhibitionId,
    registrationId: input.registrationId,
    kind: input.kind,
    channel: "whatsapp_manual",
    message: input.message,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: adminUid,
  });
  batch.update(regRef, {
    contacted: true,
    contactCount: FieldValue.increment(1),
    lastMessageKind: input.kind,
    lastContactedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

/** Streams every registration in pages for export; bounded per round trip. */
export async function listAllRegistrations(
  db: Firestore,
  exhibitionId: string,
): Promise<ExhibitionRegistration[]> {
  const out: ExhibitionRegistration[] = [];
  let query = registrationsCol(db)
    .where("exhibitionId", "==", exhibitionId)
    .orderBy("createdAt", "desc")
    .limit(500);
  for (;;) {
    const snap = await query.get();
    out.push(...snap.docs.map((d) => toRegistration(d.id, d.data())));
    if (snap.docs.length < 500) break;
    query = query.startAfter(snap.docs[snap.docs.length - 1]!);
  }
  return out;
}
