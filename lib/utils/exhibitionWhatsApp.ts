import type { ExhibitionMessageKind } from "@/lib/types/exhibition";

export type ExhibitionMessageVars = {
  name: string;
  registrationNumber: string;
  title: string;
  schedule: string;
  venue: string;
  mapUrl: string;
  /** Empty until the schedule is announced. */
  calendarUrl: string;
};

export const EXHIBITION_MESSAGE_PLACEHOLDERS: {
  token: string;
  label: string;
}[] = [
  { token: "{الاسم}", label: "اسم العميل" },
  { token: "{رقم_التسجيل}", label: "رقم التسجيل" },
  { token: "{المعرض}", label: "اسم المعرض" },
  { token: "{الموعد}", label: "الموعد" },
  { token: "{المكان}", label: "المكان" },
  { token: "{الخريطة}", label: "رابط الخريطة" },
  { token: "{التقويم}", label: "رابط إضافة الموعد للتقويم" },
];

export const DEFAULT_EXHIBITION_TEMPLATES: Record<
  ExhibitionMessageKind,
  string
> = {
  invitation: [
    "شريك نجاح المغربي، أ/ {الاسم}",
    "يسعدنا دعوتك لحضور {المعرض}.",
    "رقم تسجيلك: {رقم_التسجيل}",
    "الموعد: {الموعد}",
    "المكان: {المكان}",
    "الخريطة: {الخريطة}",
    "أضف الموعد لتقويمك: {التقويم}",
    "في انتظارك.",
  ].join("\n"),
  reminder: [
    "تذكير من المغربي يا أ/ {الاسم}",
    "{المعرض}",
    "الموعد: {الموعد}",
    "المكان: {المكان}",
    "الخريطة: {الخريطة}",
    "أضف الموعد لتقويمك: {التقويم}",
    "رقم تسجيلك: {رقم_التسجيل}",
    "نتشرف بزيارتك.",
  ].join("\n"),
};

/**
 * Fills placeholders. A line whose placeholder has no value (e.g. no map link
 * yet) is dropped so the customer never receives an empty label.
 */
export function renderExhibitionMessage(
  template: string,
  vars: ExhibitionMessageVars,
): string {
  const values: Record<string, string> = {
    "{الاسم}": vars.name,
    "{رقم_التسجيل}": vars.registrationNumber,
    "{المعرض}": vars.title,
    "{الموعد}": vars.schedule,
    "{المكان}": vars.venue,
    "{الخريطة}": vars.mapUrl,
    "{التقويم}": vars.calendarUrl,
  };
  return template
    .split("\n")
    .filter((line) =>
      Object.entries(values).every(
        ([token, value]) => value.trim() !== "" || !line.includes(token),
      ),
    )
    .map((line) =>
      Object.entries(values).reduce(
        (acc, [token, value]) => acc.split(token).join(value),
        line,
      ),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
