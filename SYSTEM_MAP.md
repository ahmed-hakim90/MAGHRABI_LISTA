# System Map — EL MAGHRABY Lista

Wholesale/retail catalog site for El Maghraby: PDF catalogs, interactive price
lists with WhatsApp ordering, videos, and the annual exhibition invitation.

Last updated: 2026-11-10

## Core / runtime

- Next.js 16 App Router on Vercel, RTL Arabic UI, PWA (service worker, install prompt)
- Firebase: Firestore (data), Auth (admins only), Storage (PDF/images), FCM (push)
- Public reads and all sensitive writes go through `app/api/**` with the Admin SDK

## Modules

| MOD | Name | Category |
| --- | --- | --- |
| 01 | Catalog channels (`/wholesale`, `/retail`, `/lists`) | Public storefront shell |
| 02 | PDF catalogs and folders | Content |
| 03 | Interactive price lists + WhatsApp order | Ordering |
| 04 | Videos / reels | Content |
| 05 | Announcement ticker | Marketing |
| 06 | Service centers (Sokany) | Support |
| 07 | Push notifications | Engagement |
| 08 | Catalog assistant (rule-based, flag-gated by `NEXT_PUBLIC_CATALOG_CHAT_ENABLED`) | Support |
| 09 | Exhibition invitations and registrations | Events / CRM |
| 10 | Admin console | Operations |

## Primary path

Visitor opens a channel → browses catalogs / price lists → selects items →
**sends the order on WhatsApp** to an El Maghraby contact.

Exhibition path: invitation dialog → register (name, mobile, attendees,
consent) → registration number → admin announces date → customer adds it to a
calendar → admin follows up on WhatsApp manually and marks attendance.

## Counts

- Roles: 2
- Modules: 10
- Integrations: 5

## Roles

| Role | Where |
| --- | --- |
| Visitor / customer (anonymous) | Public channels, invitation, registration |
| Admin (Firebase Auth + active `adminUsers` + `admin` claim) | `/admin/**`, `/api/admin/**` |

## Integrations

| System | Status |
| --- | --- |
| Firebase (Firestore, Auth, Storage, FCM) | live |
| Vercel hosting + CDN | live |
| WhatsApp `wa.me` links (orders, manual exhibition messages) | live, manual send |
| Google Calendar template link + ICS file | live once a schedule is announced |
| Google Maps links | live (admin-entered, allowlisted) |

## Key routes and entry points

- Channel shell: `app/(public)/[channel]/CatalogChannelRoot.tsx`
- Price lists: `app/(public)/[channel]/price-lists/[slug]`, `components/price-lists/`
- Exhibition (public): `components/public/ExhibitionInvite.tsx`,
  `app/api/exhibitions/{active,register,[id]/calendar}`
- Exhibition (admin): `app/admin/(dashboard)/exhibitions`, `app/api/admin/exhibitions/**`,
  domain logic `lib/server/exhibitions.ts`, `lib/utils/exhibition*.ts`
- Admin auth: `lib/server/verifyAdmin.ts`, `hooks/useAdminAuth.ts`
- Rules and indexes: `firestore.rules`, `firestore.indexes.json`
- Decision records: `docs/` (`EXHIBITION.md`, `ANNOUNCEMENT-BAR.md`, `WHOLESALE-CATALOG.md`)
