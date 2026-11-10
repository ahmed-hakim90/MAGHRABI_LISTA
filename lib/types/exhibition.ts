/** Schedule visibility: dates stay private until the admin announces them. */
export type ExhibitionScheduleStatus = "pending" | "announced";

export type AttendanceStatus = "pending" | "confirmed" | "declined";

export type ExhibitionMessageKind = "invitation" | "reminder";

/** Editable invitation content. Date/time are Cairo local wall-clock values. */
export type ExhibitionDetails = {
  title: string;
  shortTitle: string;
  description: string;
  scheduleStatus: ExhibitionScheduleStatus;
  /** YYYY-MM-DD in Africa/Cairo, empty until set. */
  date: string;
  /** HH:mm in Africa/Cairo, empty until set. */
  startTime: string;
  endTime: string;
  venueName: string;
  mapUrl: string;
};

export type Exhibition = ExhibitionDetails & {
  id: string;
  codePrefix: string;
  isActive: boolean;
  registrationSeq: number;
  updatedAtMs: number | null;
};

export type ExhibitionSummary = Pick<
  Exhibition,
  "id" | "title" | "shortTitle" | "isActive" | "scheduleStatus"
>;

/** Safe public projection: draft dates are never exposed before announcement. */
export type PublicExhibition = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  venueName: string;
  mapUrl: string;
  schedule: {
    date: string;
    startTime: string;
    endTime: string;
    startUtcMs: number;
    endUtcMs: number;
  } | null;
  calendar: { googleUrl: string; icsPath: string } | null;
};

export type ExhibitionStats = {
  registrations: number;
  expectedAttendees: number;
  contacted: number;
  confirmed: number;
};

export type ExhibitionRegistration = {
  id: string;
  registrationNumber: string;
  name: string;
  phone: string;
  attendeeCount: number;
  attendanceStatus: AttendanceStatus;
  contactCount: number;
  lastMessageKind: ExhibitionMessageKind | null;
  lastContactedAtMs: number | null;
  createdAtMs: number | null;
};

export type RegistrationInput = {
  exhibitionId: string;
  name: string;
  phone: string;
  attendeeCount: number;
};

export type RegistrationResult = {
  registrationNumber: string;
  alreadyRegistered: boolean;
};
