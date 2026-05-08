import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let upstream: Response;
  try {
    upstream = await fetch(data.fileUrl);
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const safeTitle =
    (data.title || cardId).replace(/[\r\n"\\]/g, "").trim() || cardId;
  const filename = encodeURIComponent(`${safeTitle}.pdf`);

  const disposition = forceDownload ? "attachment" : "inline";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename*=UTF-8''${filename}`,
      "Cache-Control":
        "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
