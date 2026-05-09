import Link from "next/link";

type Kind = "files" | "folders";

export function CatalogListKebab({
  href,
  title,
  viewLabel = "عرض",
  downloadHref,
  openViewInNewTab = false,
}: {
  href: string;
  title: string;
  viewLabel?: string;
  /** When set, shows a «تحميل» item (e.g. PDF with `?download`). */
  downloadHref?: string;
  /** When true, «عرض» opens in a new tab (e.g. full PDF in mobile browser). */
  openViewInNewTab?: boolean;
}) {
  return (
    <details
      className="relative z-[2] shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground sm:h-10 sm:w-10 [&::-webkit-details-marker]:hidden"
        aria-label={`خيارات: ${title}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </summary>
      <div
        className="absolute end-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-border bg-card py-1 text-start shadow-lg"
        dir="rtl"
        role="menu"
      >
        <Link
          href={href}
          role="menuitem"
          className="block px-3 py-2 text-sm text-foreground hover:bg-surface"
          {...(openViewInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {viewLabel}
        </Link>
        {downloadHref ? (
          <a
            href={downloadHref}
            role="menuitem"
            className="block px-3 py-2 text-sm text-foreground hover:bg-surface"
          >
            تحميل
          </a>
        ) : null}
        {!openViewInNewTab ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="block px-3 py-2 text-sm text-foreground hover:bg-surface"
          >
            فتح في تاب جديد
          </a>
        ) : null}
      </div>
    </details>
  );
}

const listWrap =
  "flex min-h-10 items-center gap-2 border-b border-border bg-card/80 px-2 py-1.5 text-[11px] font-semibold text-muted sm:gap-3 sm:px-3 sm:text-xs";

export function CatalogFileListHeader({ kind = "files" }: { kind?: Kind }) {
  const third =
    kind === "files" ? (
      <span className="hidden w-16 shrink-0 text-end sm:block sm:w-20">
        الحجم
      </span>
    ) : (
      <span className="hidden w-16 shrink-0 text-end sm:block sm:w-24">
        المحتوى
      </span>
    );

  return (
    <div dir="rtl" className={listWrap} role="row">
      <span className="w-9 shrink-0 sm:w-10" aria-hidden />
      <span className="min-w-0 flex-1 truncate ps-1 text-foreground">
        الاسم
      </span>
      <span className="w-[6.5rem] shrink-0 text-end sm:w-32">
        تاريخ التعديل
      </span>
      {third}
      <span className="w-9 shrink-0 sm:w-10" aria-hidden />
    </div>
  );
}

export const catalogListContainerClass =
  "mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-card shadow-sm";

/** Shared list row shell for file and folder rows (Drive-style). */
export const catalogListRowClass =
  "relative flex min-h-[3.25rem] items-center gap-2 border-b border-border px-2 py-1.5 transition-colors last:border-b-0 sm:gap-3 sm:px-3 [@media(hover:hover)]:hover:bg-surface/80";
