import "server-only";

import {
  type CatalogAudience,
  publicCatalogFileViewPath,
} from "@/lib/constants/catalogChannels";
import type { ChatPresetId } from "@/lib/constants/chatPresets";
import type { AutoPickedChatCard } from "@/lib/server/catalogAutoPickForChat";
import {
  searchTokensFromUserMessage,
  type CatalogCardChatBundle,
  pickExcerptForQuestion,
} from "@/lib/server/catalogCardChatContext";
import type { FolderCatalogFileRow } from "@/lib/server/folderCatalogChatContext";
import { getSiteWhatsappContactsForChat } from "@/lib/server/siteSettingsForChat";
import type { WhatsAppContact } from "@/lib/types/models";

const MAX_REPLY_CHARS = 9500;
const SINGLE_EXCERPT_CAP = 12_000;
const MULTI_EXCERPT_CAP = 4200;
const MAX_AUTO_REPLY_CARDS = 3;
const PRICE_RE =
  /(?:\b(?:egp|le|l\.e|جنيه|ج\.?)\s*[\d٠-٩][\d٠-٩\s,.]*|[\d٠-٩][\d٠-٩\s,.]*(?:\s*(?:egp|le|l\.e|جنيه|ج\.?)))/giu;
const OFFER_RE =
  /عرض|عروض|خصم|تخفيض|تخفيضات|وفر|مجانا|هدية|باكدج|bundle|offer|offers|discount|promo|promotion|free/i;

function clampReply(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_REPLY_CHARS) return t;
  return `${t.slice(0, MAX_REPLY_CHARS - 20).trim()}…\n\n(المقتطف مقصوص؛ افتح المعاينة للباقي.)`;
}

function isContactQuery(q: string): boolean {
  return /واتساب|تواصل|دعم|مبيعات|أرقام|ارقام|تليفون|هاتف|اتصال|رقم\s*(التواصل|الدعم|الواتساب|المبيعات)|sales|whatsapp|contact/i.test(
    q,
  );
}

function isFolderListQuery(q: string): boolean {
  return /إيه\s*المتاح|ايه\s*المتاح|أنهي\s*كتالوج|انهي\s*كتالوج|قوائم\s*الأسعار|قوائم\s*الاسعار|عناوين\s*الملفات|كتالوجات|إيه\s*الملفات|ايه\s*الملفات|إيه\s*الملف|ايه\s*الملف|اي\s*ملف|إيه\s*فين\s*المجلد|ايه\s*فين\s*المجلد|ملفات\s*الأسعار|ملفات\s*الاسعار/i.test(
    q,
  );
}

function matchesHelpQuery(q: string): boolean {
  const t = q.trim();
  if (/^(إزاي|ازاي|ازي|كيف)\b/u.test(t)) return true;
  if (/^(مساعدة|help|دليل)(\s|[؟!.]|$)/iu.test(t)) return true;
  if (/^(استخدم|شرح)\b/u.test(t)) return true;
  return false;
}

function isPriceQuery(q: string): boolean {
  return /سعر|أسعار|اسعار|بكام|كام|الثمن|تكلفة|price|cost|egp|جنيه|ارخص|أرخص/i.test(
    q,
  );
}

function isOfferQuery(q: string): boolean {
  return OFFER_RE.test(q);
}

function formatContactReply(contacts: WhatsAppContact[]): string {
  if (contacts.length === 0) {
    return "مفيش أرقام تواصل متاحة في إعدادات الموقع حالياً.";
  }
  const lines = contacts.map(
    (c) =>
      `- **${c.displayName}**: ${c.phoneDigits}\n  [فتح واتساب](https://wa.me/${c.phoneDigits})`,
  );
  return "تواصل المبيعات والدعم:\n\n" + lines.join("\n\n");
}

function formatTagsLine(tags: string[]): string | null {
  const visible = tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
  if (visible.length === 0) return null;
  return `تاجات: ${visible.join("، ")}`;
}

function normalizeSnippet(text: string): string {
  return text.replace(/\s+/g, " ").replace(/[|]{2,}/g, "|").trim();
}

function uniqueByNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase().replace(/[^\p{L}\p{M}0-9]+/gu, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function extractPrices(snippets: string[]): string[] {
  const prices: string[] = [];
  for (const snippet of snippets) {
    for (const match of snippet.matchAll(PRICE_RE)) {
      const value = normalizeSnippet(match[0]).replace(/[.,،;:]+$/u, "");
      if (value.length >= 2) prices.push(value);
    }
  }
  return uniqueByNormalized(prices).slice(0, 4);
}

function extractOfferSnippets(snippets: string[]): string[] {
  return snippets.filter((snippet) => OFFER_RE.test(snippet)).slice(0, 2);
}

function pickEvidenceSnippets(
  excerpt: string | null,
  query: string,
  options: { maxSnippets?: number; allowFallback?: boolean } = {},
): string[] {
  if (!excerpt) return [];
  const flat = normalizeSnippet(excerpt);
  if (!flat) return [];

  const tokens = searchTokensFromUserMessage(query)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 2);
  const lower = flat.toLowerCase();
  const windows: Array<{ snippet: string; score: number }> = [];

  for (const token of tokens) {
    let from = 0;
    let guard = 0;
    while (guard < 8) {
      const idx = lower.indexOf(token, from);
      if (idx < 0) break;
      const start = Math.max(0, idx - 150);
      const end = Math.min(flat.length, idx + 270);
      const snippet = normalizeSnippet(flat.slice(start, end));
      const snippetLower = snippet.toLowerCase();
      let score = 2;
      for (const t of tokens) {
        if (snippetLower.includes(t)) score += 2;
      }
      if (PRICE_RE.test(snippet)) score += 5;
      PRICE_RE.lastIndex = 0;
      if (OFFER_RE.test(snippet)) score += 4;
      windows.push({ snippet, score });
      from = idx + token.length;
      guard += 1;
    }
  }

  if (windows.length === 0) {
    if (options.allowFallback === false) return [];
    const fallback = normalizeSnippet(flat.slice(0, 420));
    return fallback ? [fallback] : [];
  }

  windows.sort((a, b) => b.score - a.score || a.snippet.length - b.snippet.length);
  return uniqueByNormalized(windows.map((w) => w.snippet)).slice(
    0,
    options.maxSnippets ?? 2,
  );
}

function formatProductEvidenceReply(options: {
  title: string;
  path: string;
  tags: string | null;
  excerpt: string | null;
  query: string;
  intro: string;
  fileLabel?: string;
  allowFallbackEvidence?: boolean;
  missingEvidenceText?: string;
  showNegativeOffer?: boolean;
}): string {
  const snippets = pickEvidenceSnippets(options.excerpt, options.query, {
    allowFallback: options.allowFallbackEvidence,
  });
  const prices = extractPrices(snippets);
  const offerSnippets = extractOfferSnippets(snippets);
  const wantsPrice = isPriceQuery(options.query);
  const wantsOffer = isOfferQuery(options.query);

  const parts: string[] = [
    options.intro,
    "",
    `${options.fileLabel ?? "الملف المناسب"}: [${options.title}](${options.path})`,
  ];
  if (options.tags) parts.push(options.tags);

  if (snippets.length > 0) {
    parts.push("", "المكان داخل النص المستخرج:");
    parts.push(...snippets.map((snippet) => `- ${snippet}`));
  } else {
    parts.push(
      "",
      options.missingEvidenceText ??
        "المنتج مش ظاهر في النص المستخرج المتاح حالياً؛ افتح الملف وراجع المعاينة الكاملة.",
    );
  }

  if (wantsPrice) {
    parts.push(
      "",
      prices.length > 0
        ? `السعر الظاهر في المقتطف: ${prices.join(" / ")}`
        : "السعر مش ظاهر بوضوح في المقتطف المتاح؛ افتح الملف للتأكد من السعر النهائي.",
    );
  }

  if (wantsOffer && options.showNegativeOffer !== false) {
    parts.push(
      "",
      offerSnippets.length > 0
        ? `العرض الظاهر: ${offerSnippets[0]}`
        : "مفيش عرض واضح ظاهر في المقتطف المتاح لهذا السؤال.",
    );
  }

  return parts.join("\n");
}

function metadataSuggestsOffer(bundle: CatalogCardChatBundle): boolean {
  return OFFER_RE.test(
    [bundle.title, bundle.description, bundle.category, bundle.tags.join(" ")].join(" "),
  );
}

function formatFolderReply(rows: FolderCatalogFileRow[]): string {
  const lines = rows.slice(0, 45).map((r) => {
    const tags = formatTagsLine(r.tags);
    return `- [${r.title}](${r.path})${tags ? ` — ${tags}` : ""}`;
  });
  return "قوائم الأسعار في المجلد الحالي:\n\n" + lines.join("\n");
}

function formatHelpReply(
  audience: CatalogAudience,
  contacts: WhatsAppContact[],
  options: { inFolder?: boolean },
): string {
  const ch = audience === "wholesale" ? "كتالوج الجملة" : "كتالوج التجزئة";
  const parts = [
    `أنت في **${ch}**.`,
    "- افتح المجلد المناسب واختار قائمة الأسعار.",
  ];
  if (options.inFolder) {
    parts.push("- في المجلد: اختار ملف من القائمة، أو اختصار «ملفات المجلد» فوق.");
  }
  parts.push(
    "- من جوّا صفحة الملف اكتب اسم صنف أو سعر؛ هنطلع مقتطف من النص المستخرج (مش الملف كامل).",
    "- للتفاصيل الدقيقة استخدم معاينة الـ PDF في نفس الصفحة.",
  );
  const base = parts.join("\n");
  if (contacts.length === 0) return base;
  return `${base}\n\n${formatContactReply(contacts)}`;
}

export type RuleBasedChatInput = {
  audience: CatalogAudience;
  effectiveQuery: string;
  presetId?: ChatPresetId;
  loadedCard:
    | { kind: "none" }
    | { kind: "ok"; bundle: CatalogCardChatBundle; excerpt: string | null };
  autoPickedCards: AutoPickedChatCard[];
  folderRows: FolderCatalogFileRow[];
  cardIdForPath: string;
  onFolderPage: boolean;
};

export async function buildRuleBasedChatReply(
  input: RuleBasedChatInput,
): Promise<string> {
  const {
    audience,
    effectiveQuery,
    presetId,
    loadedCard,
    autoPickedCards,
    folderRows,
    cardIdForPath,
    onFolderPage,
  } = input;

  const contacts = await getSiteWhatsappContactsForChat();
  const q = effectiveQuery.trim();

  if (presetId === "contact_whatsapp" || isContactQuery(q)) {
    return clampReply(formatContactReply(contacts));
  }

  if (presetId === "general_help") {
    return clampReply(
      formatHelpReply(audience, contacts, { inFolder: onFolderPage && folderRows.length > 0 }),
    );
  }

  if (
    matchesHelpQuery(q) &&
    loadedCard.kind !== "ok" &&
    autoPickedCards.length === 0
  ) {
    return clampReply(
      formatHelpReply(audience, contacts, { inFolder: onFolderPage && folderRows.length > 0 }),
    );
  }

  if (
    folderRows.length > 0 &&
    (presetId === "folder_list" || (onFolderPage && isFolderListQuery(q)))
  ) {
    return clampReply(formatFolderReply(folderRows));
  }

  if (presetId === "file_link" && loadedCard.kind === "ok") {
    const path = publicCatalogFileViewPath(audience, cardIdForPath);
    const tags = formatTagsLine(loadedCard.bundle.tags);
    return clampReply(
      `تقدر تفتح القائمة من هنا: [${loadedCard.bundle.title}](${path})${tags ? `\n${tags}` : ""}\n\nلو محتاج مقتطف من النص، اختار «مقتطف من القائمة» أو اكتب سؤال عن صنف معيّن.`,
    );
  }

  if (loadedCard.kind === "ok") {
    const cap = SINGLE_EXCERPT_CAP;
    let excerpt = pickExcerptForQuestion(loadedCard.excerpt, q, cap);
    if (!excerpt && loadedCard.excerpt) excerpt = loadedCard.excerpt.slice(0, cap);
    const path = publicCatalogFileViewPath(audience, cardIdForPath);
    const parts: string[] = [
      formatProductEvidenceReply({
        title: loadedCard.bundle.title,
        path,
        tags: formatTagsLine(loadedCard.bundle.tags),
        excerpt,
        query: q,
        intro:
          "دي نتيجة من الملف المفتوح بناءً على النص المستخرج (مش الملف كامل؛ للتأكد افتح المعاينة).",
      }),
    ];
    if (loadedCard.bundle.productCount != null) {
      parts.push(
        "",
        `— تقريباً ${loadedCard.bundle.productCount} بند/صف في القائمة حسب بيانات الموقع.`,
      );
    }
    if (!excerpt) {
      parts.push(
        "",
        "مفيش نص مستخرج متاح للبحث هنا؛ استخدم معاينة الـ PDF في الصفحة.",
      );
    }
    return clampReply(parts.join("\n"));
  }

  if (autoPickedCards.length > 0) {
    const chunks: string[] = [
      "دي أقرب نتيجة من النص الكامل المتاح للملفات. لو السعر أو العرض مش ظاهر هنا، افتح الملف للتأكيد.",
      "",
    ];
    let shown = 0;
    let metadataOnlyShown = 0;
    for (const c of autoPickedCards) {
      const cap = MULTI_EXCERPT_CAP;
      const ex =
        pickExcerptForQuestion(c.fullExcerpt, q, cap) ??
        (c.fullExcerpt ? c.fullExcerpt.slice(0, cap) : null);
      const evidence = pickEvidenceSnippets(ex, q, {
        allowFallback: false,
        maxSnippets: 2,
      });
      const offerByMetadata = isOfferQuery(q) && metadataSuggestsOffer(c.bundle);
      if (evidence.length === 0 && !offerByMetadata) continue;
      if (evidence.length === 0 && metadataOnlyShown >= 1) continue;
      const p = publicCatalogFileViewPath(audience, c.cardId);
      chunks.push(
        `### ${c.bundle.title}`,
        formatProductEvidenceReply({
          title: c.bundle.title,
          path: p,
          tags: formatTagsLine(c.bundle.tags),
          excerpt: ex,
          query: q,
          intro:
            evidence.length > 0
              ? "ملف فيه دليل قريب من سؤالك:"
              : "ملف عنوانه أو تاجاته بتشير لعروض، لكن النص المستخرج مش مظهر تفاصيل كفاية:",
          fileLabel: "افتح الملف",
          allowFallbackEvidence: false,
          missingEvidenceText:
            "مفيش سطر عرض واضح مستخرج من النص؛ افتح الملف لأن اسمه/تاجاته بتشير للعروض.",
          showNegativeOffer: evidence.length > 0,
        }),
      );
      chunks.push("", "---", "");
      shown += 1;
      if (evidence.length === 0) metadataOnlyShown += 1;
      if (shown >= MAX_AUTO_REPLY_CARDS) break;
    }
    if (shown > 0) return clampReply(chunks.join("\n").trim());

    return clampReply(
      "ملقتش عرض واضح في النص المستخرج للملفات المطابقة. جرّب اسم ماركة أو منتج محدد، أو افتح ملف العروض من القائمة للتأكد من الصفحة نفسها.",
    );
  }

  let out =
    "مقدرش أطلع مقتطف من غير ما تكون فاتح قائمة من الكتالوج أو تكتب سؤال يتطابق مع ملف. دور على القائمة وافتحها من الموقع، أو جرّب تاني بعد ما تختار مجلد أو ملف.";
  if (contacts.length > 0) {
    out += `\n\n${formatContactReply(contacts)}`;
  }
  return clampReply(out);
}
