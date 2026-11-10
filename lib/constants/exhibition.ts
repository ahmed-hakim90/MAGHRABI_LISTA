import type {
  AttendanceStatus,
  ExhibitionMessageKind,
  ExhibitionScheduleStatus,
} from "@/lib/types/exhibition";

export const EXHIBITION_COLLECTIONS = {
  exhibitions: "exhibitions",
  registrations: "exhibition_registrations",
  messageLogs: "exhibition_message_logs",
} as const;

export const EXHIBITION_TIME_ZONE = "Africa/Cairo";

export const MAX_ATTENDEES_PER_REGISTRATION = 20;
export const REGISTRATION_NAME_MAX_LENGTH = 80;
export const EXHIBITION_MESSAGE_MAX_LENGTH = 1500;
export const REGISTRATIONS_PAGE_SIZE = 50;

export const SCHEDULE_PENDING_LABEL_AR = "سيتم الإعلان عنه قريبًا";

export const SCHEDULE_STATUS_LABELS_AR: Record<ExhibitionScheduleStatus, string> =
  {
    pending: "لم يُعلن بعد",
    announced: "تم الإعلان",
  };

export const ATTENDANCE_STATUS_LABELS_AR: Record<AttendanceStatus, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد الحضور",
  declined: "اعتذر",
};

export const MESSAGE_KIND_LABELS_AR: Record<ExhibitionMessageKind, string> = {
  invitation: "دعوة",
  reminder: "تذكير",
};

/**
 * Season artwork shown at the top of the invitation card, keyed by exhibition
 * id. The artwork carries the title visually; exhibitions without an entry
 * fall back to the text header, so a new season never shows old artwork.
 */
export const EXHIBITION_INVITE_ARTWORK: Record<
  string,
  { src: string; width: number; height: number }
> = {
  "ramadan-2027": {
    src: "/campaigns/ramadan-2027-exhibition.jpg",
    width: 1024,
    height: 512,
  },
};

/** Seed values offered when the admin creates the first exhibition. */
export const RAMADAN_2027_DEFAULTS = {
  id: "ramadan-2027",
  codePrefix: "RM27",
  title: "المعرض السنوي لتشكيلات وإضاءات رمضان 2027",
  shortTitle: "معرض رمضان 2027",
  description:
    "شركاء النجاح… وموسم جديد من الفرص. تشكيلات جديدة، عروض مميزة، وفرص تجارية تستحق اكتشافها.",
  venueName: "المنطقة الصناعية الثالثة – A5 – قطعة 210 – العاشر من رمضان، الشرقية",
  mapUrl: "https://maps.app.goo.gl/hQd2Y9HeEysHPnww8",
} as const;
