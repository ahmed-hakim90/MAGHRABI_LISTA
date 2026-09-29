"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnnouncementItem } from "@/lib/types/models";
import {
  announcementDisplayText,
  announcementLinkLabel,
  getActiveAnnouncements,
  isSafeAnnouncementLink,
} from "@/lib/utils/announcements";

/** Re-evaluate start/end windows without waiting for cache revalidation. */
const SCHEDULE_TICK_MS = 30_000;
/** Ticker speed in px/s — slow enough to read Arabic comfortably. */
const TICKER_PX_PER_SECOND = 55;

type EntryProps = {
  announcement: AnnouncementItem;
  /** Duplicate copy of the ticker: not focusable for keyboard/AT. */
  inertTab?: boolean;
};

function AnnouncementEntry({ announcement, inertTab }: EntryProps) {
  const { text, dir } = announcementDisplayText(announcement);
  const label = announcementLinkLabel(announcement);
  const link = announcement.link;
  const clickable = Boolean(link) && isSafeAnnouncementLink(link);

  const content = (
    <>
      <span dir={dir}>{text}</span>
      {clickable && label ? (
        <span dir={label === announcement.linkLabelAr ? "rtl" : "ltr"} className="announcement-link-label">
          {label}
        </span>
      ) : null}
    </>
  );

  if (!clickable) {
    return <span className="announcement-item">{content}</span>;
  }

  if (link.startsWith("/")) {
    return (
      <Link
        href={link}
        tabIndex={inertTab ? -1 : undefined}
        className="announcement-item announcement-item--link"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={link}
      tabIndex={inertTab ? -1 : undefined}
      target={announcement.openInNewTab ? "_blank" : undefined}
      rel={
        announcement.openInNewTab
          ? "noopener noreferrer external"
          : "noopener noreferrer"
      }
      className="announcement-item announcement-item--link"
    >
      {content}
    </a>
  );
}

function TickerSequence({
  items,
  inertTab,
}: {
  items: AnnouncementItem[];
  inertTab?: boolean;
}) {
  return (
    <div className="announcement-seq">
      {items.map((a) => (
        <span key={`${inertTab ? "dup-" : ""}${a.id}`} className="announcement-unit">
          <AnnouncementEntry announcement={a} inertTab={inertTab} />
          <span className="announcement-sep" aria-hidden>
            •
          </span>
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar({ items }: { items: AnnouncementItem[] }) {
  const [now, setNow] = useState(() => Date.now());
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), SCHEDULE_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const active = useMemo(
    () => getActiveAnnouncements(items, now),
    [items, now],
  );

  // Constant scroll speed regardless of how many announcements exist.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const seq = el.querySelector<HTMLElement>(".announcement-seq");
    const width = seq?.scrollWidth ?? 0;
    if (width > 0) {
      const seconds = Math.max(18, width / TICKER_PX_PER_SECOND);
      el.style.setProperty("--announcement-ticker-duration", `${seconds}s`);
    }
  }, [active]);

  if (active.length === 0) return null;

  return (
    <div
      className="announcement-bar"
      dir="rtl"
      role="region"
      aria-label="إعلانات الموقع"
    >
      <div className="announcement-marquee" ref={trackRef}>
        <TickerSequence items={active} />
        <TickerSequence items={active} inertTab />
      </div>
    </div>
  );
}
