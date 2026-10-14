# Decisions

Concise architecture and content decisions for the JFL Solar website. Newest
entries are appended at the bottom of each section. Reversals must say why.

## D1 — Stack (2026-10-11)

- **Next.js 16.4 App Router**, React 19.3, strict TypeScript, Tailwind CSS v4,
  scaffolded with `create-next-app@16.4.0` (the GitHub repo was empty).
- **Cache Components + Partial Prefetching are on** (the scaffold default and the
  model Next.js will make mandatory). Public content reads are `"use cache"`
  functions tagged `content`, with a `minutes` lifetime; admin Server Actions
  call `updateTag("content")` so staff see their own writes immediately.
  Admin routes use `export const instant = false` (blocking, session-dependent).
- Minimal runtime dependencies: `@supabase/supabase-js`, `@supabase/ssr`,
  `sharp` (server-side image validation/re-encoding). No UI kit, no form library,
  no CMS SDK. Validation is hand-written and shared between client and server.
- Dev-only: `@electric-sql/pglite` to run the real SQL migrations and RLS policy
  tests in-process (no Docker/WSL on the development machine).

## D2 — Content backend: Supabase + custom admin (2026-10-11)

Requirement: staff edit packages/products/projects/content without code;
repository editing alone does not qualify. Deployment target is Vercel + Supabase.

Chosen: **Supabase Postgres + Auth + Storage with a custom `/admin` dashboard**
inside the same Next.js app.

- Rejected: hosted headless CMS (Sanity/Contentful/Payload Cloud) — extra vendor,
  extra login, separate permission model, and the owner asked for Supabase.
  Rejected: Git-based CMS (Decap/TinaCMS) — fails the "no repository editing" bar
  for staff and has no draft-media privacy.
- **Cost:** Supabase Free tier (500 MB DB, 1 GB storage, 50k MAU) is sufficient
  for launch. Free projects pause after 7 days without activity — the owner
  should move to Pro (US$25/month) before relying on it for production, or accept
  the pause risk. Vercel Hobby is free but **for non-commercial use only**; a
  business site should be on Vercel Pro (US$20/user/month). No paid service has
  been enabled — this is an owner decision (see TASKS.md "Owner decisions").
- **Maintenance:** schema changes are versioned SQL in `supabase/migrations/`.
  Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

## D3 — Authentication and authorisation (2026-10-11)

- Supabase Auth with **Google OAuth only** (disable email/password and other
  providers in the Supabase dashboard for production).
- Google sign-in alone grants nothing. Access requires an **active row in
  `public.staff_members`** whose email matches the signed-in user's *confirmed*
  email. Roles: `owner` (manages staff + content) and `editor` (content only).
- Enforcement in three layers: (1) admin layout + every Server Action call
  `requireStaff()` (server, `supabase.auth.getUser()` → `is_staff()` RPC);
  (2) Postgres RLS — every write policy requires `public.is_staff()`;
  (3) Storage RLS — uploads/updates/deletes in the `media` bucket require
  `public.is_staff()`.
- Users cannot self-promote: `staff_members` is writable only by owners (RLS),
  a trigger prevents removing/demoting the last active owner, and the first
  owner is bootstrapped out-of-band (SQL editor or `npm run admin:grant`, which
  needs the service-role key locally). See `docs/SETUP.md`.
- `proxy.ts` only refreshes Supabase session cookies on `/admin` and `/auth`
  paths, so public pages stay cookie-free and cacheable.

## D4 — Draft privacy and media delivery (2026-10-11)

- Records have `status` ∈ `draft | published | archived`. Anonymous RLS read
  policies return **published rows only**. Drafts never appear on public pages,
  search, sitemap or structured data.
- One **private** Storage bucket `media`. Files are served through the app
  route `/media/[...path]`, which reads with the *anonymous* key; a Storage RLS
  policy lets `anon` read an object only when its `media_assets` row belongs to
  a publicly visible package/product/project/content block (published, and in a
  production-mode database also non-sample / confirmed). Draft media 404s.
  Staff preview drafts via `/admin/media/[...path]` (session client,
  `Cache-Control: private, no-store`).
- Uploads go through an authenticated Server Action: browser downsizes large
  photos first (keeps under Vercel's 4.5 MB request cap), the server validates
  the real file type with `sharp`, strips metadata, and writes fixed WebP widths
  (640 / 1280 / 2000 px, never upscaled) plus width/height. PDFs (datasheets)
  ≤ 4 MB, `%PDF-` magic-byte checked. The bucket also enforces MIME types and a
  5 MB size limit.
- **CMS media bypass the `next/image` optimiser** (its cache has a 4-hour
  minimum TTL, which would outlive unpublication). They render as plain
  responsive `<img srcset>` from the pre-generated widths with
  `Cache-Control: public, max-age=60, s-maxage=300` — so unpublished media can
  stay in the CDN for at most ~5 minutes (documented trade-off; redeploy purges).
  Static brand assets still use `next/image`. (Codex M1-2)

## D5 — Preview vs production content modes (2026-10-11)

- `SITE_ENV=preview` (default when unset) — proposal preview: `noindex` meta,
  `X-Robots-Tag: noindex`, `robots.txt` disallow-all, a visible "Proposal
  preview" ribbon, sample records shown with "Sample" labels, claims awaiting
  confirmation shown with "Awaiting confirmation" markers.
- `SITE_ENV=production` — sample records (`is_sample = true`) and
  `needs_confirmation` content blocks are excluded from public pages; indexing
  allowed; sitemap published.
- **Enforced at the data boundary too** (Codex M1-1): each Supabase project has
  `public.deployment_config.content_mode` (`preview` | `production`). It has no
  write policy, so it can only be changed with SQL by the project owner. In
  `production` mode anonymous RLS hides `is_sample` rows, `needs_confirmation`
  content blocks and their media, regardless of what the app requests.
  Preview and production must use **separate Supabase projects**.
- When Supabase variables are absent, public pages render the bundled
  **demo content** (`lib/demo/`, identical to `supabase/seed.sql`) with a
  "Demo content — no database connected" notice, and `/admin` shows a
  configuration-required screen. Nothing pretends to be connected. Production
  mode refuses demo content (throws a clear configuration error).

## D6 — Inquiries (2026-10-11)

- Server Action with shared validation, honeypot + signed minimum-fill-time
  token (HMAC with `INQUIRY_SIGNING_SECRET`), controlled inputs so values survive
  errors, `pending` lock + per-submission idempotency key (sent to Resend as
  `Idempotency-Key`, so double submits within 24 h are not re-delivered).
- Delivery via **Resend** HTTP API (free tier: 3,000 emails/month, 100/day) — no
  SDK. Success is shown only after Resend returns 2xx. Inquiry content is not
  stored in the database, so no inquiry PII is retained by the website itself.
- Abuse limits (Codex M1-3): per-client 5 submissions / 10 min keyed by a salted
  SHA-256 of the IP (raw IPs never stored; rows auto-pruned after 24 h) and a
  global daily cap `INQUIRY_DAILY_CAP` (default 80). Counters live in Postgres
  (`inquiry_rate_events`, written only through a `security definer` function);
  without Supabase an in-memory limiter is used (single instance only — fine for
  demo). Tokens expire after 12 h. Every field is length-bounded.
- Selected package/product is re-resolved server-side against currently public
  records; withdrawn/forged items are dropped with a visible notice (M1-8).
- While `INQUIRY_TO_EMAIL` or `RESEND_API_KEY` is unset the form is in
  **demo mode**: banner says submissions are not delivered, the action validates
  but never sends, and phone/WhatsApp/Viber remain the live routes.
- The recipient address is an environment variable, never stored in the
  public settings table.

## D7 — Brand and design system (2026-10-11)

- Logos come from the owner's attachments (white background, not transparent).
  They are cropped/resized only — never redrawn. Header and footer place the
  full lockup on white; dark sections use a deliberate white plate.
- Colours sampled from the files: slate `#333F4F`, solar gold `#FFB004`
  (wordmark), sun yellow `#FED404`. Gold fails contrast as text on white
  (≈1.9:1), so gold is used as a **fill** with slate text (≈6.3:1) and as accent
  rules/icons; text-gold on white uses `gold-800 #8A5300`.
- Typography: Archivo (display/headings, slightly expanded) + Source Sans 3
  (body). Deliberately different from Provice (Inter/Manrope).
- Visual direction: engineering-firm restraint — slate panels, generous white
  space, spec tables with tabular numerals, thin gold rules, no gradients beyond
  a subtle photo scrim, motion limited to hover/focus transitions and respecting
  `prefers-reduced-motion`.
- No stock or AI photography. Until approved project photos exist, image slots
  render a labelled schematic placeholder ("Placeholder — project photo pending").

## D8 — Contact channels (2026-10-11)

- Phone `tel:+639694712098` and WhatsApp/Viber `+639065958757` are
  owner-supplied (also printed on the owner's flyers); enabled by default.
  No test messages were sent (not authorised).
- Facebook `https://www.facebook.com/jflsola` could **not** be verified: it
  shows "This content isn't available right now" to logged-out visitors (as does
  `/jflsolar`). Facebook and Messenger buttons are therefore **disabled** in
  seed settings until staff confirm the URL in Admin → Settings.

## D9 — Analytics (2026-10-11)

- None installed. Adding analytics/marketing trackers requires the owner's
  choice and a privacy-policy update.

## D10 — Editing live content (2026-10-11, Codex M1-6)

Full staged revisions (draft copy of a published record) were considered and
rejected as disproportionate for this site's size: it would double every
content table and the admin forms. Instead:

- Saves use **optimistic concurrency** — the form submits the `updated_at` it
  loaded; the update is rejected ("someone else changed this") if it differs.
- Editing a published item shows "This item is live — saving updates the public
  page immediately", with a **Save and unpublish** alternative.
- Unsaved-changes warning on navigation (`beforeunload`).
- Staff can **preview** drafts at `/admin/preview/[entity]/[id]`, which renders the real public detail templates (`components/detail/*`) from session-read data with private media (Codex M3-6). Edit pages also show the saved card.
- While saving, fields are locked; while there are unsaved changes, in-app navigation and other actions ask first (Codex M3-4/M3-5).

Revisit if the business grows to several editors working on the same records.

## D11 — Interaction and accessibility contracts (2026-10-11, Codex M1-5)

- Mobile navigation and destructive-action confirmations use native
  `<dialog>` + `showModal()` (focus containment, inert background, Escape,
  focus return to the opener).
- Interactive targets ≥ 44 × 44 px; visible 3 px focus ring (slate on light,
  gold on dark).
- Forms: error summary (focus moves to it, links to fields) + inline messages
  bound with `aria-describedby`; success/save messages in `role="status"`.
- Sticky admin save bar: page reserves bottom padding and `scroll-padding-bottom`
  so focused fields are never hidden behind it.

## D12 — Prototype hosting and handover (2026-10-14, owner decision)

- The site is a **prototype** for JFL Solar to evaluate. It runs on the developer's
  own free tiers: one Supabase Free project (the account also hosts Provice CRM;
  Free allows two active projects) and Vercel Hobby. No paid plan is enabled.
- Free-tier caveats accepted for the prototype: the Supabase project pauses after
  ~7 days without activity (restore from the dashboard) and has no automatic
  backups; Vercel Hobby is non-commercial.
- **Handover:** if JFL Solar acquires the site, the repository is cloned into
  JFL Solar's own GitHub/Vercel/Supabase accounts and configured from
  docs/SETUP.md (migrations + seed + env vars). At that point a commercial-use
  plan (Vercel Pro) and Supabase Pro are recommended, with separate preview and
  production projects.
- For the prototype, a single Supabase project in **preview** content mode is used.

## D13 — Contact details update (2026-10-14, owner)

- Facebook page: `https://www.facebook.com/jflsolar` (owner-confirmed), button
  **enabled**. As of 2026-10-14 the page shows "This content isn't available" to
  logged-out visitors — the owner should check the page's visibility settings.
  Supersedes the `/jflsola` URL in D8. Messenger stays off (no link supplied).
- Public email `info@jflsolar.com` is shown as a **placeholder** supplied by the
  owner; it is also the intended inquiry recipient once a mailbox and Resend are
  set up. Until then the form stays in demo mode.

## D14 — Home hero photo (2026-10-14, owner request)

- The hero now uses the owner-supplied rooftop photo (`docs/reference/hero-source.png`,
  from the JFL Solar banner). `scripts/process-hero.mjs` crops off the banner's
  address/website bars, removes the overlaid headline and logo with a seamless
  sky fill, and applies light enhancement → `public/images/hero-rooftop.jpg`.
- Supersedes D7's "no photography until approved" for this image: the owner
  supplied and requested it. Alt text describes the scene only; it makes no
  claim about which project it shows.
- Layout: mobile shows the photo as a band above the text; desktop is a split
  with the photo on the left (technicians visible) fading into the slate text
  panel. The line-drawn system schematic was removed.
