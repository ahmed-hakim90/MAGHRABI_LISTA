import { NextResponse } from "next/server";
import { type CatalogAudience } from "@/lib/constants/catalogChannels";
import {
  isChatPresetId,
  presetCanonicalMessage,
  type ChatPresetId,
} from "@/lib/constants/chatPresets";
import {
  type CatalogCardChatBundle,
  getActiveCardChatBundle,
} from "@/lib/server/catalogCardChatContext";
import { loadAutoPickedCardsForChat } from "@/lib/server/catalogAutoPickForChat";
import { listFolderCatalogFilesForChat } from "@/lib/server/folderCatalogChatContext";
import { getCatalogTextForChatFromBundle } from "@/lib/server/catalogTextIndex";
import { buildRuleBasedChatReply } from "@/lib/server/ruleBasedChatReply";
import { isCatalogChatEnabled } from "@/lib/constants/catalogChatEnabled";

export const runtime = "nodejs";
/** Auto-pick may fetch several PDFs in parallel on cold cache. */
export const maxDuration = 60;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES_PER_HOUR = 10;
const MAX_MESSAGE_LEN = 300;
const MAX_HISTORY_MESSAGE_CONTENT = 2000;
const MAX_HISTORY_MESSAGES = 4;

const rateBuckets = new Map<string, number[]>();

function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Rolling 1h window: max 10 requests per IP. */
function allowChatRate(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const prev = rateBuckets.get(ip)?.filter((t) => t > cutoff) ?? [];
  if (prev.length >= MAX_MESSAGES_PER_HOUR) return false;
  prev.push(now);
  rateBuckets.set(ip, prev);
  return true;
}

function sanitizeText(raw: string): string {
  return raw
    .replace(/\0/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

type ChatRole = "user" | "assistant";

type Body = {
  message?: unknown;
  history?: unknown;
  audience?: unknown;
  presetId?: unknown;
  /** When user is on /{wholesale|retail}/file/{id}/… */
  cardId?: unknown;
  /** When user is on /{wholesale|retail}/folder/{id} */
  folderId?: unknown;
};

function normalizeHistory(raw: unknown): Array<{ role: ChatRole; content: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ role: ChatRole; content: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const trimmed = sanitizeText(content).slice(0, MAX_HISTORY_MESSAGE_CONTENT);
    if (!trimmed) continue;
    out.push({ role, content: trimmed });
  }
  return out.slice(-MAX_HISTORY_MESSAGES);
}

type LoadedCard =
  | { kind: "none" }
  | { kind: "ok"; bundle: CatalogCardChatBundle; excerpt: string | null };

export async function POST(request: Request) {
  try {
    return await handleChatPost(request);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[api/chat] unhandled exception:", err.message, err.stack);
    const firebaseHint = /FIREBASE|firebase|private_key|service_account/i.test(
      err.message,
    );
    return NextResponse.json(
      {
        error: "internal_error",
        code: "internal_error",
        message: firebaseHint
          ? "إعداد Firebase Admin على Vercel غير صالح أو ناقص. راجع FIREBASE_SERVICE_ACCOUNT_JSON (JSON صحيح في سطر واحد) أو FIREBASE_ADMIN_*، ثم أعد النشر."
          : "خطأ داخلية في الخادم. من Vercel → Logs ابحث عن [api/chat] unhandled.",
        ...(process.env.NODE_ENV === "development"
          ? { debug: { detail: err.message } }
          : {}),
      },
      { status: 500 },
    );
  }
}

async function handleChatPost(request: Request): Promise<NextResponse> {
  if (!isCatalogChatEnabled()) {
    return NextResponse.json(
      {
        error: "chat_disabled",
        code: "chat_disabled",
        message: "الشات غير متاح حالياً.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "طلب غير صالح." },
      { status: 400 },
    );
  }

  const audienceRaw = body.audience;
  if (audienceRaw !== "wholesale" && audienceRaw !== "retail") {
    return NextResponse.json(
      { error: "invalid_audience", message: "قناة غير مدعومة." },
      { status: 400 },
    );
  }
  const audience = audienceRaw;

  const presetRaw = typeof body.presetId === "string" ? body.presetId.trim() : "";
  const presetId: ChatPresetId | undefined = isChatPresetId(presetRaw)
    ? presetRaw
    : undefined;

  const messageFromClient = sanitizeText(
    typeof body.message === "string" ? body.message : "",
  );
  const canonical = presetId ? presetCanonicalMessage(presetId) : null;
  const displayMessage = (messageFromClient || canonical || "").trim();

  if (!displayMessage) {
    return NextResponse.json(
      { error: "empty_message", message: "اكتب رسالة قبل الإرسال." },
      { status: 400 },
    );
  }
  if (displayMessage.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { error: "message_too_long", message: "الرسالة طويلة جداً (الحد ٣٠٠ حرف)." },
      { status: 400 },
    );
  }

  const effectiveQuery = (canonical ?? messageFromClient).trim();
  if (!effectiveQuery) {
    return NextResponse.json(
      { error: "empty_message", message: "اكتب رسالة قبل الإرسال." },
      { status: 400 },
    );
  }

  void normalizeHistory(body.history);

  const ip = clientIp(request);
  if (!allowChatRate(ip)) {
    return NextResponse.json(
      {
        error: "rate_limit",
        message:
          "وصلت للحد المسموح من الرسائل خلال ساعة. جرّب تاني بعد شوية.",
      },
      { status: 429 },
    );
  }

  const cardIdRaw = typeof body.cardId === "string" ? body.cardId.trim() : "";
  const folderIdRaw =
    typeof body.folderId === "string" ? body.folderId.trim() : "";

  let loadedCard: LoadedCard = { kind: "none" };
  if (cardIdRaw) {
    try {
      const bundle = await getActiveCardChatBundle(
        cardIdRaw,
        audience as CatalogAudience,
      );
      if (bundle) {
        const excerpt = await getCatalogTextForChatFromBundle(bundle);
        loadedCard = { kind: "ok", bundle, excerpt };
      } else if (process.env.NODE_ENV === "development") {
        console.warn(
          "[api/chat] cardId ignored (inactive, wrong channel, or missing file):",
          cardIdRaw,
        );
      }
    } catch (e) {
      console.warn(
        "[api/chat] card context unavailable (often missing Firebase Admin on server):",
        e,
      );
      loadedCard = { kind: "none" };
    }
  }

  let autoPickedCards: Awaited<ReturnType<typeof loadAutoPickedCardsForChat>> =
    [];
  if (loadedCard.kind !== "ok") {
    try {
      autoPickedCards = await loadAutoPickedCardsForChat(
        effectiveQuery,
        audience as CatalogAudience,
        { folderId: folderIdRaw || undefined },
      );
    } catch (e) {
      console.warn("[api/chat] auto-pick catalog failed", e);
    }
  }

  let folderRows =
    folderIdRaw && !cardIdRaw
      ? await listFolderCatalogFilesForChat(
          folderIdRaw,
          audience as CatalogAudience,
        )
      : [];
  if (folderIdRaw && !cardIdRaw && autoPickedCards.length > 0) {
    folderRows = [];
  }

  const reply = await buildRuleBasedChatReply({
    audience: audience as CatalogAudience,
    effectiveQuery,
    presetId,
    loadedCard,
    autoPickedCards,
    folderRows,
    cardIdForPath: cardIdRaw,
    onFolderPage: !!folderIdRaw && !cardIdRaw,
  });

  if (!reply.trim()) {
    return NextResponse.json(
      { error: "empty_reply", message: "مفيش رد. حاول تاني." },
      { status: 502 },
    );
  }

  return NextResponse.json({ reply });
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
