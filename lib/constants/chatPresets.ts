/**
 * Quick-reply presets for public catalog chat (client + server).
 * Server trusts presetId for intent; canonical message is used for PDF excerpt matching.
 */

export type ChatPresetId =
  | "contact_whatsapp"
  | "folder_list"
  | "file_link"
  | "file_excerpt"
  | "general_help";

const PRESET_META: Record<
  ChatPresetId,
  { label: string; canonicalMessage: string }
> = {
  contact_whatsapp: {
    label: "واتساب وتواصل",
    canonicalMessage: "إيه أرقام الواتساب أو التواصل؟",
  },
  folder_list: {
    label: "ملفات المجلد",
    canonicalMessage: "إيه ملفات أو كتالوجات الأسعار المتاحة في المجلد ده؟",
  },
  file_link: {
    label: "رابط القائمة",
    canonicalMessage: "رابط فتح القائمة الحالية في الموقع",
  },
  file_excerpt: {
    label: "مقتطف من القائمة",
    canonicalMessage:
      "اعرضلي مقتطف من نص القائمة أو الأسعار الظاهرة في الملف الحالي",
  },
  general_help: {
    label: "مساعدة سريعة",
    canonicalMessage: "إزاي أستخدم الكتالوج أو أدور على منتج أو سعر؟",
  },
};

export function isChatPresetId(raw: string | undefined): raw is ChatPresetId {
  return !!raw && raw in PRESET_META;
}

export function presetCanonicalMessage(id: ChatPresetId): string {
  return PRESET_META[id].canonicalMessage;
}

export function presetLabel(id: ChatPresetId): string {
  return PRESET_META[id].label;
}

export type ChatQuickReply = { presetId: ChatPresetId; label: string };

/** Chips shown above the input; labels are short Arabic. */
export function getChatQuickRepliesForContext(options: {
  hasOpenFile: boolean;
  hasOpenFolder: boolean;
}): ChatQuickReply[] {
  const { hasOpenFile, hasOpenFolder } = options;
  const out: ChatQuickReply[] = [];
  if (hasOpenFile) {
    out.push({ presetId: "file_link", label: PRESET_META.file_link.label });
    out.push({ presetId: "file_excerpt", label: PRESET_META.file_excerpt.label });
  } else if (hasOpenFolder) {
    out.push({ presetId: "folder_list", label: PRESET_META.folder_list.label });
  }
  out.push({ presetId: "contact_whatsapp", label: PRESET_META.contact_whatsapp.label });
  out.push({ presetId: "general_help", label: PRESET_META.general_help.label });
  return out;
}
