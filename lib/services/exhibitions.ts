"use client";

import type {
  AttendanceStatus,
  Exhibition,
  ExhibitionMessageKind,
  ExhibitionRegistration,
  ExhibitionStats,
  ExhibitionSummary,
  PublicExhibition,
  RegistrationResult,
} from "@/lib/types/exhibition";
import type { ExhibitionPatch, NewExhibitionInput } from "@/lib/utils/exhibitionValidation";

/** Carries the server's Arabic message and, for form errors, the field to highlight. */
export class ExhibitionRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly field?: string,
  ) {
    super(message);
  }
}

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  let data: (T & { error?: string; field?: string }) | null = null;
  try {
    data = (await res.json()) as T & { error?: string; field?: string };
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ExhibitionRequestError(
      data?.error ?? fallback,
      res.status,
      data?.field,
    );
  }
  if (!data) throw new ExhibitionRequestError(fallback, res.status);
  return data;
}

export async function fetchActiveExhibition(
  signal?: AbortSignal,
): Promise<PublicExhibition | null> {
  const res = await fetch("/api/exhibitions/active", { signal });
  const data = await readJson<{ exhibition: PublicExhibition | null }>(
    res,
    "تعذّر تحميل الدعوة",
  );
  return data.exhibition;
}

export async function submitExhibitionRegistration(body: {
  exhibitionId: string;
  name: string;
  phone: string;
  attendeeCount: number;
  whatsappConsent: boolean;
  website: string;
}): Promise<RegistrationResult> {
  const res = await fetch("/api/exhibitions/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson<RegistrationResult>(res, "تعذّر إتمام التسجيل. حاول مرة أخرى.");
}

function authHeaders(token: string, json = false): HeadersInit {
  return json
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${token}` };
}

function exhibitionPath(id: string): string {
  return `/api/admin/exhibitions/${encodeURIComponent(id)}`;
}

export async function listExhibitionsAdmin(
  token: string,
): Promise<ExhibitionSummary[]> {
  const res = await fetch("/api/admin/exhibitions", {
    headers: authHeaders(token),
  });
  const data = await readJson<{ exhibitions: ExhibitionSummary[] }>(
    res,
    "تعذّر تحميل المعارض",
  );
  return data.exhibitions;
}

export async function createExhibitionAdmin(
  token: string,
  input: NewExhibitionInput,
): Promise<void> {
  const res = await fetch("/api/admin/exhibitions", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(input),
  });
  await readJson<{ ok: true }>(res, "تعذّر إنشاء المعرض");
}

export async function getExhibitionAdmin(
  token: string,
  id: string,
): Promise<{
  exhibition: Exhibition;
  stats: ExhibitionStats | null;
  statsError: string | null;
}> {
  const res = await fetch(exhibitionPath(id), { headers: authHeaders(token) });
  return readJson(res, "تعذّر تحميل بيانات المعرض");
}

export async function updateExhibitionAdmin(
  token: string,
  id: string,
  patch: ExhibitionPatch,
): Promise<Exhibition> {
  const res = await fetch(exhibitionPath(id), {
    method: "PATCH",
    headers: authHeaders(token, true),
    body: JSON.stringify(patch),
  });
  const data = await readJson<{ exhibition: Exhibition }>(res, "تعذّر حفظ التعديلات");
  return data.exhibition;
}

export type RegistrationListQuery = {
  status: AttendanceStatus | "";
  contacted: "" | "yes" | "no";
  search: string;
  cursor: string;
};

export async function listRegistrationsAdmin(
  token: string,
  exhibitionId: string,
  query: RegistrationListQuery,
): Promise<{ items: ExhibitionRegistration[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.contacted) params.set("contacted", query.contacted);
  if (query.search.trim()) params.set("q", query.search.trim());
  if (query.cursor) params.set("cursor", query.cursor);
  const res = await fetch(
    `${exhibitionPath(exhibitionId)}/registrations?${params.toString()}`,
    { headers: authHeaders(token) },
  );
  return readJson(res, "تعذّر تحميل المسجلين");
}

export async function setAttendanceStatusAdmin(
  token: string,
  exhibitionId: string,
  registrationId: string,
  attendanceStatus: AttendanceStatus,
): Promise<void> {
  const res = await fetch(
    `${exhibitionPath(exhibitionId)}/registrations/${encodeURIComponent(registrationId)}`,
    {
      method: "PATCH",
      headers: authHeaders(token, true),
      body: JSON.stringify({ attendanceStatus }),
    },
  );
  await readJson<{ ok: true }>(res, "تعذّر تحديث حالة الحضور");
}

export async function logWhatsAppOpenedAdmin(
  token: string,
  exhibitionId: string,
  input: { registrationId: string; kind: ExhibitionMessageKind; message: string },
): Promise<void> {
  const res = await fetch(`${exhibitionPath(exhibitionId)}/message-logs`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(input),
  });
  await readJson<{ ok: true }>(res, "تعذّر تسجيل محاولة التواصل");
}

export async function downloadRegistrationsExcel(
  token: string,
  exhibitionId: string,
): Promise<void> {
  const res = await fetch(`${exhibitionPath(exhibitionId)}/export`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    await readJson(res, "تعذّر تصدير الملف");
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exhibitionId}-registrations.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
