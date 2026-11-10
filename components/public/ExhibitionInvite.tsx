"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { EXHIBITION_INVITE_ARTWORK } from "@/lib/constants/exhibition";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExhibitionCalendarActions } from "@/components/public/ExhibitionCalendarActions";
import { ExhibitionRegistrationForm } from "@/components/public/ExhibitionRegistrationForm";
import { fetchActiveExhibition } from "@/lib/services/exhibitions";
import type { PublicExhibition, RegistrationResult } from "@/lib/types/exhibition";
import {
  INTERACTIVE_PRICE_LIST_PATH,
  REELS_FEED_PATH,
} from "@/lib/utils/catalogChrome";
import {
  onOpenExhibitionInviteRequest,
  setExhibitionInviteAvailable,
} from "@/lib/utils/exhibitionInviteChannel";
import { describeExhibitionSchedule } from "@/lib/utils/exhibitionSchedule";

type View = "invite" | "form" | "done";

/** Once per browser session: opening the site shows the invitation, internal navigation does not. */
const SHOWN_THIS_SESSION_KEY = "maghrabi_exhibition_invite_shown";
/** Only the registration number is kept on the device — never name or phone. */
const REGISTRATION_KEY_PREFIX = "maghrabi_exhibition_registration_";

function readStorage(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: "local" | "session", key: string, value: string) {
  try {
    (storage === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    /* private mode: the invitation still works, it just is not remembered */
  }
}

/**
 * True while a scrollable page is scrolled to its last ~200px. The floating
 * button steps aside there so the final price-list rows and footer links are
 * never covered (content cannot scroll out from under it at the end).
 */
function useNearPageEnd(): boolean {
  const [nearEnd, setNearEnd] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const scrollable = root.scrollHeight > window.innerHeight + 1;
      setNearEnd(
        scrollable &&
          window.innerHeight + window.scrollY >= root.scrollHeight - 200,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);
  return nearEnd;
}

/** Resolves once the launch splash has faded so the dialog never stacks on it. */
function whenSplashDone(callback: () => void): () => void {
  const html = document.documentElement;
  if (!html.classList.contains("splash-launch")) {
    callback();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (!html.classList.contains("splash-launch")) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(html, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ExhibitionInvite() {
  const pathname = usePathname() ?? "";
  const [exhibition, setExhibition] = useState<PublicExhibition | null>(null);
  const [splashDone, setSplashDone] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("invite");
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const nearPageEnd = useNearPageEnd();

  useEffect(() => {
    const controller = new AbortController();
    fetchActiveExhibition(controller.signal)
      .then((active) => {
        if (!active) return;
        setExhibition(active);
        const saved = readStorage("local", `${REGISTRATION_KEY_PREFIX}${active.id}`);
        if (saved) setRegistration({ registrationNumber: saved, alreadyRegistered: true });
      })
      .catch(() => {
        /* The invitation is optional chrome; the catalog keeps working without it. */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => whenSplashDone(() => setSplashDone(true)), []);

  useEffect(() => {
    if (!exhibition || !splashDone) return;
    if (REELS_FEED_PATH.test(pathname)) return;
    if (readStorage("session", SHOWN_THIS_SESSION_KEY) === exhibition.id) return;
    writeStorage("session", SHOWN_THIS_SESSION_KEY, exhibition.id);
    queueMicrotask(() => {
      setView("invite");
      setOpen(true);
    });
  }, [exhibition, splashDone, pathname]);

  const closeInvite = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => reopenRef.current?.focus());
  }, []);

  const openInvite = useCallback(() => {
    setView(registration ? "done" : "invite");
    setOpen(true);
  }, [registration]);

  const available = Boolean(exhibition) && !REELS_FEED_PATH.test(pathname);
  useEffect(() => {
    setExhibitionInviteAvailable(available);
    return () => setExhibitionInviteAvailable(false);
  }, [available]);

  useEffect(() => {
    if (!available) return;
    return onOpenExhibitionInviteRequest(openInvite);
  }, [available, openInvite]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeInvite();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeInvite]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      panel.scrollTop = 0;
      (
        panel.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.querySelector<HTMLElement>("button")
      )?.focus();
    });
  }, [open, view]);

  const markRegistered = useCallback(
    (result: RegistrationResult) => {
      if (!exhibition) return;
      writeStorage(
        "local",
        `${REGISTRATION_KEY_PREFIX}${exhibition.id}`,
        result.registrationNumber,
      );
      setRegistration(result);
      setView("done");
    },
    [exhibition],
  );

  if (!exhibition || !splashDone || REELS_FEED_PATH.test(pathname)) return null;

  const onPriceList = INTERACTIVE_PRICE_LIST_PATH.test(pathname);
  const schedule = describeExhibitionSchedule(exhibition.schedule);
  const artwork = EXHIBITION_INVITE_ARTWORK[exhibition.id];

  return (
    <>
      {!open ? (
        <div
          className={`pointer-events-none fixed inset-x-0 z-[90] flex justify-center transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none print:hidden ${
            onPriceList
              ? "bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]"
              : "bottom-[max(1rem,env(safe-area-inset-bottom,0px))]"
          } ${nearPageEnd ? "invisible translate-y-2 opacity-0" : ""}`}
        >
          <button
            ref={reopenRef}
            type="button"
            onClick={openInvite}
            aria-haspopup="dialog"
            aria-label={`دعوة ${exhibition.shortTitle}`}
            className="pointer-events-auto flex min-h-touch items-center gap-2 rounded-full border border-brand-gold/70 bg-brand-burgundy px-4 py-2 text-sm font-semibold text-brand-ivory shadow-lg ring-1 ring-black/10 transition hover:bg-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            <CrescentGlyph className="h-4 w-4 shrink-0 text-brand-gold" />
            <span className="max-[379px]:hidden">دعوة {exhibition.shortTitle}</span>
            <span className="min-[380px]:hidden">دعوة المعرض</span>
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="presentation"
          onClick={closeInvite}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exhibition-invite-title"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl bg-brand-ivory shadow-2xl ring-1 ring-brand-gold/40 sm:rounded-3xl"
          >
            {view === "invite" && artwork ? (
              <header className="relative">
                <Image
                  src={artwork.src}
                  alt=""
                  width={artwork.width}
                  height={artwork.height}
                  priority
                  sizes="(min-width: 640px) 32rem, 100vw"
                  className="block h-auto w-full"
                />
                <h2 id="exhibition-invite-title" className="sr-only">
                  {exhibition.title}
                </h2>
                <button
                  type="button"
                  onClick={closeInvite}
                  aria-label="إغلاق الدعوة"
                  className="absolute start-3 top-3 flex min-h-touch min-w-touch items-center justify-center rounded-full bg-white/95 text-2xl leading-none text-brand-red shadow-md ring-1 ring-brand-gold/50 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-brand-gold"
                >
                  ×
                </button>
              </header>
            ) : (
            <header className="relative bg-brand-burgundy px-5 pb-5 pt-4 text-center text-brand-ivory">
              <button
                type="button"
                onClick={closeInvite}
                aria-label="إغلاق الدعوة"
                className="absolute end-3 top-3 flex min-h-touch min-w-touch items-center justify-center rounded-full text-2xl leading-none text-brand-ivory/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-gold"
              >
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, images are unoptimized site-wide */}
              <img
                src="/brand/elmaghraby-logo-white.png"
                alt="المغربي"
                className="mx-auto h-10 w-auto"
              />
              <p className="mt-3 text-xs font-semibold tracking-wide text-brand-gold">
                شركاء النجاح
              </p>
              <h2
                id="exhibition-invite-title"
                className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl"
              >
                {exhibition.title}
              </h2>
              <div className="mx-auto mt-3 h-px w-24 bg-brand-gold/70" aria-hidden />
            </header>
            )}

            <div className="space-y-4 px-5 py-5">
              {view === "invite" ? (
                <InviteDetails
                  exhibition={exhibition}
                  schedule={schedule}
                  registration={registration}
                  onRegister={() => setView("form")}
                  onShowRegistration={() => setView("done")}
                  onClose={closeInvite}
                />
              ) : null}

              {view === "form" ? (
                <ExhibitionRegistrationForm
                  exhibitionId={exhibition.id}
                  onRegistered={markRegistered}
                  onBack={() => setView("invite")}
                />
              ) : null}

              {view === "done" && registration ? (
                <RegistrationConfirmation
                  exhibition={exhibition}
                  schedule={schedule}
                  registration={registration}
                  onRegisterAnother={() => setView("form")}
                  onClose={closeInvite}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ScheduleAndVenue({
  exhibition,
  schedule,
}: {
  exhibition: PublicExhibition;
  schedule: string;
}) {
  return (
    <dl className="divide-y divide-brand-gold/30 rounded-2xl border border-brand-gold/50 bg-white/80 px-4 text-sm text-brand-gray shadow-sm">
      <div className="flex items-start gap-3 py-3">
        <CalendarGlyph className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
        <dt className="shrink-0 font-bold text-brand-burgundy">موعد المعرض:</dt>
        <dd>{schedule}</dd>
      </div>
      {exhibition.venueName ? (
        <div className="flex items-start gap-3 py-3">
          <PinGlyph className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
          <dt className="shrink-0 font-bold text-brand-burgundy">المكان:</dt>
          <dd>
            {exhibition.venueName}
            {exhibition.mapUrl ? (
              <>
                {" "}
                <a
                  href={exhibition.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-red underline underline-offset-2"
                >
                  افتح الخريطة
                </a>
              </>
            ) : null}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function InviteDetails({
  exhibition,
  schedule,
  registration,
  onRegister,
  onShowRegistration,
  onClose,
}: {
  exhibition: PublicExhibition;
  schedule: string;
  registration: RegistrationResult | null;
  onRegister: () => void;
  onShowRegistration: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {exhibition.description ? (
        <div className="text-center">
          <p className="whitespace-pre-line text-base leading-relaxed text-brand-gray">
            {exhibition.description}
          </p>
          <div className="mx-auto mt-4 flex w-40 items-center gap-2" aria-hidden>
            <span className="h-px flex-1 bg-brand-gold/70" />
            <span className="h-1.5 w-1.5 rotate-45 bg-brand-gold" />
            <span className="h-px flex-1 bg-brand-gold/70" />
          </div>
        </div>
      ) : null}
      <ScheduleAndVenue exhibition={exhibition} schedule={schedule} />
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          data-autofocus
          onClick={registration ? onShowRegistration : onRegister}
          className="flex min-h-touch w-full items-center justify-center gap-3 rounded-full bg-linear-to-l from-brand-red to-brand-burgundy px-5 py-3.5 text-lg font-extrabold text-white shadow-lg ring-2 ring-brand-gold/60 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-burgundy"
        >
          <CalendarCheckGlyph className="h-6 w-6 shrink-0" />
          {registration ? "أنت مسجّل — عرض تفاصيل التسجيل" : "سجّل حضورك الآن"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-touch items-center gap-1 px-4 text-sm font-medium text-brand-gray underline underline-offset-4 hover:text-brand-burgundy"
        >
          متابعة تصفح الموقع
          <ChevronForwardGlyph className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

function RegistrationConfirmation({
  exhibition,
  schedule,
  registration,
  onRegisterAnother,
  onClose,
}: {
  exhibition: PublicExhibition;
  schedule: string;
  registration: RegistrationResult;
  onRegisterAnother: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4" role="status">
      <div className="text-center">
        <h3 className="text-lg font-bold text-brand-burgundy">
          {registration.alreadyRegistered
            ? "حضورك مسجّل بالفعل"
            : "تم تسجيل حضورك بنجاح"}
        </h3>
        <p className="mt-1 text-sm text-brand-gray/80">
          يسعدنا انضمامك إلى شركاء نجاح المغربي.
        </p>
        <p className="mt-3 text-sm text-brand-gray">رقم التسجيل</p>
        <p className="text-2xl font-extrabold tracking-wider text-brand-red" dir="ltr">
          {registration.registrationNumber}
        </p>
      </div>

      <ScheduleAndVenue exhibition={exhibition} schedule={schedule} />

      {exhibition.calendar ? (
        <ExhibitionCalendarActions calendar={exhibition.calendar} />
      ) : (
        <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-brand-gray">
          سنرسل لك الموعد عبر واتساب فور الإعلان عنه، وتقدر تضيفه لتقويمك من
          هنا بعد الإعلان.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className="min-h-touch w-full rounded-xl bg-brand-red px-4 py-3 text-base font-bold text-white transition hover:bg-brand-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-burgundy"
        >
          متابعة تصفح الموقع
        </button>
        <button
          type="button"
          onClick={onRegisterAnother}
          className="min-h-touch w-full rounded-xl px-4 py-2 text-sm font-medium text-brand-gray hover:bg-black/5"
        >
          تسجيل شخص آخر
        </button>
      </div>
    </div>
  );
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </svg>
  );
}

function CalendarCheckGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M9 15.5l2 2 4-4" />
    </svg>
  );
}

function PinGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Points in the reading direction: left in RTL, right in LTR. */
function ChevronForwardGlyph({ className }: { className?: string }) {
  return (
    <svg className={`${className ?? ""} rtl:rotate-180`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CrescentGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14.5 2.5a9.5 9.5 0 1 0 7 15.9A8 8 0 0 1 14.5 2.5z" />
    </svg>
  );
}
