import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  AUDIENCE_TO_CHANNEL,
  type CatalogAudience,
  normalizeAudienceFromDoc,
} from "@/lib/constants/catalogChannels";
import {
  getAdminAuth,
  getAdminFirestore,
  getAdminMessaging,
} from "@/lib/firebase/admin";

type Body = {
  title: string;
  body: string;
  targetCardId: string | null;
  notifyAudience?: string;
};

type NotifyFilter = "all" | CatalogAudience;

function parseBroadcastAudience(raw: unknown): NotifyFilter {
  if (raw === "all") return "all";
  if (raw === "wholesale" || raw === "retail" || raw === "no_prices") {
    return raw;
  }
  return "all";
}

function tokenMatchesNotifyAudience(
  data: Record<string, unknown>,
  filter: NotifyFilter,
): boolean {
  if (filter === "all") return true;
  const raw = data.audience;
  if (raw == null || raw === "") return filter === "wholesale";
  return normalizeAudienceFromDoc(raw) === filter;
}

async function verifyAdmin(db: Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection("adminUsers").doc(uid).get();
  return snap.exists && snap.data()?.isActive === true;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "غير مصرّح." }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "رمز غير صالح." }, { status: 401 });
  }

  let db: Firestore;
  let messaging: ReturnType<typeof getAdminMessaging>;
  try {
    db = getAdminFirestore();
    messaging = getAdminMessaging();
  } catch {
    return NextResponse.json(
      { error: "إعدادات Firebase Admin غير مكتملة على الخادم." },
      { status: 503 },
    );
  }

  if (!(await verifyAdmin(db, uid))) {
    return NextResponse.json({ error: "غير مسموح." }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (!title || !text) {
    return NextResponse.json(
      { error: "العنوان والنص مطلوبان." },
      { status: 400 },
    );
  }

  const targetCardId =
    body.targetCardId == null || body.targetCardId === ""
      ? null
      : String(body.targetCardId);

  const origin = new URL(request.url).origin;

  let notifyFilter: NotifyFilter = "all";
  let relativeUrl = "/wholesale";
  let data: Record<string, string>;

  if (targetCardId != null) {
    const cardSnap = await db.collection("fileCards").doc(targetCardId).get();
    if (!cardSnap.exists) {
      return NextResponse.json({ error: "الملف غير موجود." }, { status: 400 });
    }
    const c = cardSnap.data() as Record<string, unknown>;
    const aud = normalizeAudienceFromDoc(c.audience);
    notifyFilter = aud;
    const ch = AUDIENCE_TO_CHANNEL[aud];
    relativeUrl = `/${ch}/file/${targetCardId}/pdf`;
    data = {
      type: "file_card",
      cardId: targetCardId,
      url: relativeUrl,
    };
  } else {
    notifyFilter = parseBroadcastAudience(body.notifyAudience);
    if (notifyFilter === "all") {
      relativeUrl = "/wholesale";
    } else {
      const ch = AUDIENCE_TO_CHANNEL[notifyFilter];
      relativeUrl = `/${ch}`;
    }
    data = {
      type: "announcement",
      url: relativeUrl,
    };
  }

  const webPushLink = `${origin}${relativeUrl}`;

  const notifRef = await db.collection("file_notifications").add({
    title,
    body: text,
    targetCardId,
    createdBy: uid,
    status: "draft",
    createdAt: FieldValue.serverTimestamp(),
  });

  const tokensSnap = await db
    .collection("fcmTokens")
    .where("isActive", "==", true)
    .get();

  const tokens = [
    ...new Set(
      tokensSnap.docs
        .filter((d) => tokenMatchesNotifyAudience(d.data(), notifyFilter))
        .map((d) => String(d.data().token ?? ""))
        .filter(Boolean),
    ),
  ];

  try {
    if (tokens.length === 0) {
      await notifRef.update({
        status: "sent",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const chunkSize = 500;
    let sent = 0;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body: text },
        data,
        webpush: {
          fcmOptions: {
            link: webPushLink,
          },
        },
      });
      sent += res.successCount;
    }

    await notifRef.update({
      status: "sent",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    await notifRef.update({
      status: "failed",
      updatedAt: FieldValue.serverTimestamp(),
    });
    const message = e instanceof Error ? e.message : "FCM error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
