import {
  EXHIBITION_TIME_ZONE,
  SCHEDULE_PENDING_LABEL_AR,
} from "@/lib/constants/exhibition";
import type { ExhibitionDetails } from "@/lib/types/exhibition";

export type ExhibitionInstant = { startUtcMs: number; endUtcMs: number };

type CalendarEventSource = {
  id: string;
  title: string;
  description: string;
  venueName: string;
  mapUrl: string;
  startUtcMs: number;
  endUtcMs: number;
  /** Bumps the ICS SEQUENCE so calendars accept an updated time. */
  updatedAtMs: number | null;
};

function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - utcMs;
}

/** Converts a Cairo wall-clock time to UTC, honoring Egypt's daylight saving rules. */
export function cairoLocalToUtcMs(date: string, time: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const naive = Date.UTC(y!, mo! - 1, d!, h!, mi!);
  const firstGuess = naive - zoneOffsetMs(naive, EXHIBITION_TIME_ZONE);
  return naive - zoneOffsetMs(firstGuess, EXHIBITION_TIME_ZONE);
}

/** Returns UTC instants only for a complete, announced schedule. */
export function resolveExhibitionInstant(
  details: Pick<
    ExhibitionDetails,
    "scheduleStatus" | "date" | "startTime" | "endTime"
  >,
): ExhibitionInstant | null {
  if (details.scheduleStatus !== "announced") return null;
  if (!details.date || !details.startTime || !details.endTime) return null;
  const startUtcMs = cairoLocalToUtcMs(details.date, details.startTime);
  const endUtcMs = cairoLocalToUtcMs(details.date, details.endTime);
  if (!Number.isFinite(startUtcMs) || endUtcMs <= startUtcMs) return null;
  return { startUtcMs, endUtcMs };
}

export function formatExhibitionDateAr(utcMs: number): string {
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: EXHIBITION_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(utcMs));
}

export function formatExhibitionTimeRangeAr(instant: ExhibitionInstant): string {
  const fmt = new Intl.DateTimeFormat("ar-EG", {
    timeZone: EXHIBITION_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  return `من ${fmt.format(new Date(instant.startUtcMs))} إلى ${fmt.format(new Date(instant.endUtcMs))}`;
}

/** One-line schedule used in the invitation, confirmations, and WhatsApp text. */
export function describeExhibitionSchedule(
  instant: ExhibitionInstant | null,
): string {
  if (!instant) return SCHEDULE_PENDING_LABEL_AR;
  return `${formatExhibitionDateAr(instant.startUtcMs)}، ${formatExhibitionTimeRangeAr(instant)}`;
}

function toIcsUtc(utcMs: number): string {
  return new Date(utcMs).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function calendarDescription(source: CalendarEventSource): string {
  return [
    source.description,
    source.venueName ? `المكان: ${source.venueName}` : "",
    source.mapUrl ? `الخريطة: ${source.mapUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildGoogleCalendarUrl(source: CalendarEventSource): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: source.title,
    dates: `${toIcsUtc(source.startUtcMs)}/${toIcsUtc(source.endUtcMs)}`,
    details: calendarDescription(source),
    location: source.venueName,
    ctz: EXHIBITION_TIME_ZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 folds lines at 75 octets; Arabic is multi-byte, so count bytes. */
function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = chunks.length === 0 ? 75 : 74;
    if (currentBytes + size > limit) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += size;
  }
  chunks.push(current);
  return chunks.join("\r\n ");
}

export function buildExhibitionIcs(
  source: CalendarEventSource,
  nowMs: number = Date.now(),
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//El Maghraby//Exhibitions//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${source.id}@exhibitions.elmaghraby`,
    `DTSTAMP:${toIcsUtc(nowMs)}`,
    `SEQUENCE:${Math.max(0, Math.floor((source.updatedAtMs ?? 0) / 1000))}`,
    `DTSTART:${toIcsUtc(source.startUtcMs)}`,
    `DTEND:${toIcsUtc(source.endUtcMs)}`,
    `SUMMARY:${escapeIcsText(source.title)}`,
    `DESCRIPTION:${escapeIcsText(calendarDescription(source))}`,
    source.venueName ? `LOCATION:${escapeIcsText(source.venueName)}` : "",
    source.mapUrl ? `URL:${source.mapUrl}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`تذكير: ${source.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function exhibitionIcsPath(exhibitionId: string): string {
  return `/api/exhibitions/${encodeURIComponent(exhibitionId)}/calendar`;
}
