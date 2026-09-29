# Announcement Bar — decision record (2026-09-29)

Dynamic admin-managed ticker bar above the wholesale header (spec §32).

## Data

- Stored in the existing settings collection: Firestore `file_settings/announcements`
  document, `{ items: AnnouncementItem[], updatedAt }` — chosen over a new top-level
  collection to reuse `file_settings` rules (public read, admin-only write) and the
  array-in-settings convention already used by `whatsappContacts`.
- `AnnouncementItem` (lib/types/models.ts): id, textAr, textEn, link, linkLabelAr,
  linkLabelEn, openInNewTab, isActive, sortOrder, startAt, endAt, createdAt,
  updatedAt. Dates are epoch-ms numbers, not Timestamps, so array entries stay
  plain-serializable.
- Writes are whole-list rewrites (`saveAnnouncements`) — reorder/enable/delete are
  local edits plus one save; no per-doc CRUD needed at this scale.

## Display

- Scope is explicit: `ANNOUNCEMENT_BAR_CHANNELS` in
  `app/(public)/[channel]/CatalogChannelRoot.tsx` — currently `wholesale` only.
  Retail's header is `fixed top-0` and would be covered by the bar; enabling retail
  requires its own layout pass (documented in code).
- SSR reads via `getCachedPublicAnnouncements` (same 300s `unstable_cache` pattern as
  site settings; up to 5-minute staleness after admin saves is accepted).
- Schedule filtering (isActive + startAt/endAt) runs client-side every 30s in
  `AnnouncementBar`, so future/expired windows open and close without revalidation.
- No active announcements → component returns null; the header sits flush at top.

## Motion

- Pure CSS marquee (no `<marquee>`, no JS animation): the sequence is rendered twice
  and the track animates `translateX(0 → 50%)`, so the loop point is invisible.
  Positive translateX mirrors the English ticker for RTL reading direction.
- Speed is constant ~55px/s: duration is computed from measured sequence width in an
  effect and set via `--announcement-ticker-duration`.
- Pauses on hover/focus-within; `prefers-reduced-motion` disables animation and shows
  a horizontally scrollable static line (duplicate copy hidden).
- Safe-area: the bar carries `padding-top: env(safe-area-inset-top)` and
  `body:has(.announcement-bar) .wholesale-header { padding-top: 0 }` prevents double
  inset in installed PWA mode.

## Security

- Text is rendered as plain React children only (never `dangerouslySetInnerHTML`).
- Links are validated on parse and render: internal `/…` paths and absolute
  http(s) only; protocol-relative (`//`) and other schemes are dropped.
  New-tab links get `rel="noopener noreferrer"`.
