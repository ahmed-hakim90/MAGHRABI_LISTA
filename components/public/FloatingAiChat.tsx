"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessageContent } from "@/components/public/ChatMessageContent";
import {
  getChatQuickRepliesForContext,
  presetCanonicalMessage,
  type ChatPresetId,
} from "@/lib/constants/chatPresets";

export type FloatingAiChatAudience = "wholesale" | "retail";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEYS: Record<FloatingAiChatAudience, string> = {
  wholesale: "elmaghraby-chat-wholesale",
  retail: "elmaghraby-chat-retail",
};

const MAX_STORED_MESSAGES = 4;
const MAX_INPUT = 300;

/** نص مختصر لزر الفقاعة (title / aria) */
const FAB_ASSISTANT_HINT_AR = "مساعد الكتالوج — أسعار وملفات وتواصل";

const GREETING_SHOW_DELAY_MS = 550;

function fabGreetingBullets(
  activeCardId: string | undefined,
  activeFolderId: string | undefined,
): string[] {
  if (activeCardId) {
    return [
      "أسئلة عن النص المستخرج من ملف الـ PDF المفتوح (مقتطف، مش الملف كامل)",
      "التاجات المرتبطة بالقائمة تساعد في فهم نوع الملف بسرعة",
      "التنقّل: افتح معاينة الـ PDF في الصفحة للتفاصيل الكاملة",
    ];
  }
  if (activeFolderId) {
    return [
      "قائمة بملفات المجلد من الاختصارات أو اكتب سؤالك",
      "البحث يستخدم عناوين الملفات وتاجاتها لاختيار أقرب نتائج",
      "أسئلة التواصل والمساعدة السريعة",
    ];
  }
  return [
    "البحث عن منتج أو ملف أسعار داخل الكتالوج",
    "التاجات تساعد المساعد يربط سؤالك بأقرب قائمة أسعار",
    "شرح التنقّل والتواصل عبر واتساب",
  ];
}

function greetingDismissedStorageKey(audience: FloatingAiChatAudience): string {
  return `elmaghraby-fab-greeting-dismissed-${audience}`;
}

function parseStored(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: ChatMessage[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if (role !== "user" && role !== "assistant") continue;
      if (typeof content !== "string" || !content.trim()) continue;
      out.push({ role, content: content.trim() });
    }
    return out.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

const REELS_FEED_PATH = /^\/(wholesale|retail|lists)\/reels\/feed$/;

export function FloatingAiChat({ audience }: { audience: FloatingAiChatAudience }) {
  const pathname = usePathname() ?? "";
  if (REELS_FEED_PATH.test(pathname)) return null;

  const filePathMatch = pathname.match(/^\/(wholesale|retail)\/file\/([^/]+)/);
  const folderPathMatch = pathname.match(/^\/(wholesale|retail)\/folder\/([^/]+)/);
  const pathChannel = filePathMatch?.[1] as FloatingAiChatAudience | undefined;
  const folderPathChannel = folderPathMatch?.[1] as FloatingAiChatAudience | undefined;
  const pathCardId = filePathMatch?.[2];
  const pathFolderId = folderPathMatch?.[2];
  const activeCardId =
    pathChannel === audience && pathCardId ? pathCardId : undefined;
  const activeFolderId =
    folderPathChannel === audience && pathFolderId ? pathFolderId : undefined;

  const storageKey = STORAGE_KEYS[audience];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open || greetingDismissed) {
      if (!open) return;
      const t = window.setTimeout(() => setGreetingVisible(false), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setGreetingVisible(true), GREETING_SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [open, greetingDismissed]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setGreetingDismissed(
        localStorage.getItem(greetingDismissedStorageKey(audience)) === "1",
      );
      setMessages(parseStored(localStorage.getItem(storageKey)));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [audience, storageKey]);

  const dismissFabGreeting = useCallback(() => {
    setGreetingDismissed(true);
    setGreetingVisible(false);
    try {
      localStorage.setItem(greetingDismissedStorageKey(audience), "1");
    } catch {
      /* ignore */
    }
  }, [audience]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages, hydrated, storageKey]);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    if (open) scrollToEnd();
  }, [open, messages, loading, scrollToEnd]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const popLastUser = useCallback(() => {
    setMessages((prev) =>
      prev[prev.length - 1]?.role === "user" ? prev.slice(0, -1) : prev,
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string, presetId?: ChatPresetId) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      if (trimmed.length > MAX_INPUT) return;

      setError(null);
      setInput("");
      const history = messages.slice(-MAX_STORED_MESSAGES);
      setLoading(true);
      setMessages((prev) =>
        [...prev, { role: "user" as const, content: trimmed }].slice(-MAX_STORED_MESSAGES),
      );

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            ...(presetId ? { presetId } : {}),
            history,
            audience,
            ...(activeCardId ? { cardId: activeCardId } : {}),
            ...(activeFolderId && !activeCardId ? { folderId: activeFolderId } : {}),
          }),
        });

        let payload: { reply?: string; error?: string; code?: string; message?: string };
        try {
          payload = (await res.json()) as typeof payload;
        } catch {
          setError("حصل خطأ. حاول مرة تانية.");
          popLastUser();
          return;
        }

        if (!res.ok) {
          const msg =
            typeof payload.message === "string" && payload.message.trim()
              ? payload.message
              : res.status === 429
                ? payload.error === "quota" || payload.code === "quota"
                  ? "الخدمة وصلت لحد الاستخدام. جرّب تاني لاحقاً."
                  : "وصلت للحد المسموح من الرسائل. جرّب بعد ساعة."
                : res.status === 504
                  ? "الطلب استغرق وقت طويل. حاول مرة تانية."
                  : "حصل خطأ. حاول مرة تانية.";
          setError(msg);
          popLastUser();
          return;
        }

        const reply = typeof payload.reply === "string" ? payload.reply.trim() : "";
        if (!reply) {
          setError("مفيش رد من المساعد. حاول تاني.");
          popLastUser();
          return;
        }

        setMessages((prev) =>
          [...prev, { role: "assistant" as const, content: reply }].slice(
            -MAX_STORED_MESSAGES,
          ),
        );
      } catch {
        setError("حصل خطأ في الاتصال. حاول مرة تانية.");
        popLastUser();
      } finally {
        setLoading(false);
      }
    },
    [activeCardId, activeFolderId, audience, loading, messages, popLastUser],
  );

  const send = useCallback(async () => {
    await sendMessage(input.trim());
  }, [input, sendMessage]);

  const quickReplies = useMemo(
    () =>
      getChatQuickRepliesForContext({
        hasOpenFile: !!activeCardId,
        hasOpenFolder: !!activeFolderId && !activeCardId,
      }),
    [activeCardId, activeFolderId],
  );

  const fabBullets = useMemo(
    () => fabGreetingBullets(activeCardId, activeFolderId),
    [activeCardId, activeFolderId],
  );

  const welcome =
    messages.length === 0 ? (
      <div className="rounded-2xl bg-primary/8 px-3 py-2.5 text-sm text-foreground leading-relaxed">
        أسئلة عن الملفات أو التنقّل في الكتالوج.
        {activeCardId ? (
          <>
            {" "}
            أنت جوّا <strong>ملف PDF</strong>؛ نقدر نطلع مقتطف من النص المستخرج (مش الملف كامل).
          </>
        ) : activeFolderId ? (
          <>
            {" "}
            أنت في <strong>مجلد</strong>؛ نقدر نذكر عناوين قوائم الأسعار الظاهرة هنا؛ للتفاصيل افتح الملف.
          </>
        ) : (
          <>
            {" "}
            من هنا نقدر ندور على ملفات الأسعار ونقرأ مقتطفات من الـ PDF تلقائياً حسب سؤالك؛
            للتفاصيل الكاملة افتح الملف من الكتالوج.
          </>
        )}
      </div>
    ) : null;

  const fabCornerClass =
    "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]";

  return (
    <>
      <div
        dir="ltr"
        className={`fixed ${fabCornerClass} z-[100] flex flex-col items-end gap-2`}
      >
        {!open && !greetingDismissed ? (
          <div
            dir="rtl"
            className={`max-w-[min(19rem,calc(100vw-3.5rem))] rounded-xl border border-border bg-card py-1.5 ps-2.5 pe-1 text-foreground shadow-md ring-1 ring-border/80 transition-all duration-300 ease-out ${
              greetingVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-1 scale-[0.98] opacity-0"
            }`}
          >
            <div className="flex items-start gap-1">
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="mb-1 text-xs font-semibold text-foreground">
                  المساعد يقدر يعمل إيه؟
                </p>
                <ul className="list-disc space-y-0.5 ps-4 text-[13px] leading-snug text-foreground marker:text-muted">
                  {fabBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissFabGreeting();
                }}
                className="min-h-touch min-w-touch shrink-0 rounded-lg text-lg leading-none text-muted hover:bg-surface"
                aria-label="إغلاق رسالة المساعدة"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 transform-gpu items-center justify-center rounded-full bg-primary text-white shadow-lg ring-1 ring-black/10 transition-transform duration-200 hover:scale-105 hover:shadow-xl active:scale-95 [backface-visibility:hidden]"
          title={FAB_ASSISTANT_HINT_AR}
          aria-label={`مساعد المغربي — ${FAB_ASSISTANT_HINT_AR}`}
          aria-expanded={open}
        >
          <ChatGlyph className="h-7 w-7" aria-hidden />
        </button>
      </div>

      {open ? (
        <div
          className={`fixed bottom-[calc(4rem+max(1.25rem,env(safe-area-inset-bottom)))] right-[max(1.25rem,env(safe-area-inset-right))] z-[100] grid max-h-[min(56vh,28rem)] w-[min(100vw-2rem,22rem)] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl bg-card text-foreground shadow-xl ring-1 ring-border`}
          role="dialog"
          aria-label="مساعد المغربي"
        >
          <header className="flex min-h-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
            <h2 className="text-sm font-semibold">مساعد المغربي</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                className="min-h-touch min-w-touch rounded-lg px-2 text-xs text-muted hover:bg-surface"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-touch min-w-touch rounded-lg px-2 text-lg leading-none text-muted hover:bg-surface"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-2 [scrollbar-gutter:stable]">
            {welcome}
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}-${m.content.slice(0, 12)}`}
                dir="rtl"
                className={
                  m.role === "user"
                    ? "ms-6 min-w-0 max-w-full rounded-2xl bg-primary/12 px-3 py-2 text-sm leading-relaxed [overflow-wrap:anywhere]"
                    : "me-6 min-w-0 max-w-full rounded-2xl bg-surface px-3 py-2 text-sm leading-relaxed ring-1 ring-border [overflow-wrap:anywhere]"
                }
              >
                <ChatMessageContent content={m.content} />
              </div>
            ))}
            {loading ? (
              <div className="me-6 rounded-2xl bg-surface px-3 py-2 text-sm text-muted ring-1 ring-border">
                جاري الإرسال…
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl bg-amber-500/12 px-3 py-2 text-sm text-foreground ring-1 ring-amber-500/25">
                {error}
              </div>
            ) : null}
            <div ref={endRef} className="h-px shrink-0" aria-hidden />
          </div>

          <footer className="min-h-0 shrink-0 border-t border-border p-2">
            {quickReplies.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5" dir="rtl">
                {quickReplies.map((q) => (
                  <button
                    key={q.presetId}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      void sendMessage(presetCanonicalMessage(q.presetId), q.presetId)
                    }
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-primary/10 disabled:opacity-40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                type="text"
                dir="rtl"
                maxLength={MAX_INPUT}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input.trim());
                  }
                }}
                placeholder="اكتب سؤالك…"
                className="min-h-touch min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-primary/30 placeholder:text-muted focus:ring-2 disabled:opacity-50"
                aria-label="رسالتك"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="min-h-touch shrink-0 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-40"
              >
                إرسال
              </button>
            </div>
            <p className="mt-1 text-center text-[10px] text-muted">
              {input.length}/{MAX_INPUT}
            </p>
          </footer>
        </div>
      ) : null}
    </>
  );
}

function ChatGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3C7.03 3 3 6.58 3 11c0 2.13 1.02 4.05 2.67 5.4L4.5 21l5.02-1.32C10.62 20.23 11.3 20.33 12 20.33c4.97 0 9-3.58 9-8s-4.03-8-9-8Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M8.25 11.25h1.5v1.5h-1.5v-1.5Zm3 0h1.5v1.5h-1.5v-1.5Zm3 0h1.5v1.5h-1.5v-1.5Z"
        fill="white"
      />
    </svg>
  );
}
