"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  listNotifications,
  sendNotificationRequest,
} from "@/lib/services/notifications";
import { listAllFileCardsAdmin } from "@/lib/services/fileCards";
import type { FileCard } from "@/lib/types/models";
import type { NotificationDoc } from "@/lib/types/models";
import { formatDisplayDate } from "@/lib/utils/dates";

export default function AdminNotificationsPage() {
  const { user } = useAdminAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetCardId, setTargetCardId] = useState<string>("");
  const [cards, setCards] = useState<FileCard[]>([]);
  const [rows, setRows] = useState<(NotificationDoc & { id: string })[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [n, c] = await Promise.all([
      listNotifications(),
      listAllFileCardsAdmin(),
    ]);
    setRows(n);
    setCards(c);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      const idToken = await user.getIdToken();
      const res = await sendNotificationRequest({
        idToken,
        title,
        body,
        targetCardId: targetCardId || null,
      });
      if (!res.ok) {
        setMsg(res.error ?? "Send failed");
        return;
      }
      setTitle("");
      setBody("");
      setTargetCardId("");
      setMsg("Notification sent.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#2F3437]">Notifications</h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          Push to subscribed PWA visitors (FCM).
        </p>
      </div>

      <form
        onSubmit={(e) => void onSend(e)}
        className="max-w-lg space-y-4 rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-sm"
      >
        {msg ? (
          <p className="text-sm text-[#6B6B6B]" role="status">
            {msg}
          </p>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">Title</span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">Body</span>
          <textarea
            required
            rows={3}
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#2F3437]">
            Related file (optional)
          </span>
          <select
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={targetCardId}
            onChange={(e) => setTargetCardId(e.target.value)}
          >
            <option value="">— None —</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#2F3437] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send notification"}
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#2F3437]">History</h2>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[#E5E2DA] bg-white px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[#2F3437]">{r.title}</span>
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs ${
                    r.status === "sent"
                      ? "bg-emerald-50 text-emerald-800"
                      : r.status === "failed"
                        ? "bg-red-50 text-red-800"
                        : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="mt-1 text-[#6B6B6B]">{r.body}</p>
              <p className="mt-2 text-xs text-[#6B6B6B]">
                {formatDisplayDate(r.createdAt)}
                {r.targetCardId ? ` · Card ${r.targetCardId}` : ""}
              </p>
            </li>
          ))}
        </ul>
        {rows.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">No notifications yet.</p>
        ) : null}
      </div>
    </div>
  );
}
