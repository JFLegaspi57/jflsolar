# Tasks

Last updated: 2026-10-11 (Claude). Status: **ready to deploy after configuration** —
not deployed; live Supabase / Google / Resend checks pending credentials.

## In review

- [x] M4 Final readiness — Codex review PASS after fixes (REVIEW.md)

## Live verification (Supabase project dwomkopfkhicqhebwrjn, local dev server)

Verified 2026-10-14 by Claude in the browser, signed in as an owner:
- [x] Migrations + seed applied; private `media` bucket; integrity functions present
- [x] Anonymous API on real PostgREST: no admin_notes, no staff list, no writes, no rate-limit RPC
- [x] Google OAuth sign-in; non-staff Google account (before being granted) → access denied; signed-out /admin → login; /admin/media without session → 401
- [x] Package: validation error keeps values + focuses summary; create draft (public 404); upload photo (WebP variants); draft photo private on /media, admin route without session and direct Supabase URL; publish → public page, listing and photo live; edit while live (notice shown) → public updated; stale save rejected with values kept; reorder; unpublish → page + photo 404; archive; delete only when archived, confirm dialog (Escape cancels, focus returns); delete removed row, media rows and storage files

Still pending:
- [ ] Image replace, cover change, image reorder/delete, datasheet upload (RPC logic tested on PGlite only)
- [ ] Products, projects, categories, content blocks, settings and staff pages against the live project (same code paths as packages)
- [ ] Concurrency under real parallel load (rate limit, last-owner lock)
- [ ] Resend live delivery (needs mailbox + Resend account); Vercel deployment; launch:check with production config

## Missing owner content / confirmations

- [ ] Create/confirm the `info@jflsolar.com` mailbox (placeholder now shown publicly and intended as the inquiry recipient)
- [ ] Facebook page visibility: https://www.facebook.com/jflsolar (owner-confirmed, button enabled) shows "content isn't available" to logged-out visitors on 2026-10-14; Messenger link not supplied
- [ ] Registered company name (banner shows "JFL Solar and Renewables Corporation")
- [ ] Founding date (June 2024), founder profile/credentials/photo permission (JF Legaspi)
- [ ] Mission/vision wording approval (lightly edited)
- [ ] "Tier-1" terminology; replacement/loaner-unit policy; free technical-support scope; after-sales scope
- [ ] Warranty terms (general and per item)
- [ ] Approved package prices/promotions (₱205,000 October 2026 Trio bundle is reference only)
- [ ] Product catalogue: models, specs, datasheets, availability; distributor status per brand
- [ ] Approved project photos and details (sample projects must be replaced)
- [ ] Business hours (optional); legal review of privacy notice and terms
- [ ] Permission to use the banner photo (docs/reference/banner.png) — not used on the site

## Owner decisions

- [x] Hosting (2026-10-14): prototype on the developer's free Vercel Hobby + one Supabase Free project; clone to JFL Solar's own accounts on acquisition (DECISIONS.md D12)
- [ ] Analytics (none installed; would require privacy-notice update)

## Done

- [x] Repo inspection (empty), attachments reviewed, Facebook URL checked (not public), Next.js 16.4 docs read
- [x] Scaffold: Next.js 16.4, React 19.3, strict TS, Tailwind v4, Cache Components
- [x] Design direction + Codex M1 review (12 findings triaged; see REVIEW.md)
- [x] Brand assets from supplied logos (trim/resize only); sampled colours; design tokens
- [x] Supabase schema, constraints, RLS, storage policies, rate limiting, integrity functions; seed generated from demo content; 11 PGlite policy tests
- [x] Public site: home, services, packages (+ filter, compare), package detail, products (search/category/brand), product detail, projects, project detail, about, contact/quote, privacy, terms, 404, error, sitemap, robots, OG image, structured data
- [x] Inquiry: shared validation, value retention, focus management, HMAC token + min fill time, honeypot, persistent fail-closed rate limit, Resend with idempotency key, explicit demo mode
- [x] Codex M2 review (10 findings) — fixed and verified by Codex in M3
- [x] Admin: Google sign-in + allowlist, roles, CRUD for packages/products/categories/projects/content blocks/settings/staff, media manager, datasheets, draft preview, promotion-expiry indicators, overview launch checklist
- [x] Codex M3 review (12 findings) — fixed; awaiting Codex recheck in M4
- [x] Docs: README, docs/SETUP.md, docs/OWNER-GUIDE.md, docs/DESIGN.md, .env.example; scripts: check, launch:check, admin:grant, QA journeys/axe
- [x] Verification: lint ✓, typecheck ✓, 18/18 tests ✓, production build ✓, 38/38 browser journeys ✓ (prod build, demo mode), axe WCAG 2.2 AA 0 violations on 17 routes × 2 widths, no overflow at 320 px, real 404s
