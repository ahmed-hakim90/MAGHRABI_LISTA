import { NextResponse } from "next/server";
import {
  type CatalogAudience,
  publicCatalogFileViewPath,
} from "@/lib/constants/catalogChannels";
import {
  buildCatalogContextBlock,
  buildMultiFileCatalogContextBlock,
  type CatalogCardChatBundle,
  type CatalogContextExcerptMode,
  getActiveCardChatBundle,
  pickExcerptForQuestion,
} from "@/lib/server/catalogCardChatContext";
import { loadAutoPickedCardsForChat } from "@/lib/server/catalogAutoPickForChat";
import { buildFolderFilesContextForChat } from "@/lib/server/folderCatalogChatContext";
import { getCatalogTextForChatFromBundle } from "@/lib/server/catalogTextIndex";
import { buildSiteContactContextForChat } from "@/lib/server/siteSettingsForChat";

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

function systemPrompt(
  audience: "wholesale" | "retail",
  hasFileContext: boolean,
  hasFolderContext: boolean,
): string {
  const channelHint =
    audience === "wholesale"
      ? "المستخدم يتصفح كتالوج الجملة فقط. اذكر كتالوج الجملة عند الحاجة ولا تخلطه بتجزئة."
      : "المستخدم يتصفح كتالوج التجزئة فقط. اذكر كتالوج التجزئة عند الحاجة ولا تخلطه بجملة.";

  const priceRule = hasFileContext
    ? "لو وُجد «نص PDF» أو «Auto-selected catalog files» أو بيانات بطاقة، اذكر المنتجات والأسعار **من النص فقط** حرفياً قدر الإمكان. لو السؤال عن **صنف معيّن** (مثل خلاط أو مكنسة): ابحث في المقتطف عن أقرب اسم/كود بالعربي أو الإنجليزي واذكر **السعر والموديل/الكود** لكل صف واضح؛ لو وُجد أكثر من سطر للصنف، عِدّهم وقل **عدد الموديلات الظاهر** في المقتطف. لو السؤال عن **أقل سعر** أو **أرخص موديل** أو **بكام**: قارن الأرقام في المقتطف واذكر **اسم أو كود المنتج** والسعر للأرخص إن وُجد. **روابط الكتالوج:** لو المقتطف ناقص، اعرض الرابط كـ Markdown: `[عنوان القائمة](/wholesale/file/…/view)` أو `[العنوان](/retail/file/…/view)` بحيث **يظهر للمستخدم العنوان فقط** والمسار يكون داخل الأقواس — **ممنوع** كتابة المسار الخام ظاهراً ثم «بعنوان»؛ انسخ المسار من «Catalog link» أو «Open:» أو السياق داخل أقواس Markdown. **ممنوع** الاكتفاء بعبارة عامة من غير رابط Markdown. لو وُجد «Line count (from card)» ولم تستطع العدّ من النص، اذكره كتقريب لحجم القائمة مع تنبيه أن التفاصيل في المعاينة."
    : "من غير مقتطف PDF: ما تذكرش أسعار ولا تفاصيل منتج من جدول؛ لو فيه قائمة عناوين ملفات في المجلد استخدمها، وإلا وجّه يفتح الملف المناسب أو يتواصل مع المبيعات.";

  const folderRule = hasFolderContext
    ? "قسم «Current folder» فيه عناوين الملفات و**مسارات الفتح** (`/wholesale/file/...` أو `/retail/file/...`)؛ لو اتسأل «أنهي كتالوج؟» أو «إيه المتاح؟» أو عن صنف معيّن، اذكر **العنوان + المسار** من السياق عشان المستخدم يفتح الملف الصح مباشرة."
    : "";

  return `أنت مساعد موقع كتالوج المغربي (ElMaghraby).
تفهم العربي الفصحى والعامة، ورد بالمصري المهذب المختصر.

قواعد أسلوب (مهم):
- الرد يكون **قصير**: جملتين إلى أربع جمل كحد أقصى، إلا لو المستخدم طلب تفصيل صريح.
- **ممنوع** خاتمة ترحيبية أو تكرار «أنا هنا للمساعدة» أو أي جملة فضلة من نفس النوع.
- ممنوع تكرار نفس الفكرة مرتين في نفس الرد.

محتوى:
- لا تخترع أسعاراً ولا موديلات ولا توفر منتج إلا إذا ورد صراحة في «بيانات البطاقة» أو «نص PDF» داخل المقتطف أدناه.
- أسئلة التواصل أو الدعم أو الواتساب: لو وُجد قسم «Site contact info»، اعرض **الرقم كأرقام واضحة** (نفس التسلسل المذكور) مع اسم القناة، وبعدها يمكنك رابط wa.me **مرة واحدة** لكل قناة؛ من غير تكرار نفس الرابط أو عرض روابط بس من غير الرقم. لا تقُل إن المعلومة غير متوفرة إذا ظهرت هناك.
${priceRule}
${folderRule ? `${folderRule}\n` : ""}${channelHint}`;
}

type ChatRole = "user" | "assistant";

type Body = {
  message?: unknown;
  history?: unknown;
  audience?: unknown;
  /** When user is on /{wholesale|retail}/file/{id}/… */
  cardId?: unknown;
  /** When user is on /{wholesale|retail}/folder/{id} */
  folderId?: unknown;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string } | string;
  message?: string;
};

function extractUpstreamErrorMessage(parsed: OpenAIChatResponse): string | undefined {
  if (typeof parsed.error === "string") return parsed.error;
  if (parsed.error && typeof parsed.error === "object" && "message" in parsed.error) {
    const m = parsed.error.message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message.trim();
  return undefined;
}

/** Provider safety filter (e.g. DeepSeek / gateway) refused input or output. */
function isUpstreamContentBlocked(detail: string | undefined): boolean {
  if (!detail) return false;
  return /content-blocked|content_blocked|content\s*blocked/i.test(detail);
}

/** Normalize OpenAI-style assistant content (string or content-parts array). */
function extractAssistantReply(parsed: OpenAIChatResponse): string | undefined {
  const raw = parsed.choices?.[0]?.message?.content;
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t || undefined;
  }
  if (Array.isArray(raw)) {
    const parts = raw
      .map((p) => {
        if (!p || typeof p !== "object") return "";
        if (p.type === "text" && typeof p.text === "string") return p.text;
        return "";
      })
      .join("");
    const t = parts.trim();
    return t || undefined;
  }
  return undefined;
}

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

/** Reduces false positives when PDFs list power tools (drill, saw, hammer, battery). */
function englishModerationPreamble(hasFileContext: boolean): string {
  if (!hasFileContext) return "";
  return (
    "[English — safety classification] You help customers of ElMaghraby, an Egyptian catalog site. " +
      "The prompt may include long OCR text from a legal wholesale price-list PDF: product titles, SKU codes, pack sizes, and numeric prices only. " +
      "Words like drill, hammer drill, rotary hammer, saw, and battery refer to retail power tools and accessories, not violence or weapons. " +
      "Use only the provided excerpt for facts. If the user asks for the lowest price or cheapest model, compare numeric prices visible in the OCR lines and name the model/SKU and price; do not reply with only a file link. " +
      "Always reply in polite Egyptian Arabic.\n\n" +
      "---\n\n"
  );
}

type LoadedCard =
  | { kind: "none" }
  | { kind: "ok"; bundle: CatalogCardChatBundle; excerpt: string | null };

/** OpenRouter (default). Legacy AGENTROUTER_* still read if OPENROUTER_API_KEY unset. */
function openRouterCompatConfig():
  | { apiKey: string; baseUrl: string; model: string }
  | null {
  const apiKey =
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.AGENTROUTER_API_KEY?.trim();
  const baseUrl = (
    process.env.OPENROUTER_BASE_URL?.trim() ||
    process.env.AGENTROUTER_BASE_URL?.trim() ||
    "https://openrouter.ai/api/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.OPENROUTER_MODEL?.trim() ||
    process.env.AGENTROUTER_MODEL?.trim();
  if (!apiKey || !model) return null;
  return { apiKey, baseUrl, model };
}

type ChatLlmConfig = NonNullable<ReturnType<typeof openRouterCompatConfig>>;

export async function POST(request: Request) {
  const cfg = openRouterCompatConfig();
  if (!cfg) {
    const hasKey =
      !!(process.env.OPENROUTER_API_KEY?.trim() ||
        process.env.AGENTROUTER_API_KEY?.trim());
    const hasModel =
      !!(process.env.OPENROUTER_MODEL?.trim() ||
        process.env.AGENTROUTER_MODEL?.trim());
    let msg = "الخدمة غير متاحة حالياً.";
    if (!hasKey && !hasModel) {
      msg =
        "إعدادات الذكاء الاصطناعي ناقصة: حط OPENROUTER_API_KEY و OPENROUTER_MODEL في ملف البيئة على السيرفر ثم أعد تشغيل التطبيق.";
    } else if (!hasKey) {
      msg =
        "مفتاح OpenRouter مفقود: عرّف OPENROUTER_API_KEY في البيئة وأعد تشغيل السيرفر.";
    } else if (!hasModel) {
      msg =
        "موديل OpenRouter مفقود: عرّف OPENROUTER_MODEL (مثل openai/gpt-4o-mini) وأعد تشغيل السيرفر.";
    }
    return NextResponse.json(
      {
        error: "service_unavailable",
        code: "missing_llm_config",
        message: msg,
      },
      { status: 503 },
    );
  }

  try {
    return await handleChatPost(request, cfg);
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
          : "خطأ داخلية في الخادم. من Vercel → Logs ابحث عن [api/chat] unhandled. تأكد أن OPENROUTER_API_KEY و OPENROUTER_MODEL و Firebase Admin مضبوطين لبيئة Production (ليس Preview فقط) ثم Redeploy.",
        ...(process.env.NODE_ENV === "development"
          ? { debug: { detail: err.message } }
          : {}),
      },
      { status: 500 },
    );
  }
}

async function handleChatPost(
  request: Request,
  cfg: ChatLlmConfig,
): Promise<NextResponse> {
  const { apiKey, baseUrl, model } = cfg;

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

  const messageRaw = typeof body.message === "string" ? body.message : "";
  const message = sanitizeText(messageRaw);
  if (!message) {
    return NextResponse.json(
      { error: "empty_message", message: "اكتب رسالة قبل الإرسال." },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { error: "message_too_long", message: "الرسالة طويلة جداً (الحد ٣٠٠ حرف)." },
      { status: 400 },
    );
  }

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

  const history = normalizeHistory(body.history);
  const fullPdfExcerpt =
    loadedCard.kind === "ok" ? loadedCard.excerpt : null;
  const siteContactBlock = await buildSiteContactContextForChat();

  let autoPickedCards: Awaited<ReturnType<typeof loadAutoPickedCardsForChat>> =
    [];
  if (loadedCard.kind !== "ok") {
    try {
      autoPickedCards = await loadAutoPickedCardsForChat(
        message,
        audience as CatalogAudience,
        { folderId: folderIdRaw || undefined },
      );
    } catch (e) {
      console.warn("[api/chat] auto-pick catalog failed", e);
    }
  }

  const folderContextBlockRaw =
    folderIdRaw && !cardIdRaw
      ? await buildFolderFilesContextForChat(
          folderIdRaw,
          audience as CatalogAudience,
        )
      : "";
  /** Skip duplicate titles when we already attached PDF excerpts for this folder. */
  const folderContextBlock =
    folderContextBlockRaw && autoPickedCards.length === 0
      ? folderContextBlockRaw
      : "";

  const url = `${baseUrl}/chat/completions`;

  for (let attempt = 0; attempt < 3; attempt++) {
    let catalogBlock = "";
    let excerptMode: CatalogContextExcerptMode = "relevant_slice";

    if (loadedCard.kind === "ok") {
      let excerptForModel: string | null = null;
      if (attempt === 2) {
        excerptMode = "metadata_only";
        excerptForModel = null;
      } else {
        const cap = attempt === 0 ? 12_000 : 6000;
        excerptForModel = pickExcerptForQuestion(fullPdfExcerpt, message, cap);
        if (!excerptForModel && fullPdfExcerpt) {
          excerptForModel = fullPdfExcerpt.slice(0, cap);
        }
      }
      catalogBlock = buildCatalogContextBlock(loadedCard.bundle, excerptForModel, {
        excerptMode,
        catalogViewPath: publicCatalogFileViewPath(
          audience as CatalogAudience,
          cardIdRaw,
        ),
      });
    } else if (autoPickedCards.length > 0) {
      excerptMode = attempt === 2 ? "metadata_only" : "relevant_slice";
      const capPer = attempt === 0 ? 4200 : 2400;
      const items = autoPickedCards.map((c) => ({
        cardId: c.cardId,
        bundle: c.bundle,
        excerpt:
          excerptMode === "metadata_only"
            ? null
            : pickExcerptForQuestion(c.fullExcerpt, message, capPer) ??
              (c.fullExcerpt
                ? c.fullExcerpt.slice(0, capPer)
                : null),
        excerptMode,
      }));
      catalogBlock = buildMultiFileCatalogContextBlock(
        audience as CatalogAudience,
        items,
      );
    }

    const hasFileContext = catalogBlock.length > 0;
    const hasFolderContext = folderContextBlock.length > 0;
    const systemContent =
      englishModerationPreamble(hasFileContext) +
      systemPrompt(audience, hasFileContext, hasFolderContext) +
      (catalogBlock ? `\n\n${catalogBlock}` : "") +
      (folderContextBlock ? `\n\n${folderContextBlock}` : "") +
      (siteContactBlock ? `\n\n${siteContactBlock}` : "");
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemContent },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const llmHeaders: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
    if (referer) llmHeaders["HTTP-Referer"] = referer;
    const appTitle = process.env.OPENROUTER_APP_TITLE?.trim();
    if (appTitle) llmHeaders["X-Title"] = appTitle;

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: llmHeaders,
        body: JSON.stringify({
          model: model.trim(),
          messages,
          max_tokens: hasFileContext ? 560 : 260,
          temperature: 0.25,
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name === "TimeoutError" || name === "AbortError") {
        return NextResponse.json(
          {
            error: "timeout",
            code: "timeout",
            message: "الطلب استغرق وقت طويل. حاول مرة تانية.",
          },
          { status: 504 },
        );
      }
      return NextResponse.json(
        {
          error: "upstream_error",
          message: "حصل خطأ في الاتصال. حاول مرة تانية.",
        },
        { status: 502 },
      );
    }

    const text = await upstream.text();
    let parsed: OpenAIChatResponse;
    try {
      parsed = JSON.parse(text) as OpenAIChatResponse;
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[api/chat] Upstream returned non-JSON. status=%s body=%s",
          upstream.status,
          text.slice(0, 800),
        );
      }
      return NextResponse.json(
        {
          error: "upstream_error",
          message: "رد غير متوقع من خادم الذكاء الاصطناعي.",
          ...(process.env.NODE_ENV === "development"
            ? { debug: { upstreamStatus: upstream.status, bodySnippet: text.slice(0, 300) } }
            : {}),
        },
        { status: 502 },
      );
    }

    if (upstream.ok) {
      const reply = extractAssistantReply(parsed);
      if (!reply) {
        if (process.env.NODE_ENV === "development") {
          console.error("[api/chat] Empty assistant content. body=%s", text.slice(0, 1200));
        }
        return NextResponse.json(
          {
            error: "empty_reply",
            message:
              "مفيش رد من المساعد. جرّب موديل تاني أو راجع OPENROUTER_MODEL في إعدادات السيرفر.",
            ...(process.env.NODE_ENV === "development"
              ? { debug: { upstreamStatus: upstream.status, bodySnippet: text.slice(0, 400) } }
              : {}),
          },
          { status: 502 },
        );
      }
      return NextResponse.json({ reply });
    }

    const upstreamDetail = extractUpstreamErrorMessage(parsed);
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[api/chat] Upstream error status=%s detail=%s body=%s",
        upstream.status,
        upstreamDetail ?? "(none)",
        text.slice(0, 1200),
      );
    }

    if (
      attempt < 2 &&
      isUpstreamContentBlocked(upstreamDetail) &&
      loadedCard.kind === "ok"
    ) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[api/chat] content_blocked: retry with stricter excerpt pass", attempt + 1);
      }
      continue;
    }

    if (upstream.status === 402 || upstream.status === 429) {
      return NextResponse.json(
        {
          error: "quota",
          code: "quota",
          message:
            "الخدمة وصلت لحد الاستخدام المسموح. جرّب تاني لاحقاً أو تواصل معنا.",
        },
        { status: 429 },
      );
    }

    if (upstream.status === 401) {
      return NextResponse.json(
        {
          error: "upstream_auth",
          message:
            "مفتاح OpenRouter غير صالح أو منتهي. راجع OPENROUTER_API_KEY في إعدادات السيرفر.",
          ...(process.env.NODE_ENV === "development"
            ? { debug: { upstreamStatus: 401, detail: upstreamDetail } }
            : {}),
        },
        { status: 502 },
      );
    }

    if (upstream.status === 403) {
      return NextResponse.json(
        {
          error: "upstream_forbidden",
          message:
            "الموديل المختار غير مسموح لهذا المفتاح أو غير متاح على OpenRouter. راجع OPENROUTER_MODEL في لوحة OpenRouter.",
          ...(process.env.NODE_ENV === "development"
            ? { debug: { upstreamStatus: 403, detail: upstreamDetail } }
            : {}),
        },
        { status: 502 },
      );
    }

    if (isUpstreamContentBlocked(upstreamDetail)) {
      return NextResponse.json(
        {
          error: "content_blocked",
          code: "content_blocked",
          message:
            "فلترة الأمان عند مزود الموديل منعت الطلب. جرّب سؤال أقصر أو موديل تاني من OpenRouter، أو امسح المحادثة وابدأ من جديد.",
          ...(process.env.NODE_ENV === "development"
            ? {
                debug: {
                  upstreamStatus: upstream.status,
                  detail: upstreamDetail,
                },
              }
            : {}),
        },
        { status: 502 },
      );
    }

    const userMsg =
      upstream.status === 400 && upstreamDetail
        ? `طلب غير مقبول من مزود الموديل: ${upstreamDetail}`
        : "مش قادرين نكمل الطلب دلوقتي. حاول تاني.";

    return NextResponse.json(
      {
        error: "upstream_error",
        message: userMsg,
        ...(process.env.NODE_ENV === "development"
          ? { debug: { upstreamStatus: upstream.status, detail: upstreamDetail } }
          : {}),
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      error: "upstream_error",
      message: "مش قادرين نكمل الطلب دلوقتي. حاول تاني.",
    },
    { status: 502 },
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
