import {
  EXHIBITION_MESSAGE_MAX_LENGTH,
  MAX_ATTENDEES_PER_REGISTRATION,
  REGISTRATION_NAME_MAX_LENGTH,
} from "@/lib/constants/exhibition";
import type {
  AttendanceStatus,
  ExhibitionDetails,
  ExhibitionMessageKind,
  RegistrationInput,
} from "@/lib/types/exhibition";
import { normalizePhoneToWaMeDigits } from "@/lib/utils/siteWhatsappContacts";

export type ParseResult<T, F extends string = string> =
  | { ok: true; value: T }
  | { ok: false; field: F; error: string };

const INVALID_FORM = "بيانات غير صالحة.";

/** Egyptian mobile in wa.me form: 20 + 1[0125] + 8 digits. */
const EGYPT_MOBILE_WA_DIGITS = /^201[0125]\d{8}$/;
const EXHIBITION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_PREFIX = /^[A-Z0-9]{2,8}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
const REGISTRATION_ID = /^[a-z0-9-]{3,40}_201[0125]\d{8}$/;
/** Control, zero-width, and bidi override characters that make names unreadable. */
const UNSAFE_NAME_CHARS =
  /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;

const MAP_HOSTS_ANY_PATH = new Set(["maps.app.goo.gl", "maps.google.com"]);
const MAP_HOSTS_MAPS_PATH = new Set([
  "google.com",
  "www.google.com",
  "google.com.eg",
  "www.google.com.eg",
  "goo.gl",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasOnlyKeys(
  body: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(body).every((k) => allowed.has(k));
}

/** Converts Arabic-Indic and Persian digits so customers can type either. */
export function toWesternDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

export function normalizeEgyptianMobile(raw: string): string | null {
  const digits = normalizePhoneToWaMeDigits(toWesternDigits(raw));
  return EGYPT_MOBILE_WA_DIGITS.test(digits) ? digits : null;
}

export function normalizeCustomerName(raw: string): string | null {
  const name = raw
    .normalize("NFC")
    .replace(UNSAFE_NAME_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length < 2 || name.length > REGISTRATION_NAME_MAX_LENGTH) {
    return null;
  }
  if (/[<>{}]/.test(name)) return null;
  const letters = name.match(/\p{L}/gu)?.length ?? 0;
  return letters >= 2 ? name : null;
}

export function isValidExhibitionId(id: string): boolean {
  return id.length >= 3 && id.length <= 40 && EXHIBITION_ID.test(id);
}

/** One registration per mobile per exhibition: the document id is the guard. */
export function registrationDocId(exhibitionId: string, phone: string): string {
  return `${exhibitionId}_${phone}`;
}

export function isValidRegistrationDocId(id: string): boolean {
  return REGISTRATION_ID.test(id);
}

export function formatRegistrationNumber(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export type RegistrationField =
  | "form"
  | "name"
  | "phone"
  | "attendeeCount"
  | "whatsappConsent";

const REGISTRATION_KEYS = new Set([
  "exhibitionId",
  "name",
  "phone",
  "attendeeCount",
  "whatsappConsent",
  "website",
]);

/**
 * Validates the public registration body. `website` is a hidden honeypot
 * field: real visitors never fill it.
 */
export function parseRegistrationBody(
  raw: unknown,
): ParseResult<RegistrationInput, RegistrationField> {
  if (!isRecord(raw) || !hasOnlyKeys(raw, REGISTRATION_KEYS)) {
    return { ok: false, field: "form", error: INVALID_FORM };
  }
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return { ok: false, field: "form", error: INVALID_FORM };
  }

  const exhibitionId =
    typeof raw.exhibitionId === "string" ? raw.exhibitionId.trim() : "";
  if (!isValidExhibitionId(exhibitionId)) {
    return { ok: false, field: "form", error: INVALID_FORM };
  }

  const name =
    typeof raw.name === "string" ? normalizeCustomerName(raw.name) : null;
  if (!name) {
    return {
      ok: false,
      field: "name",
      error: "اكتب الاسم بالكامل (حرفان على الأقل).",
    };
  }

  const phone =
    typeof raw.phone === "string" ? normalizeEgyptianMobile(raw.phone) : null;
  if (!phone) {
    return {
      ok: false,
      field: "phone",
      error: "اكتب رقم موبايل مصري صحيح، مثل 01012345678.",
    };
  }

  const attendeeCount = raw.attendeeCount;
  if (
    typeof attendeeCount !== "number" ||
    !Number.isInteger(attendeeCount) ||
    attendeeCount < 1 ||
    attendeeCount > MAX_ATTENDEES_PER_REGISTRATION
  ) {
    return {
      ok: false,
      field: "attendeeCount",
      error: `عدد الحضور من 1 إلى ${MAX_ATTENDEES_PER_REGISTRATION}.`,
    };
  }

  if (raw.whatsappConsent !== true) {
    return {
      ok: false,
      field: "whatsappConsent",
      error: "الموافقة على التواصل عبر واتساب مطلوبة لإرسال تفاصيل المعرض.",
    };
  }

  return { ok: true, value: { exhibitionId, name, phone, attendeeCount } };
}

export function isValidIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
  );
}

export function isValidTime(value: string): boolean {
  return HH_MM.test(value);
}

/** Allows only Google Maps links so admin input cannot become an arbitrary link. */
export function isAllowedMapUrl(value: string): boolean {
  if (value.length > 500) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (MAP_HOSTS_ANY_PATH.has(host)) return true;
  return MAP_HOSTS_MAPS_PATH.has(host) && url.pathname.startsWith("/maps");
}

type DetailsField = keyof ExhibitionDetails | "isActive" | "form";

const DETAILS_KEYS = new Set<string>([
  "title",
  "shortTitle",
  "description",
  "scheduleStatus",
  "date",
  "startTime",
  "endTime",
  "venueName",
  "mapUrl",
  "isActive",
]);

export type ExhibitionPatch = Partial<ExhibitionDetails> & {
  isActive?: boolean;
};

function readText(
  raw: Record<string, unknown>,
  key: string,
  max: number,
): string | undefined | null {
  if (!(key in raw)) return undefined;
  const v = raw[key];
  if (typeof v !== "string") return null;
  const text = v.replace(/\r\n/g, "\n").trim();
  return text.length > max ? null : text;
}

/** Field-level validation for an admin PATCH; cross-field rules run on the merged result. */
export function parseExhibitionPatch(
  raw: unknown,
): ParseResult<ExhibitionPatch, DetailsField> {
  if (!isRecord(raw) || !hasOnlyKeys(raw, DETAILS_KEYS)) {
    return { ok: false, field: "form", error: INVALID_FORM };
  }
  const patch: ExhibitionPatch = {};

  const textRules: [keyof ExhibitionDetails, number, number, string][] = [
    ["title", 3, 120, "عنوان المعرض من 3 إلى 120 حرفًا."],
    ["shortTitle", 3, 40, "الاسم المختصر من 3 إلى 40 حرفًا."],
    ["description", 0, 600, "نص الدعوة حتى 600 حرف."],
    ["venueName", 0, 160, "المكان حتى 160 حرفًا."],
  ];
  for (const [key, min, max, error] of textRules) {
    const v = readText(raw, key, max);
    if (v === undefined) continue;
    if (v === null || v.length < min) return { ok: false, field: key, error };
    (patch as Record<string, unknown>)[key] = v;
  }

  if ("scheduleStatus" in raw) {
    if (raw.scheduleStatus !== "pending" && raw.scheduleStatus !== "announced") {
      return { ok: false, field: "scheduleStatus", error: INVALID_FORM };
    }
    patch.scheduleStatus = raw.scheduleStatus;
  }

  const date = readText(raw, "date", 10);
  if (date !== undefined) {
    if (date === null || (date !== "" && !isValidIsoDate(date))) {
      return { ok: false, field: "date", error: "تاريخ غير صالح." };
    }
    patch.date = date;
  }

  for (const key of ["startTime", "endTime"] as const) {
    const v = readText(raw, key, 5);
    if (v === undefined) continue;
    if (v === null || (v !== "" && !isValidTime(v))) {
      return { ok: false, field: key, error: "وقت غير صالح." };
    }
    patch[key] = v;
  }

  const mapUrl = readText(raw, "mapUrl", 500);
  if (mapUrl !== undefined) {
    if (mapUrl === null || (mapUrl !== "" && !isAllowedMapUrl(mapUrl))) {
      return {
        ok: false,
        field: "mapUrl",
        error: "رابط الخريطة يجب أن يكون رابط Google Maps يبدأ بـ https.",
      };
    }
    patch.mapUrl = mapUrl;
  }

  if ("isActive" in raw) {
    if (typeof raw.isActive !== "boolean") {
      return { ok: false, field: "isActive", error: INVALID_FORM };
    }
    patch.isActive = raw.isActive;
  }

  return { ok: true, value: patch };
}

/** An announced schedule must be complete so calendars never receive a guessed time. */
export function validateAnnouncedSchedule(
  details: ExhibitionDetails,
): ParseResult<true, DetailsField> {
  if (details.scheduleStatus !== "announced") return { ok: true, value: true };
  if (!isValidIsoDate(details.date)) {
    return { ok: false, field: "date", error: "حدد تاريخ المعرض قبل الإعلان." };
  }
  if (!isValidTime(details.startTime) || !isValidTime(details.endTime)) {
    return {
      ok: false,
      field: "startTime",
      error: "حدد موعد البداية والنهاية قبل الإعلان.",
    };
  }
  if (details.endTime <= details.startTime) {
    return {
      ok: false,
      field: "endTime",
      error: "موعد النهاية يجب أن يكون بعد موعد البداية.",
    };
  }
  if (!details.venueName) {
    return { ok: false, field: "venueName", error: "حدد مكان المعرض قبل الإعلان." };
  }
  return { ok: true, value: true };
}

export type NewExhibitionInput = {
  id: string;
  codePrefix: string;
  title: string;
  shortTitle: string;
  description: string;
  venueName: string;
  mapUrl: string;
};

const CREATE_KEYS = new Set([
  "id",
  "codePrefix",
  "title",
  "shortTitle",
  "description",
  "venueName",
  "mapUrl",
]);

export function parseNewExhibitionBody(
  raw: unknown,
): ParseResult<NewExhibitionInput> {
  if (!isRecord(raw) || !hasOnlyKeys(raw, CREATE_KEYS)) {
    return { ok: false, field: "form", error: INVALID_FORM };
  }
  const id = typeof raw.id === "string" ? raw.id.trim().toLowerCase() : "";
  if (!isValidExhibitionId(id)) {
    return {
      ok: false,
      field: "id",
      error: "المعرّف بحروف إنجليزية صغيرة وأرقام وشرطات، مثل ramadan-2028.",
    };
  }
  const codePrefix =
    typeof raw.codePrefix === "string" ? raw.codePrefix.trim().toUpperCase() : "";
  if (!CODE_PREFIX.test(codePrefix)) {
    return {
      ok: false,
      field: "codePrefix",
      error: "بادئة رقم التسجيل من 2 إلى 8 حروف إنجليزية أو أرقام، مثل RM28.",
    };
  }
  const details = parseExhibitionPatch({
    title: raw.title,
    shortTitle: raw.shortTitle,
    description: raw.description ?? "",
    venueName: raw.venueName ?? "",
    mapUrl: raw.mapUrl ?? "",
  });
  if (!details.ok) return details;
  const { title, shortTitle, description, venueName, mapUrl } = details.value;
  if (!title || !shortTitle) {
    return { ok: false, field: "title", error: "العنوان والاسم المختصر مطلوبان." };
  }
  return {
    ok: true,
    value: {
      id,
      codePrefix,
      title,
      shortTitle,
      description: description ?? "",
      venueName: venueName ?? "",
      mapUrl: mapUrl ?? "",
    },
  };
}

export function parseAttendanceStatus(raw: unknown): AttendanceStatus | null {
  return raw === "pending" || raw === "confirmed" || raw === "declined"
    ? raw
    : null;
}

export function parseMessageKind(raw: unknown): ExhibitionMessageKind | null {
  return raw === "invitation" || raw === "reminder" ? raw : null;
}

export type MessageLogInput = {
  registrationId: string;
  kind: ExhibitionMessageKind;
  message: string;
};

const MESSAGE_LOG_KEYS = new Set(["registrationId", "kind", "message"]);

export function parseMessageLogBody(raw: unknown): ParseResult<MessageLogInput> {
  if (!isRecord(raw) || !hasOnlyKeys(raw, MESSAGE_LOG_KEYS)) {
    return { ok: false, field: "form", error: INVALID_FORM };
  }
  const registrationId =
    typeof raw.registrationId === "string" ? raw.registrationId : "";
  if (!isValidRegistrationDocId(registrationId)) {
    return { ok: false, field: "registrationId", error: INVALID_FORM };
  }
  const kind = parseMessageKind(raw.kind);
  if (!kind) return { ok: false, field: "kind", error: INVALID_FORM };
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  if (!message || message.length > EXHIBITION_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      field: "message",
      error: `نص الرسالة مطلوب وحتى ${EXHIBITION_MESSAGE_MAX_LENGTH} حرف.`,
    };
  }
  return { ok: true, value: { registrationId, kind, message } };
}
