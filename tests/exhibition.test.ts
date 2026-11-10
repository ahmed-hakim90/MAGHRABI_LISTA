import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RAMADAN_2027_DEFAULTS } from "@/lib/constants/exhibition";
import type { ExhibitionDetails } from "@/lib/types/exhibition";
import { whatsAppUrl } from "@/lib/utils/priceListWhatsApp";
import {
  buildExhibitionIcs,
  buildGoogleCalendarUrl,
  cairoLocalToUtcMs,
  describeExhibitionSchedule,
  resolveExhibitionInstant,
} from "@/lib/utils/exhibitionSchedule";
import {
  formatRegistrationNumber,
  isAllowedMapUrl,
  isValidRegistrationDocId,
  normalizeEgyptianMobile,
  parseExhibitionPatch,
  parseMessageLogBody,
  parseNewExhibitionBody,
  parseRegistrationBody,
  registrationDocId,
  validateAnnouncedSchedule,
} from "@/lib/utils/exhibitionValidation";
import {
  DEFAULT_EXHIBITION_TEMPLATES,
  renderExhibitionMessage,
} from "@/lib/utils/exhibitionWhatsApp";

const validBody = {
  exhibitionId: "ramadan-2027",
  name: "  أحمد   محمود ",
  phone: "01012345678",
  attendeeCount: 3,
  whatsappConsent: true,
  website: "",
};

const announced: ExhibitionDetails = {
  title: "معرض رمضان 2027",
  shortTitle: "معرض رمضان",
  description: "تشكيلات جديدة, وعروض مميزة",
  scheduleStatus: "announced",
  date: "2027-02-10",
  startTime: "10:00",
  endTime: "18:00",
  venueName: "معرض المغربي – المنطقة الصناعية A5 – العاشر من رمضان",
  mapUrl: "https://maps.app.goo.gl/abc123",
};

describe("customer mobile", () => {
  it("normalizes local, international, and Arabic-digit input", () => {
    assert.equal(normalizeEgyptianMobile("01012345678"), "201012345678");
    assert.equal(normalizeEgyptianMobile("+20 101 234 5678"), "201012345678");
    assert.equal(normalizeEgyptianMobile("٠١٠١٢٣٤٥٦٧٨"), "201012345678");
    assert.equal(normalizeEgyptianMobile("2001012345678"), "201012345678");
  });

  it("rejects landlines, short numbers, and other prefixes", () => {
    assert.equal(normalizeEgyptianMobile("0223456789"), null);
    assert.equal(normalizeEgyptianMobile("0101234"), null);
    assert.equal(normalizeEgyptianMobile("01312345678"), null);
  });
});

describe("public registration body", () => {
  it("accepts a valid registration and cleans the name", () => {
    const parsed = parseRegistrationBody(validBody);
    assert.ok(parsed.ok);
    assert.deepEqual(parsed.value, {
      exhibitionId: "ramadan-2027",
      name: "أحمد محمود",
      phone: "201012345678",
      attendeeCount: 3,
    });
  });

  it("rejects unexpected fields so clients cannot set status or numbers", () => {
    const parsed = parseRegistrationBody({ ...validBody, registrationNumber: "X-1" });
    assert.ok(!parsed.ok);
    assert.equal(parsed.field, "form");
  });

  it("rejects a filled honeypot", () => {
    assert.ok(!parseRegistrationBody({ ...validBody, website: "spam.example" }).ok);
  });

  it("requires WhatsApp consent", () => {
    const parsed = parseRegistrationBody({ ...validBody, whatsappConsent: false });
    assert.ok(!parsed.ok);
    assert.equal(parsed.field, "whatsappConsent");
  });

  it("bounds attendee count to whole numbers 1..20", () => {
    for (const attendeeCount of [0, 21, 2.5, "3"]) {
      const parsed = parseRegistrationBody({ ...validBody, attendeeCount });
      assert.ok(!parsed.ok);
      assert.equal(parsed.field, "attendeeCount");
    }
  });

  it("rejects markup and nameless input", () => {
    assert.ok(!parseRegistrationBody({ ...validBody, name: "<script>x</script>" }).ok);
    assert.ok(!parseRegistrationBody({ ...validBody, name: "12" }).ok);
  });

  it("rejects malformed exhibition ids", () => {
    assert.ok(!parseRegistrationBody({ ...validBody, exhibitionId: "../admin" }).ok);
  });
});

describe("registration identity", () => {
  it("uses one document per mobile per exhibition", () => {
    const id = registrationDocId("ramadan-2027", "201012345678");
    assert.equal(id, "ramadan-2027_201012345678");
    assert.ok(isValidRegistrationDocId(id));
    assert.ok(!isValidRegistrationDocId("ramadan-2027_123"));
  });

  it("formats sequential registration numbers", () => {
    assert.equal(formatRegistrationNumber("RM27", 7), "RM27-0007");
    assert.equal(formatRegistrationNumber("RM27", 12345), "RM27-12345");
  });
});

describe("admin exhibition input", () => {
  it("allows only https Google Maps links", () => {
    assert.ok(isAllowedMapUrl("https://maps.app.goo.gl/abc123"));
    assert.ok(isAllowedMapUrl("https://www.google.com/maps/place/x"));
    assert.ok(!isAllowedMapUrl("http://maps.app.goo.gl/abc123"));
    assert.ok(!isAllowedMapUrl("javascript:alert(1)"));
    assert.ok(!isAllowedMapUrl("https://www.google.com/search?q=x"));
    assert.ok(!isAllowedMapUrl("https://maps.app.goo.gl.evil.com/x"));
  });

  it("rejects unknown patch fields and invalid dates", () => {
    assert.ok(!parseExhibitionPatch({ registrationSeq: 0 }).ok);
    assert.ok(!parseExhibitionPatch({ date: "2027-02-30" }).ok);
    assert.ok(!parseExhibitionPatch({ startTime: "25:00" }).ok);
    assert.ok(parseExhibitionPatch({ date: "", mapUrl: "" }).ok);
  });

  it("refuses to announce an incomplete or inverted schedule", () => {
    assert.ok(validateAnnouncedSchedule(announced).ok);
    assert.ok(!validateAnnouncedSchedule({ ...announced, date: "" }).ok);
    assert.ok(!validateAnnouncedSchedule({ ...announced, endTime: "09:00" }).ok);
    assert.ok(!validateAnnouncedSchedule({ ...announced, venueName: "" }).ok);
    assert.ok(
      validateAnnouncedSchedule({ ...announced, scheduleStatus: "pending", date: "" }).ok,
    );
  });

  it("validates new exhibitions for future seasons", () => {
    const parsed = parseNewExhibitionBody({
      id: "Ramadan-2028",
      codePrefix: "rm28",
      title: "معرض رمضان 2028",
      shortTitle: "معرض رمضان 2028",
    });
    assert.ok(parsed.ok);
    assert.equal(parsed.value.id, "ramadan-2028");
    assert.equal(parsed.value.codePrefix, "RM28");
    assert.ok(!parseNewExhibitionBody({ id: "x", codePrefix: "RM", title: "abc", shortTitle: "abc" }).ok);
  });

  it("accepts the Ramadan 2027 defaults, including venue and map link", () => {
    const parsed = parseNewExhibitionBody({ ...RAMADAN_2027_DEFAULTS });
    assert.ok(parsed.ok);
    assert.equal(parsed.value.mapUrl, "https://maps.app.goo.gl/hQd2Y9HeEysHPnww8");
    assert.ok(parsed.value.venueName.includes("قطعة 210"));
    assert.ok(!parseNewExhibitionBody({ ...RAMADAN_2027_DEFAULTS, mapUrl: "https://evil.example/maps" }).ok);
  });

  it("validates WhatsApp log entries", () => {
    const ok = parseMessageLogBody({
      registrationId: "ramadan-2027_201012345678",
      kind: "reminder",
      message: "تذكير",
    });
    assert.ok(ok.ok);
    assert.ok(
      !parseMessageLogBody({
        registrationId: "ramadan-2027_201012345678",
        kind: "broadcast",
        message: "x",
      }).ok,
    );
  });
});

describe("schedule and calendar", () => {
  it("converts Cairo time to UTC in winter and summer", () => {
    assert.equal(
      new Date(cairoLocalToUtcMs("2027-02-10", "10:00")).toISOString(),
      "2027-02-10T08:00:00.000Z",
    );
    assert.equal(
      new Date(cairoLocalToUtcMs("2027-07-10", "10:00")).toISOString(),
      "2027-07-10T07:00:00.000Z",
    );
  });

  it("exposes no instant before the schedule is announced", () => {
    assert.equal(resolveExhibitionInstant({ ...announced, scheduleStatus: "pending" }), null);
    assert.equal(describeExhibitionSchedule(null), "سيتم الإعلان عنه قريبًا");
  });

  it("builds a Google Calendar link with the real UTC window", () => {
    const instant = resolveExhibitionInstant(announced)!;
    const url = new URL(
      buildGoogleCalendarUrl({ id: "ramadan-2027", updatedAtMs: null, ...announced, ...instant }),
    );
    assert.equal(url.hostname, "calendar.google.com");
    assert.equal(url.searchParams.get("dates"), "20270210T080000Z/20270210T160000Z");
    assert.equal(url.searchParams.get("text"), announced.title);
  });

  it("builds an RFC 5545 invitation with folded, escaped lines", () => {
    const instant = resolveExhibitionInstant(announced)!;
    const ics = buildExhibitionIcs(
      { id: "ramadan-2027", updatedAtMs: 1_800_000_000_000, ...announced, ...instant },
      Date.UTC(2026, 10, 10),
    );
    assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
    assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
    assert.match(ics, /DTSTART:20270210T080000Z\r\n/);
    assert.match(ics, /DTEND:20270210T160000Z\r\n/);
    assert.match(ics, /SEQUENCE:1800000000\r\n/);
    const unfolded = ics.replace(/\r\n /g, "");
    assert.ok(unfolded.includes("جديدة\\, وعروض"));
    for (const line of ics.split("\r\n")) {
      assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${line}`);
    }
  });
});

describe("WhatsApp messages", () => {
  const vars = {
    name: "أحمد",
    registrationNumber: "RM27-0001",
    title: "معرض رمضان 2027",
    schedule: "سيتم الإعلان عنه قريبًا",
    venue: "العاشر من رمضان",
    mapUrl: "",
    calendarUrl: "",
  };

  it("fills placeholders and drops lines that have no value yet", () => {
    const text = renderExhibitionMessage(DEFAULT_EXHIBITION_TEMPLATES.invitation, vars);
    assert.ok(text.includes("أ/ أحمد"));
    assert.ok(text.includes("RM27-0001"));
    assert.ok(!text.includes("الخريطة"));
    assert.ok(!text.includes("التقويم"));
    assert.ok(!text.includes("{"));
  });

  it("opens the customer's chat with the prepared text", () => {
    const text = renderExhibitionMessage(DEFAULT_EXHIBITION_TEMPLATES.reminder, {
      ...vars,
      mapUrl: "https://maps.app.goo.gl/abc123",
    });
    const url = new URL(whatsAppUrl("201012345678", text));
    assert.equal(url.pathname, "/201012345678");
    assert.equal(url.searchParams.get("text"), text);
  });
});
