# Wholesale Catalog — decision record (2026-10-01)

Final IA/presentation of `/wholesale` as a **PDF list library** (not a product
catalog). The page order is final and closed: announcement bar → header →
compact intro → catalog controls → "القوائم المتاحة" → PDF cards → load-more →
compact branded footer. No promotional sections.

## Decisions

### Header nav links removed
All navigation links (price lists, reels, etc.) were removed from the wholesale
header. The header is now a centered logo anchor only. Rationale: the closed
page order does not include secondary navigation; the wholesale channel is a
single-purpose PDF library.

### Category-filter chips removed
Category filter chips were removed entirely from the wholesale home. Rationale:
the closed page order does not include them, and the flat PDF list is searched
by name only. The `category` field remains on each card in Firestore and is
still rendered as metadata on the card (when present), but it is no longer a
filter dimension.

- The `categories` useMemo, `category` state, and `setCategory` wiring were
  removed from `WholesaleCatalogHomeClient`.
- `WholesaleCatalogToolbar` no longer accepts category props.
- The "لا توجد قوائم في هذا التصنيف" empty-state branch was removed.

### Ad rail and mobile ad banner unwired from the wholesale home
`WholesaleAdRail` / `WholesaleAdBanner` are no longer rendered on `/wholesale`
(no promotional sections in the final order). `components/wholesale/WholesaleAdRail.tsx`
stays on disk unreferenced so re-adding is a two-line change. Admin settings
(`adTitle` / `adSlogan`, SiteSettings) and the data model are untouched.

### Cairo font scoped to wholesale channel
Cairo (Google Fonts, variable weight, arabic + latin subsets) is loaded via
`--font-cairo` in `app/layout.tsx` and applied only inside `.channel-wholesale`.
Poppins (`--font-latin`) was removed — Cairo covers both Arabic and Latin in
one family. Global `--font-sans` and `--font-brand-arabic` are untouched so
retail/lists/admin are unaffected.

Weight mapping (per brand spec): 400 body/metadata, 500 controls (search input,
toggle buttons), 600 card titles/navigation, 700 major headings.

### Numeric DD/MM/YYYY dates
All catalog dates render as strict `DD/MM/YYYY` (2-digit day, 2-digit month,
4-digit year) via `formatNumericDate` in `lib/utils/dates.ts`. No month names,
no locale text, no commas. The helper accepts Firestore Timestamp, Date, ISO
string, or epoch millis and returns `""` for missing/unparseable values so
callers can drop it via `filter(Boolean)`. `formatDisplayDate` is untouched
(shared by admin/public components).

### Card metadata format
Meta line is `[category] • [DD/MM/YYYY]` when both values exist, or just
`DD/MM/YYYY` when category is absent. Separator is `•` (bullet), not `·`
(middle dot). `fileSize` is not shown on the meta line.

### Catalog view: PDF document cards and document-library rows
- Grid card: portrait `aspect-[3/4]` cover — real thumbnail (`object-contain`,
  no cropping) or ONE consistent branded fallback cover: warm ivory, official
  emblem (`/brand/elmaghraby-emblem.png`), faint burgundy arch watermark, small
  burgundy `PDF` chip, gold rule + `EL MAGHRABY` / `قائمة الجملة` label. No
  fake appliance imagery. The `PDF` badge renders visibly only when a
  thumbnail exists (no double PDF chip next to the fallback cover).
- List row (document-library): `min-h-[68px]`, thumbnail, title + meta
  (category • DD/MM/YYYY), then an explicit end cluster: visible `PDF` chip +
  `عرض` affordance + kebab menu (تحميل / فتح في تاب جديد / عرض القائمة). The
  container does not use `overflow-hidden` so the kebab dropdown is never
  clipped; rows are rounded individually.

### Separated states with correct reset semantics
Order: skeleton (loading, no data) → backend error (`تعذر تحميل القوائم حالياً`
+ إعادة المحاولة → `refetch()`) → zero lists → search empty (مسح البحث clears
**only** the query and refocuses the input) → content. A Firebase failure is
never presented as a search/empty result. The "القوائم المتاحة" heading always
renders with a plural-aware count (`قائمة واحدة`, `قائمتان`, `N قوائم`).

### Wholesale-only scoping
Brand treatment is scoped under `.channel-wholesale` (font-family, FAB
size/offset, footer pattern). The footer uses the official white logo directly
on burgundy. Retail/lists channels are unaffected: shared components
(`CatalogViewToggle`, global header/footer of other channels) were not modified.

## Search copy

Placeholder is exactly `ابحث باسم القائمة…` — the page lists PDFs, not products.

## QA notes

- Error state is reachable when the client fetch hard-fails (e.g. backend
  rejection) with no local snapshot. A pure network cut with an empty cache
  degrades to the empty state through the shared `getDocsWithCacheFallback`
  helper (cache reads resolve empty, by design); with a populated cache the
  offline banner (`يُعرض آخر كتالوج تم تحميله`) shows instead.
- Verified at 1440×900, 834×1112, 375×812 — see `docs/QA-CHECKLIST.md`.
- Cairo renders without visible font swap; no Poppins/Bahij typography remains
  in the wholesale UI. All visible dates are DD/MM/YYYY; zero textual month
  names on the page. Grid and list views use identical date formatting.
