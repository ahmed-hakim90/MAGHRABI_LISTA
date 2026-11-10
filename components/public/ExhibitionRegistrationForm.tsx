"use client";

import { useRef, useState } from "react";
import { MAX_ATTENDEES_PER_REGISTRATION } from "@/lib/constants/exhibition";
import {
  ExhibitionRequestError,
  submitExhibitionRegistration,
} from "@/lib/services/exhibitions";
import type { RegistrationResult } from "@/lib/types/exhibition";
import {
  parseRegistrationBody,
  type RegistrationField,
} from "@/lib/utils/exhibitionValidation";

const INPUT_CLASS =
  "mt-1 block min-h-touch w-full rounded-xl border bg-white px-3 py-2.5 text-base text-brand-gray outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";

const ATTENDEE_OPTIONS = Array.from(
  { length: MAX_ATTENDEES_PER_REGISTRATION },
  (_, i) => i + 1,
);

export function ExhibitionRegistrationForm({
  exhibitionId,
  onRegistered,
  onBack,
}: {
  exhibitionId: string;
  onRegistered: (result: RegistrationResult) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [fieldError, setFieldError] = useState<{
    field: RegistrationField;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function showFieldError(field: RegistrationField, message: string) {
    setFieldError({ field, message });
    if (field === "form") return;
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${field}"]`)
        ?.focus();
    });
  }

  async function submitRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;

    const body = {
      exhibitionId,
      name,
      phone,
      attendeeCount,
      whatsappConsent: consent,
      website,
    };
    const local = parseRegistrationBody(body);
    if (!local.ok) {
      showFieldError(local.field, local.error);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setFieldError(null);
    try {
      onRegistered(await submitExhibitionRegistration(body));
    } catch (err) {
      const field =
        err instanceof ExhibitionRequestError &&
        ["name", "phone", "attendeeCount", "whatsappConsent"].includes(
          err.field ?? "",
        )
          ? (err.field as RegistrationField)
          : "form";
      showFieldError(
        field,
        err instanceof ExhibitionRequestError
          ? err.message
          : "تعذّر الاتصال. تحقق من الإنترنت ثم حاول مرة أخرى.",
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  const errorFor = (field: RegistrationField) =>
    fieldError?.field === field ? fieldError.message : null;
  const borderFor = (field: RegistrationField) =>
    errorFor(field) ? "border-brand-red" : "border-brand-gold/40";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => void submitRegistration(e)}
      className="space-y-4"
      aria-describedby="exhibition-form-hint"
    >
      <div>
        <h3 className="text-lg font-bold text-brand-burgundy">سجّل حضورك الآن</h3>
        <p id="exhibition-form-hint" className="mt-1 text-sm text-brand-gray/80">
          كن من ضيوف المعرض، وسنرسل لك تفاصيل الموعد والموقع عبر واتساب.
        </p>
      </div>

      <label className="block text-sm font-medium text-brand-gray">
        الاسم بالكامل
        <input
          data-autofocus
          name="name"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errorFor("name"))}
          aria-describedby={errorFor("name") ? "exhibition-name-error" : undefined}
          className={`${INPUT_CLASS} ${borderFor("name")}`}
        />
        {errorFor("name") ? (
          <span id="exhibition-name-error" className="mt-1 block text-xs text-brand-red">
            {errorFor("name")}
          </span>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-brand-gray">
        رقم الموبايل / واتساب
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          placeholder="01xxxxxxxxx"
          maxLength={20}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={Boolean(errorFor("phone"))}
          aria-describedby={errorFor("phone") ? "exhibition-phone-error" : undefined}
          className={`${INPUT_CLASS} text-start ${borderFor("phone")}`}
        />
        {errorFor("phone") ? (
          <span id="exhibition-phone-error" className="mt-1 block text-xs text-brand-red">
            {errorFor("phone")}
          </span>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-brand-gray">
        عدد الحضور
        <select
          name="attendeeCount"
          value={attendeeCount}
          onChange={(e) => setAttendeeCount(Number(e.target.value))}
          className={`${INPUT_CLASS} ${borderFor("attendeeCount")}`}
        >
          {ATTENDEE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "شخص واحد" : n === 2 ? "شخصان" : `${n} أشخاص`}
            </option>
          ))}
        </select>
        {errorFor("attendeeCount") ? (
          <span className="mt-1 block text-xs text-brand-red">
            {errorFor("attendeeCount")}
          </span>
        ) : null}
      </label>

      {/* Honeypot: hidden from people and assistive tech, often filled by bots. */}
      <div className="absolute -start-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          الموقع الإلكتروني
          <input
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label className="flex min-h-touch cursor-pointer items-start gap-3 text-sm text-brand-gray">
          <input
            type="checkbox"
            name="whatsappConsent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={Boolean(errorFor("whatsappConsent"))}
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand-red"
          />
          <span>أوافق على تواصل المغربي معي بخصوص المعرض عبر واتساب.</span>
        </label>
        {errorFor("whatsappConsent") ? (
          <span className="mt-1 block text-xs text-brand-red">
            {errorFor("whatsappConsent")}
          </span>
        ) : null}
      </div>

      {errorFor("form") ? (
        <p role="alert" className="rounded-xl bg-brand-red/10 px-3 py-2 text-sm text-brand-burgundy">
          {errorFor("form")}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-touch w-full rounded-xl bg-brand-red px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-burgundy disabled:opacity-60"
        >
          {submitting ? "جاري التسجيل…" : "تأكيد التسجيل"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="min-h-touch w-full rounded-xl px-4 py-2 text-sm font-medium text-brand-gray hover:bg-black/5"
        >
          رجوع للدعوة
        </button>
      </div>
    </form>
  );
}
