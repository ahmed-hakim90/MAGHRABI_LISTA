"use client";

import { Fragment, useMemo } from "react";

const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
const PLAIN_URL_RE =
  /(https?:\/\/[^\s\[\]()]+|\/(?:wholesale|retail)(?:\/[^\s\[\]()]*)?)/gi;

type Segment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string; external: boolean };

function sanitizeHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }
  if (t.startsWith("/")) {
    if (!t.startsWith("//")) return t;
    return null;
  }
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      if (u.hostname === "wholesale" || u.hostname === "retail") {
        return `/${u.hostname}${u.pathname}${u.search}${u.hash}`;
      }
    } catch {
      return null;
    }
    return t;
  }
  return null;
}

function isExternalHref(href: string): boolean {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    if (typeof window === "undefined") return true;
    try {
      const u = new URL(href);
      return u.origin !== window.location.origin;
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * Turn assistant/user text into segments: markdown [label](url), then plain URLs in leftovers.
 */
function parseContentToSegments(content: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const mdRe = new RegExp(MD_LINK_RE.source, "g");
  while ((m = mdRe.exec(content)) !== null) {
    if (m.index > last) {
      out.push({ type: "text", value: content.slice(last, m.index) });
    }
    const label = m[1] ?? "";
    const rawHref = m[2] ?? "";
    const safe = sanitizeHref(rawHref);
    if (safe) {
      out.push({
        type: "link",
        label: label.trim() || safe,
        href: safe,
        external:
          safe.startsWith("http://") || safe.startsWith("https://")
            ? isExternalHref(safe)
            : false,
      });
    } else {
      out.push({ type: "text", value: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    out.push({ type: "text", value: content.slice(last) });
  }

  const flattened: Segment[] = [];
  for (const seg of out) {
    if (seg.type !== "text") {
      flattened.push(seg);
      continue;
    }
    const text = seg.value;
    let i = 0;
    PLAIN_URL_RE.lastIndex = 0;
    let um: RegExpExecArray | null;
    while ((um = PLAIN_URL_RE.exec(text)) !== null) {
      if (um.index > i) {
        flattened.push({ type: "text", value: text.slice(i, um.index) });
      }
      const raw = um[1] ?? um[0];
      const safe = sanitizeHref(raw);
      if (safe) {
        flattened.push({
          type: "link",
          label: safe,
          href: safe,
          external:
            safe.startsWith("http://") || safe.startsWith("https://")
              ? isExternalHref(safe)
              : false,
        });
      } else {
        flattened.push({ type: "text", value: um[0] });
      }
      i = um.index + um[0].length;
    }
    if (i < text.length) {
      flattened.push({ type: "text", value: text.slice(i) });
    }
  }

  return flattened.length ? flattened : [{ type: "text", value: content }];
}

export function ChatMessageContent({ content }: { content: string }) {
  const segments = useMemo(() => parseContentToSegments(content), [content]);

  return (
    <span className="inline-block max-w-full break-words [overflow-wrap:anywhere]">
      {segments.map((s, i) => {
        if (s.type === "text") {
          return (
            <Fragment key={i}>
              {s.value.split("\n").map((line, j, arr) => (
                <Fragment key={j}>
                  {line}
                  {j < arr.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </Fragment>
          );
        }
        return (
          <a
            key={i}
            href={s.href}
            className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
            target={s.external ? "_blank" : undefined}
            rel={s.external ? "noopener noreferrer" : undefined}
          >
            {s.label}
          </a>
        );
      })}
    </span>
  );
}
