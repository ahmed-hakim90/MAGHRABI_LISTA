"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { listAllFileCardsAdmin } from "@/lib/services/fileCards";
import { listAllFileFoldersAdmin } from "@/lib/services/fileFolders";
import { listNotifications } from "@/lib/services/notifications";
import type { FileCard } from "@/lib/types/models";

function byUpdatedDesc(a: FileCard, b: FileCard): number {
  const ta = a.updatedAt?.toMillis?.() ?? 0;
  const tb = b.updatedAt?.toMillis?.() ?? 0;
  return tb - ta;
}

function byViewsDesc(a: FileCard, b: FileCard): number {
  return (b.viewCount ?? 0) - (a.viewCount ?? 0);
}

export default function AdminHomePage() {
  const { user } = useAdminAuth();
  const [cards, setCards] = useState<FileCard[] | null>(null);
  const [folderCount, setFolderCount] = useState<number | null>(null);
  const [sentNotifications, setSentNotifications] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, folders, notes] = await Promise.all([
          listAllFileCardsAdmin(),
          listAllFileFoldersAdmin(),
          listNotifications(),
        ]);
        if (cancelled) return;
        setCards(c);
        setFolderCount(folders.filter((f) => f.isActive).length);
        setSentNotifications(notes.filter((n) => n.status === "sent").length);
      } catch {
        if (!cancelled) {
          setCards([]);
          setFolderCount(0);
          setSentNotifications(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFileCount = useMemo(
    () => (cards ? cards.filter((c) => c.isActive).length : null),
    [cards],
  );

  const recent = useMemo(() => {
    if (!cards) return [];
    return [...cards].sort(byUpdatedDesc).slice(0, 8);
  }, [cards]);

  const topViews = useMemo(() => {
    if (!cards) return [];
    return [...cards].sort(byViewsDesc).slice(0, 8);
  }, [cards]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user?.email ?? "—"}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Active price lists
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            {activeFileCount ?? "—"}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Active folders
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            {folderCount ?? "—"}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Notifications sent
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            {sentNotifications ?? "—"}
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/files/new"
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-card)] transition hover:bg-primary/90 sm:flex-none sm:px-8"
        >
          Upload price list
        </Link>
        <Link
          href="/admin/notifications"
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition hover:border-primary/30 sm:flex-none sm:px-8"
        >
          Send push notification
        </Link>
        <Link
          href="/admin/settings"
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition hover:border-primary/30 sm:flex-none sm:px-8"
        >
          Site settings
        </Link>
        <Link
          href="/admin/files"
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition hover:border-primary/30 sm:flex-none sm:px-8"
        >
          Manage files
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold text-foreground">Recent uploads</h2>
          <p className="mt-0.5 text-xs text-muted">By last updated</p>
          <ul className="mt-4 space-y-2">
            {cards === null ? (
              <li className="text-sm text-muted">Loading…</li>
            ) : recent.length === 0 ? (
              <li className="text-sm text-muted">No files yet.</li>
            ) : (
              recent.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm"
                >
                  <Link
                    href={`/admin/files/${c.id}/edit`}
                    className="min-w-0 truncate font-medium text-primary hover:underline"
                  >
                    {c.title || c.id}
                  </Link>
                  <span className="shrink-0 tabular-nums text-xs text-muted">
                    {c.viewCount ?? 0} views
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-bold text-foreground">Most viewed</h2>
          <p className="mt-0.5 text-xs text-muted">All files (including inactive)</p>
          <ul className="mt-4 space-y-2">
            {cards === null ? (
              <li className="text-sm text-muted">Loading…</li>
            ) : topViews.length === 0 ? (
              <li className="text-sm text-muted">No data yet.</li>
            ) : (
              topViews.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm"
                >
                  <Link
                    href={`/admin/files/${c.id}/edit`}
                    className="min-w-0 truncate font-medium text-primary hover:underline"
                  >
                    {c.title || c.id}
                  </Link>
                  <span className="shrink-0 tabular-nums text-xs font-semibold text-accent">
                    {c.viewCount ?? 0}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
