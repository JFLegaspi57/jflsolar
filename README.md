# JFL Solar website

Proposal-ready website and staff admin for **JFL Solar** — solar PV installation,
consultancy and equipment distribution in the Philippines.

- **Stack:** Next.js 16.4 (App Router, Cache Components), React 19, strict
  TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth + Storage), Resend.
- **Hosting target:** Vercel + Supabase. Prototype runs on free tiers; JFL Solar clones it to their own accounts on acquisition (DECISIONS.md D12). See [docs/SETUP.md](docs/SETUP.md).
- **Staff guide:** [docs/OWNER-GUIDE.md](docs/OWNER-GUIDE.md).
- **Decisions / tasks / reviews:** [DECISIONS.md](DECISIONS.md), [TASKS.md](TASKS.md), [REVIEW.md](REVIEW.md).

Status: **ready to deploy after configuration** — not deployed, and the live
Supabase / Google / Resend integrations have not been exercised yet.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no Supabase/Resend variables the site runs in **demo mode**: bundled sample
content (labelled), a demo inquiry form that sends nothing, and an admin that
explains it is not connected.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run check` | ESLint + typecheck + unit tests + database policy tests (PGlite) |
| `npm run db:seed:generate` | Regenerate `supabase/seed.sql` from `lib/demo/content.ts` |
| `npm run admin:grant -- email owner` | Bootstrap/recover a staff member (needs secret key) |
| `npm run launch:check` | Production readiness gate (config + live database content) |
| `npm run qa:browser -- axe /` | axe-core WCAG 2.2 AA scan (needs a running server and local Chrome/Edge) |
| `node scripts/qa/journeys.mjs` | End-to-end customer journeys (demo mode only) |

## Architecture

```
app/(site)/…           Public pages (cached content snapshot, PPR)
app/admin/…            Staff dashboard (Google sign-in + staff allowlist)
app/admin/actions/…    Server Actions — every one calls requireStaffAction()
app/media/[...path]    Public media (anon key → Storage RLS: published only)
app/admin/media/…      Staff media (session; drafts; no-store)
app/auth/callback      OAuth PKCE callback
proxy.ts               Session refresh for /admin and /auth only
lib/content/public.ts  "use cache" snapshot of public content + demo fallback
lib/inquiry/…          Validation, tokens, rate limiting, Resend delivery
supabase/migrations/   Schema, constraints, RLS, storage policies
supabase/seed.sql      Demonstration data (generated)
tests/                 Unit tests + RLS/storage policy tests on real migrations
```

Security model in brief: Google sign-in → `staff_members` allowlist (owners and
editors) enforced in Server Actions, Postgres RLS and Storage RLS. Drafts and
their media are private. A production database (`content_mode = 'production'`)
hides sample and unconfirmed content even from direct API calls.

## Launch checklist

Content (owner)
- [ ] `info@jflsolar.com` (placeholder) mailbox created and receiving mail — or replace it in Settings and `INQUIRY_TO_EMAIL`
- [ ] Facebook page https://www.facebook.com/jflsolar visible to logged-out visitors; Messenger link added if wanted
- [ ] Company facts confirmed: registered name, founding date (June 2024), founder profile and credentials
- [ ] "Tier-1", replacement/loaner-unit, free technical support and after-sales wording approved or removed
- [ ] Warranty terms: general text and per-package/product terms confirmed
- [ ] Package prices and promotions approved (the ₱205,000 October 2026 Trio bundle is reference only)
- [ ] Product models, specifications, datasheets and availability confirmed; brand/distributor wording checked
- [ ] Real project photos (with permission) and details replace the sample projects
- [ ] All **Sample** items replaced or archived; all blocks **confirmed** (Admin → Overview shows none left)
- [ ] Privacy notice and terms reviewed by a legal adviser; business hours added if wanted

Technical (developer, with owner authorisation)
- [ ] Two Supabase projects (preview, production); migrations applied; production `content_mode = 'production'`
- [ ] Google OAuth client; Supabase Google provider on, Email provider off; redirect URLs per environment
- [ ] First owner granted; owner can sign in; a non-staff Google account is refused
- [ ] Admin create/edit/publish/unpublish/archive/delete and photo upload verified on preview
- [ ] Resend domain verified; one real test inquiry delivered and replied to
- [ ] Vercel project (Pro recommended for commercial use) with separate Preview/Production variables
- [ ] `jflsolar.com` + `www` connected; `NEXT_PUBLIC_SITE_URL` and Supabase URLs updated
- [ ] `npm run launch:check` passes with production variables
- [ ] Spot-check: production pages indexable, sitemap lists real items only, no "Sample" labels visible
