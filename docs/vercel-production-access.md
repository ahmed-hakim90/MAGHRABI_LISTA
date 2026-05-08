# Vercel production access (403 / blocked / wrong site)

This app has **no `middleware.ts`**. Public routes (`/`, `/file/[cardId]`, `/manifest.webmanifest`, `/sw.js`, `/icons/*`) are not server-guarded. A **403 on the HTML homepage** almost always comes from **Vercel Deployment Protection** (or a wrong domain alias), not from this repo’s Next.js code.

Admin-only **403** responses exist only on:

- `POST /api/admin/register` — invalid `ADMIN_SETUP_TOKEN`
- `POST /api/notifications/send` — missing/invalid Bearer token or non-admin user

### Dashboard deployment preview shows 403 but “Visit” / the live URL works

The small preview iframe on the deployment page can return **403 Forbidden** while opening the same deployment in a new tab returns **200**. That usually means **Deployment Protection** (e.g. **Vercel Authentication**) is on: your browser session can access the site, but Vercel’s preview fetch does not carry the same auth. It is **not** a Next.js bug in this repo. To show a thumbnail in the dashboard, use **Standard Protection** (*preview deployments only*) or turn protection off for **Production** if the site must be fully public; otherwise ignore the preview and verify with **Visit**.

## 1. Confirm the cause (replace with your real URL)

From the repo root:

```bash
./scripts/vercel-check-deployment.sh "https://YOUR-PRODUCTION.vercel.app"
# or:
npm run vercel:check -- "https://YOUR-PRODUCTION.vercel.app"
```

Or manually:

```bash
curl -sI "https://YOUR-PRODUCTION.vercel.app/"
curl -sI "https://YOUR-PRODUCTION.vercel.app/manifest.webmanifest"
curl -sI "https://YOUR-PRODUCTION.vercel.app/sw.js"
```

### How to read the response

| HTTP | `x-vercel-error` or body | Meaning |
|------|---------------------------|---------|
| 401/403 | `DEPLOYMENT_BLOCKED` or HTML login / `Set-Cookie: _vercel_sso_nonce` | **Deployment Protection** or Vercel Authentication on that deployment |
| 404 | `NOT_FOUND` | Hostname exists but **no deployment** at that path (wrong project / typo) |
| 404 | `DEPLOYMENT_NOT_FOUND` | That `*.vercel.app` URL does not match a live deployment |
| 200 | (no `x-vercel-error` for app HTML) | App is reachable; if the library is empty, check **Firebase env vars** and Firestore rules |

**Note:** Probing `https://maghrabi.vercel.app` without linking that domain to this project often returns `NOT_FOUND` or `DEPLOYMENT_NOT_FOUND` — that is an alias/config issue, not this app’s middleware.

### When every path returns `DEPLOYMENT_NOT_FOUND`

If `curl -sI https://YOUR-URL/` **and** `/manifest.webmanifest`, `/sw.js`, and `/icons/icon-192.png` all return **404** with `x-vercel-error: DEPLOYMENT_NOT_FOUND`, Vercel is not serving **any** deployment for that hostname. Typical causes:

1. **No project / no successful Production deploy** for that Git repo (import the repo or fix a failing Production build).
2. **Wrong `*.vercel.app` URL** — the default is `https://<vercel-project-name>.vercel.app`. If the project is named `maghrabi-lista`, the default URL is `maghrabi-lista.vercel.app`, not `maghrabi.vercel.app`.
3. **Hostname belongs to another team or was removed** — the slug may be unassigned until you create or link a project again.

**Fix (dashboard):**

1. Open [Vercel](https://vercel.com) → **Add New…** → **Project** → import **this** repository (or open the project already connected to it).
2. Under **Deployments**, confirm **Production** shows a **Ready** deployment. If builds fail, open **Build Logs** and fix the reported error (then redeploy).
3. Under **Settings** → **Git**, set **Production Branch** to the branch you ship (e.g. `main`).
4. Under **Settings** → **Domains**, use the **assigned** `*.vercel.app` domain shown for the project, or add **`maghrabi.vercel.app`** only if your team controls that name (rename the project to `maghrabi` to get that default slug when creating the project, or add it as a domain on Production).

**Local sanity check (optional):** `npm run build` must succeed; a green local build rules out “missing `/` route” in this app — the remaining issue is always Vercel project/domain linkage.

**CLI (optional):** After `npm i -g vercel` and `vercel login`, from the repo root run `vercel link` then `vercel deploy --prod` to attach a Production deployment to the linked project.

## 2. Fix Deployment Protection (Vercel dashboard)

For a **public** storefront:

1. Open the project in Vercel → **Settings** → **Deployment Protection**
2. **Vercel Authentication**: use **Standard Protection** (*Only Preview Deployments*) or **Disabled** if previews should also be public.
3. **Password Protection**: **Off** for Production (or off entirely).
4. **Trusted IPs**: **Off** unless you intentionally restrict by IP.
5. **Settings** → **Git**: confirm **Production Branch** is `main` (or your real default branch).
6. **Settings** → **Domains**: attach your production domain to **this** project’s **Production** environment.

CLI alternative (after `npm i -g vercel` and `vercel link`): use the dashboard for protection toggles; the CLI does not replace the protection UI for all options.

## 3. Production environment variables (Vercel)

In **Settings** → **Environment Variables**, scope **Production**, set every variable from [`.env.example`](../.env.example):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client Firebase |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push |
| `NEXT_PUBLIC_FIREBASE_STORAGE_FOLDER` | Must match Storage rules prefix (`magrabi-lista` in `storage.rules`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server: `/api/admin/register`, `/api/notifications/send` |
| `ADMIN_SETUP_TOKEN` | Min 24 chars; `/api/admin/register` only |

Missing client vars do **not** cause HTTP 403 from Vercel; they cause runtime Firebase errors in the browser. Missing `FIREBASE_SERVICE_ACCOUNT_JSON` yields **503** on those APIs, not 403 on `/`.

**Security:** rotate `ADMIN_SETUP_TOKEN` and the Firebase service account key if they were ever exposed; store secrets only in Vercel (not in git).

## 4. Smoke test after protection/domain fix

```bash
./scripts/vercel-check-deployment.sh "https://YOUR-PRODUCTION.vercel.app"
```

Expect **200** for `/`, `/manifest.webmanifest`, `/sw.js`. `/file/<real-card-id>` should be 200 when the ID exists (or a valid Next.js response for missing data).

Local smoke (validates the built app, not Vercel protection):

```bash
npm run build
npm run start
# in another terminal:
curl -sI http://127.0.0.1:3000/ | head -5
curl -sI http://127.0.0.1:3000/manifest.webmanifest | head -5
curl -sI http://127.0.0.1:3000/sw.js | head -5
```

Admin UI remains protected by Firebase Auth + Firestore rules + `useAdminAuth`; no code change required for public read access.
