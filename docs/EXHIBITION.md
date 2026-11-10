# Exhibition invitations — decision record (2026-11-10)

Annual El Maghraby exhibition invitation (first season: Ramadan 2027) on the
existing catalog site, with customer registration and a protected admin screen.
The price-list catalog is unchanged.

## Business problem

Invite wholesale customers to the yearly exhibition, collect who is coming and
how many, announce the real date later, and follow up personally on WhatsApp —
without risking the price-list site or exposing customer data.

## Decisions

- **Store:** the existing Firebase project (Firestore), not a new Supabase
  project. One store, one admin login, no new keys. Three collections:
  - `exhibitions/{slug}` — content, Cairo-local `date/startTime/endTime`,
    `scheduleStatus: pending | announced`, `isActive`, `codePrefix`,
    `registrationSeq` counter.
  - `exhibition_registrations/{exhibitionId}_{phone}` — name, wa.me phone,
    attendee count, consent, `registrationNumber`, `attendanceStatus`,
    contact counters.
  - `exhibition_message_logs/{auto}` — one row per WhatsApp chat an admin opened.
- **Access:** `firestore.rules` denies all browser reads/writes on the three
  collections. Every read/write goes through `app/api/**` with the Admin SDK;
  admin routes use `requireActiveAdmin` (Bearer ID token + active `adminUsers`).
- **Duplicates:** the registration document id is the guard. A transaction reads
  the exhibition and the registration; a repeat or concurrent submit returns the
  existing number and never creates a second row or burns a sequence number.
- **Registration numbers:** server-assigned `PREFIX-0001` inside the same
  transaction. Never client-generated.
- **Consent:** WhatsApp consent is required to register, so every registrant can
  be contacted.
- **Schedule privacy:** draft dates stay server-side until `announced`. The public
  DTO (`toPublicExhibition`) returns `schedule: null` and `calendar: null` before
  that; the ICS route returns 404.
- **Calendar:** Google Calendar template link plus one public `.ics` route
  (`/api/exhibitions/{id}/calendar`, `?download=1` for a download). Times are
  converted Cairo → UTC with Egypt DST, and the ICS `SEQUENCE` follows
  `updatedAt` so a rescheduled event updates. The file contains no customer data.
- **WhatsApp:** manual only. Admin selects registrants, edits a template, and
  opens `wa.me` per customer; the app logs "chat opened" (WhatsApp cannot confirm
  delivery). No bulk or automated sending.
- **One active exhibition:** activating one deactivates the others in the same
  transaction. Future seasons are new documents with a new prefix (e.g. `RM28`).
- **Invitation display:** auto-opens once per browser session after the splash,
  closable (button, backdrop, Escape). A bottom-center button reopens it on every
  catalog page, sits above the price-list order bar, and steps aside near the end
  of a scrolled page so final rows stay reachable. Hidden on the reels feed.
- **Invitation card art:** the invite view shows season artwork from
  `EXHIBITION_INVITE_ARTWORK` (keyed by exhibition id) with the title kept as
  a screen-reader heading. Seasons without artwork fall back to the text
  header, so Ramadan 2028 never shows 2027 art. The greeting and body come from
  the admin's invitation text.
- **Caching:** public invitation JSON and ICS use `Cache-Control: no-cache` for
  browsers and `Vercel-CDN-Cache-Control: max-age=30, stale-while-revalidate=30`,
  so a published schedule reaches visitors within about a minute. Admin routes
  are `no-store`.

## Rejected alternatives

- **Supabase:** a second database, credentials, and admin identity for one
  module, with no benefit over the Firestore project the site already uses.
- **Client Firestore writes with rules validation:** would open a public write
  path like `catalog_reels`; server routes allow strict field allowlists,
  transactions, and rate limiting.
- **Showing the invitation on every navigation:** blocks repeat price-list use;
  once per session plus a persistent reopen button meets "every visit".
- **Calendar event at registration time:** would create a fake event before the
  date exists.

## Consequences and operations

- Indexes were deployed on 2026-11-10 with
  `firebase deploy --only firestore:indexes --non-interactive` (other products'
  indexes are kept; deletion would need `--force`). Without them the admin API
  returns a clear 503 message; public registration does not need them.
- **Do not deploy `firestore.rules` from this repo.** The live ruleset is
  maintained by another product on the same Firebase project and is far newer
  than this repo's copy; deploying it (including `npm run firebase:deploy:rules`)
  would delete that product's rules. The exhibition collections are already
  denied in the live rules, because nothing there matches them. The explicit
  deny blocks in this repo's file document intent and should be merged into the
  live ruleset by whoever owns it.
- Rate limiting is in-memory per Vercel instance (10 registrations / 10 min / IP):
  it slows abuse but is not a global guarantee.
- Admin search is exact (mobile or registration number) to stay index-backed.
- Logic tests: `npm test` (`tests/exhibition.test.ts`, Node test runner).
