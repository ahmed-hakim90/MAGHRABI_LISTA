import type { VideoProvider } from "@/lib/types/reels";

export type ParsedVideoLink = {
  provider: VideoProvider;
  embedUrl: string;
  sourceUrl: string;
};

export type ParseVideoResult =
  | { ok: true; data: ParsedVideoLink }
  | { ok: false; error: string };

function normalizeUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

function parseYouTube(url: URL, original: string): ParseVideoResult | null {
  const host = url.hostname.replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname.startsWith("/embed/")) {
      id = url.pathname.split("/")[2] ?? null;
    } else if (url.pathname.startsWith("/shorts/")) {
      id = url.pathname.split("/")[2] ?? null;
    } else {
      id = url.searchParams.get("v");
    }
  }

  if (!id) return null;
  return {
    ok: true,
    data: {
      provider: "youtube",
      sourceUrl: original.trim(),
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
    },
  };
}

function parseDrive(url: URL, original: string): ParseVideoResult | null {
  const host = url.hostname.replace(/^www\./, "");
  if (!host.includes("drive.google.com") && !host.includes("docs.google.com")) {
    return null;
  }

  let fileId: string | null = null;
  const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  if (pathMatch) fileId = pathMatch[1];
  if (!fileId) fileId = url.searchParams.get("id");
  if (!fileId) return null;

  return {
    ok: true,
    data: {
      provider: "drive",
      sourceUrl: original.trim(),
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    },
  };
}

function parseFacebook(url: URL, original: string): ParseVideoResult | null {
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  if (
    !host.includes("facebook.com") &&
    !host.includes("fb.watch") &&
    !host.includes("fb.com")
  ) {
    return null;
  }

  const href = original.trim();
  const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false&width=500`;

  return {
    ok: true,
    data: {
      provider: "facebook",
      sourceUrl: href,
      embedUrl,
    },
  };
}

/** يحوّل رابط يوتيوب / فيسبوك / درايف إلى رابط embed للعرض. */
export function parseVideoLink(raw: string): ParseVideoResult {
  const original = raw.trim();
  if (!original) {
    return { ok: false, error: "الرابط مطلوب" };
  }

  const url = normalizeUrl(original);
  if (!url) {
    return { ok: false, error: "رابط غير صالح" };
  }

  const parsers = [parseYouTube, parseDrive, parseFacebook];
  for (const parser of parsers) {
    const result = parser(url, original);
    if (result?.ok) return result;
  }

  return {
    ok: false,
    error:
      "لم نتعرف على الرابط. استخدم يوتيوب، فيسبوك (ريل/فيديو)، أو Google Drive.",
  };
}

/** رابط embed للشريحة النشطة — withSound يفعّل الصوت بعد تفاعل المستخدم */
export function embedUrlForPlayback(
  embedUrl: string,
  provider: VideoProvider,
  active: boolean,
  withSound = false,
): string {
  if (!active || !embedUrl) return embedUrl;
  try {
    const u = new URL(embedUrl);
    if (provider === "youtube") {
      u.searchParams.set("autoplay", "1");
      u.searchParams.set("mute", withSound ? "0" : "1");
      u.searchParams.set("playsinline", "1");
      u.searchParams.set("rel", "0");
      u.searchParams.set("enablejsapi", "1");
    }
    if (provider === "facebook") {
      u.searchParams.set("autoplay", withSound ? "true" : "false");
    }
    return u.toString();
  } catch {
    return embedUrl;
  }
}

export const PROVIDER_LABELS_AR: Record<VideoProvider, string> = {
  youtube: "يوتيوب",
  facebook: "فيسبوك",
  drive: "Google Drive",
  unknown: "غير معروف",
};
