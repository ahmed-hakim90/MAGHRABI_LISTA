"use client";

import { Fragment, useMemo } from "react";

const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

/** With or without leading slash (models often omit `/`). */
const CATALOG_PATH_RE =
  /\/?(wholesale|retail|lists)\/file\/[^/\s`'"،]+\/(?:view|pdf)(?:[?#][^\s<>"'`]*)?/gi;

/** `path بعنوان **Title**` → markdown link showing title only. */
const PATH_THEN_TITLE_AR =
  /[`']?\/?(wholesale|retail|lists)\/file\/([^/\s`'"،]+)\/(view|pdf)[`']?\s*بعنوان\s*\*\*([^*]+)\*\*/gi;

/** https/wa.me/etc. — catalog file paths handled by linkCatalogPathsInText first. */
const HTTPS_URL_RE = /(https?:\/\/[^\s<>"'`\][()]+)/gi;

type Segment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string; external: boolean };

/** Collapse duplicate slashes; safe for site paths only (not http://). */
function collapsePathSlashes(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return `/${parts.join("/")}`;
}

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
    if (t.startsWith("//")) return null;
    if (!/^\/(?:wholesale|retail|lists)(?:\/|$)/i.test(t)) return null;
    return collapsePathSlashes(t);
  }
  if (/^(wholesale|retail|lists)\//i.test(t)) {
    return collapsePathSlashes(`/${t}`);
  }
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      if (
        u.hostname === "wholesale" ||
        u.hostname === "retail" ||
        u.hostname === "lists"
      ) {
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

function stripTrailingLinkJunk(s: string): string {
  return s.replace(/[.,;:!?؟%]*(?:\)+|»+|"+|'+|`+)*$/u, "").trim();
}

/** Unwrap backticks around catalog paths (with or without leading `/`). */
function unwrapBacktickPaths(text: string): string {
  return text.replace(
    /`(\/?(?:wholesale|retail|lists)\/[^`\n]+)`/g,
    "$1",
  );
}

/** Model output: raw path + «بعنوان **الاسم**» → `[الاسم](/…/view)` so only the name shows. */
function mergePathWithArabicTitleToMarkdown(text: string): string {
  return text.replace(
    PATH_THEN_TITLE_AR,
    (_full, channel: string, id: string, tail: string, title: string) => {
      const href = collapsePathSlashes(`/${channel}/file/${id}/${tail}`);
      const label = title.trim().replace(/[[\]]/g, "");
      return `[${label}](${href})`;
    },
  );
}

/** If path was written without leading slash, add it for consistent linking. */
function injectLeadingSlashBeforeCatalogPaths(text: string): string {
  return text.replace(
    /(^|[\s\n>،.:؛(])((?:wholesale|retail|lists)\/file\/[^/\s`'"،]+\/(?:view|pdf))/gi,
    (_, sep: string, path: string) => `${sep}/${path}`.replace(/\/+/g, "/"),
  );
}

/** Fix model typos like `id//view`. */
function fixDoubleSlashInCatalogPaths(text: string): string {
  return text.replace(
    /((?:wholesale|retail|lists)\/file\/[^/\s`'"،]+)\/+\/(view|pdf)/gi,
    "$1/$2",
  );
}

/**
 * Prefer tight /file/.../view matches inside longer text chunks (avoids swallowing trailing words).
 */
function linkCatalogPathsInText(text: string): Segment[] {
  const parts: Segment[] = [];
  let i = 0;
  CATALOG_PATH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CATALOG_PATH_RE.exec(text)) !== null) {
    if (m.index > i) {
      parts.push({ type: "text", value: text.slice(i, m.index) });
    }
    const raw = stripTrailingLinkJunk(m[0]);
    const safe = sanitizeHref(raw.startsWith("/") ? raw : `/${raw}`);
    if (safe) {
      parts.push({
        type: "link",
        label: safe,
        href: safe,
        external: false,
      });
    } else {
      parts.push({ type: "text", value: m[0] });
    }
    i = m.index + m[0].length;
  }
  if (i < text.length) {
    parts.push({ type: "text", value: text.slice(i) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}

/**
 * Turn assistant/user text into segments: markdown [label](url), then plain URLs in leftovers.
 */
function parseContentToSegments(content: string): Segment[] {
  let pipeline = fixDoubleSlashInCatalogPaths(content);
  pipeline = mergePathWithArabicTitleToMarkdown(pipeline);
  pipeline = injectLeadingSlashBeforeCatalogPaths(pipeline);
  pipeline = unwrapBacktickPaths(pipeline);
  const normalized = pipeline;
  const out: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const mdRe = new RegExp(MD_LINK_RE.source, "g");
  while ((m = mdRe.exec(normalized)) !== null) {
    if (m.index > last) {
      out.push({ type: "text", value: normalized.slice(last, m.index) });
    }
    const label = m[1] ?? "";
    const rawHref = m[2] ?? "";
    const safe = sanitizeHref(stripTrailingLinkJunk(rawHref));
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
  if (last < normalized.length) {
    out.push({ type: "text", value: normalized.slice(last) });
  }

  const flattened: Segment[] = [];
  for (const seg of out) {
    if (seg.type !== "text") {
      flattened.push(seg);
      continue;
    }
    const pathSplit = linkCatalogPathsInText(seg.value);
    for (const chunk of pathSplit) {
      if (chunk.type !== "text") {
        flattened.push(chunk);
        continue;
      }
      const text = chunk.value;
      let i = 0;
      HTTPS_URL_RE.lastIndex = 0;
      let um: RegExpExecArray | null;
      while ((um = HTTPS_URL_RE.exec(text)) !== null) {
        if (um.index > i) {
          flattened.push({ type: "text", value: text.slice(i, um.index) });
        }
        const raw = stripTrailingLinkJunk(um[1] ?? um[0]);
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
  }

  return flattened.length ? flattened : [{ type: "text", value: normalized }];
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
        const catalogInternal =
          !s.external && /^\/(?:wholesale|retail|lists)\/file\//i.test(s.href);
        return (
          <a
            key={i}
            href={s.href}
            className={
              catalogInternal
                ? "font-semibold text-primary underline underline-offset-2 hover:opacity-90"
                : "font-medium text-primary underline underline-offset-2 hover:opacity-90"
            }
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
