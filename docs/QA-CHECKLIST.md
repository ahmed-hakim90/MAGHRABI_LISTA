# Product QA Checklist — or

## Functional/regression

- [ ] Primary journey works with realistic data and permission levels.
- [ ] Business rules, APIs, integrations, and side effects are preserved.
- [ ] Loading, empty, error, partial, stale, disabled, read-only, validation, success, and permission states are covered.
- [ ] Tests pass and all consumers of shared changes are checked.

## Visual/responsive/RTL

- [ ] Rendered QA completed at 320–375, 390–430, tablet, laptop, and large desktop.
- [ ] No overflow, clipping, layout jump, awkward density, or duplicate actions.
- [ ] RTL/LTR structure, icons, and directional controls are correct.
- [ ] Tokens, spacing, type, radii, color, elevation, and iconography are coherent.
- [ ] No generic AI slop, decorative clutter, or blind reference cloning.

## Accessibility/performance/completion

- [ ] Semantics, headings, labels, names, keyboard flow, focus, contrast, touch targets, and reduced motion pass.
- [ ] Dependency, bundle, render, query, caching, asset, and interaction costs are justified.
- [ ] Root cause and durable decisions are documented.
- [ ] A real rendered flow was inspected; compile/lint alone is not completion.
- [ ] Regression review follows: Foundation → Shared primitives → Shared patterns → Representative screens → Remaining screens → Responsive/RTL QA → Regression review.

## Wholesale catalog home (`/wholesale`) — scoped rows

- [ ] Page order is exactly: announcement bar (when active) → header (centered logo only, no nav links) → compact intro → controls → "القوائم المتاحة" → PDF cards → load-more → footer. No folders section, no ad rail/banner, no category chips.
- [ ] States are separated: loading skeletons → backend error ("تعذر تحميل القوائم حالياً" + "إعادة المحاولة" → refetch) → zero lists → search-no-results ("مسح البحث" clears only search) → content. A backend failure must never render as search-empty.
- [ ] Search placeholder is exactly `ابحث باسم القائمة…`; clearing search refocuses the input.
- [ ] Typography: Cairo (variable, arabic + latin) scoped to `.channel-wholesale` via `--font-cairo`. No Poppins/Bahij in wholesale UI. Weight mapping: 400 body/metadata, 500 controls, 600 card titles, 700 major headings. Cairo loads without visible font swap.
- [ ] Dates: every visible catalog date is strict `DD/MM/YYYY` (2-digit day, 2-digit month, 4-digit year). No month names, no locale text, no commas. Grid and list views use identical formatting.
- [ ] Card meta line: `[category] • [DD/MM/YYYY]` when both exist, or just `DD/MM/YYYY` when category is absent. Separator is `•` (bullet). No dangling separators. No fileSize shown.
- [ ] Cards: real thumbnail else ivory branded fallback cover (single PDF chip, no double "PDF"); grid portrait ratio with `object-contain`; long Arabic titles clamp without breaking layout; list rows show [thumb][title + meta][PDF][عرض][kebab].
- [ ] Pagination ("تحميل المزيد") keeps filter state; kebab menu (تحميل / فتح في تاب جديد / عرض القائمة) is never clipped.
- [ ] PDF opening unchanged: narrow/touch → raw PDF route in a new tab; wide → viewer route; download adds the download param.
- [ ] Offline/stale banner shows only when a snapshot exists; folder routes (`/wholesale/folder/[id]`) still render from the same snapshot (`maghrabi-catalog-v3-wholesale`).
- [ ] Density at 1440×900: announcement + header + intro + controls + section header + first PDF row visible in the first viewport, composed — not cramped.
- [ ] Visual QA at 1440×900, 834×1112, 375×812 with real data: Cairo renders correctly for Arabic and Latin; all dates DD/MM/YYYY; zero textual month names; mobile dates do not wrap; logo/header proportions, intro height, search hierarchy, cover size, density, RTL, no horizontal overflow, FAB clearance at rest and max scroll, footer logo readable on burgundy.
- [ ] Shared components (`CatalogViewToggle`, global header/footer) show no visual deltas on retail/list pages.
- [ ] Production build passes; reduced motion respected; all new CSS is scoped under `.channel-wholesale` (except the wholesale-only footer pattern class).
