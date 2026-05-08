import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Headers the browser PDF viewer needs for Range / partial content. */
const FORWARD_FROM_UPSTREAM = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
] as const;

function applyUpstreamPdfHeaders(upstream: Response, target: Headers): void {
  for (const name of FORWARD_FROM_UPSTREAM) {
    const v = upstream.headers.get(name);
    if (v) target.set(name, v);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params;
  const forceDownload = new URL(req.url).searchParams.has("download");
  const db = getAdminFirestore();
  const snap = await db.collection("fileCards").doc(cardId).get();
  if (!snap.exists) {
    return new Response("Not found", { status: 404 });
  }
  const data = snap.data() as
    | {
        fileUrl?: string;
        title?: string;
        isActive?: boolean;
      }
    | undefined;
  if (!data || !data.isActive || !data.fileUrl) {
    return new Response("Not found", { status: 404 });
  }

  const fetchHeaders = new Headers();
  if (!forceDownload) {
    const range = req.headers.get("Range");
    if (range) fetchHeaders.set("Range", range);
    const ifRange = req.headers.get("If-Range");
    if (ifRange) fetchHeaders.set("If-Range", ifRange);
  }

  let upstream: Response;
  try {
    upstream = await fetch(data.fileUrl, { headers: fetchHeaders });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }

  if (!upstream.ok) {
    if (upstream.status === 304) {
      const h = new Headers();
      applyUpstreamPdfHeaders(upstream, h);
      h.set("X-Content-Type-Options", "nosniff");
      return new Response(null, { status: 304, headers: h });
    }
    if (upstream.status === 416 && upstream.body) {
      const h = new Headers();
      applyUpstreamPdfHeaders(upstream, h);
      h.set("X-Content-Type-Options", "nosniff");
      return new Response(upstream.body, { status: 416, headers: h });
    }
    return new Response("Upstream error", { status: 502 });
  }

  if (!upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const out = new Headers();
  applyUpstreamPdfHeaders(upstream, out);
  if (!out.has("content-type")) {
    out.set("Content-Type", "application/pdf");
  }

  const safeTitle =
    (data.title || cardId).replace(/[\r\n"\\]/g, "").trim() || cardId;
  const filename = encodeURIComponent(`${safeTitle}.pdf`);
  const disposition = forceDownload ? "attachment" : "inline";
  out.set(
    "Content-Disposition",
    `${disposition}; filename*=UTF-8''${filename}`,
  );
  out.set(
    "Cache-Control",
    "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400",
  );
  out.set("X-Content-Type-Options", "nosniff");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: out,
  });
}
