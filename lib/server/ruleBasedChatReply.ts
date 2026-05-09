import "server-only";

import {
  type CatalogAudience,
  publicCatalogFileViewPath,
} from "@/lib/constants/catalogChannels";
import type { ChatPresetId } from "@/lib/constants/chatPresets";
import type { AutoPickedChatCard } from "@/lib/server/catalogAutoPickForChat";
import {
  type CatalogCardChatBundle,
  pickExcerptForQuestion,
} from "@/lib/server/catalogCardChatContext";
import type { FolderCatalogFileRow } from "@/lib/server/folderCatalogChatContext";
import { getSiteWhatsappContactsForChat } from "@/lib/server/siteSettingsForChat";
import type { WhatsAppContact } from "@/lib/types/models";

const MAX_REPLY_CHARS = 9500;
const SINGLE_EXCERPT_CAP = 12_000;
const MULTI_EXCERPT_CAP = 4200;

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

function formatFolderReply(rows: FolderCatalogFileRow[]): string {
  const lines = rows.slice(0, 45).map((r) => `- [${r.title}](${r.path})`);
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
    return clampReply(
      `تقدر تفتح القائمة من هنا: [${loadedCard.bundle.title}](${path})\n\nلو محتاج مقتطف من النص، اختار «مقتطف من القائمة» أو اكتب سؤال عن صنف معيّن.`,
    );
  }

  if (loadedCard.kind === "ok") {
    const cap = SINGLE_EXCERPT_CAP;
    let excerpt = pickExcerptForQuestion(loadedCard.excerpt, q, cap);
    if (!excerpt && loadedCard.excerpt) excerpt = loadedCard.excerpt.slice(0, cap);
    const path = publicCatalogFileViewPath(audience, cardIdForPath);
    const parts: string[] = [
      `دي مقتطفات آلية من نص القائمة «${loadedCard.bundle.title}» (مش الملف كامل؛ للتأكد افتح المعاينة).`,
      "",
      `[فتح القائمة](${path})`,
    ];
    if (loadedCard.bundle.productCount != null) {
      parts.push(
        "",
        `— تقريباً ${loadedCard.bundle.productCount} بند/صف في القائمة حسب بيانات الموقع.`,
      );
    }
    if (excerpt) {
      parts.push("", "---", "", excerpt);
    } else {
      parts.push(
        "",
        "مفيش نص مستخرج متاح للبحث هنا؛ استخدم معاينة الـ PDF في الصفحة.",
      );
    }
    return clampReply(parts.join("\n"));
  }

  if (autoPickedCards.length > 0) {
    const chunks: string[] = [
      "دي مقتطفات من أكتر من قائمة ممكن تتعلق بسؤالك (مش الملف كامل). راجع المعاينة في الصفحة للتأكد.",
      "",
    ];
    for (const c of autoPickedCards) {
      const cap = MULTI_EXCERPT_CAP;
      const ex =
        pickExcerptForQuestion(c.fullExcerpt, q, cap) ??
        (c.fullExcerpt ? c.fullExcerpt.slice(0, cap) : null);
      const p = publicCatalogFileViewPath(audience, c.cardId);
      chunks.push(`### ${c.bundle.title}`, `[فتح القائمة](${p})`, "");
      if (ex) chunks.push(ex);
      chunks.push("", "---", "");
    }
    return clampReply(chunks.join("\n").trim());
  }

  let out =
    "مقدرش أطلع مقتطف من غير ما تكون فاتح قائمة من الكتالوج أو تكتب سؤال يتطابق مع ملف. دور على القائمة وافتحها من الموقع، أو جرّب تاني بعد ما تختار مجلد أو ملف.";
  if (contacts.length > 0) {
    out += `\n\n${formatContactReply(contacts)}`;
  }
  return clampReply(out);
}
