# Review log

Independent reviews by Codex (senior web UX lead, QA/QE). Each finding:
severity, impact, reproduction, suggested remediation, status. Claude records
fixes under each finding; Codex rechecks before a finding is closed.

Severity: BLOCKER > MAJOR > MINOR.

---

## Round M1 — Design direction & architecture (Codex, 2026-10-11)

Scope: `AGENTS.md`, `DECISIONS.md`, `docs/DESIGN.md`, `TASKS.md`, `docs/reference/*`.
Codex ran read-only (`codex exec -s read-only`); its report is transcribed below
verbatim in substance, with Claude's triage under each item.

**Codex verdict: FAIL** (9 MAJOR, 3 MINOR)

- [x] **M1-1 MAJOR — Production visibility enforced only in app code.** RLS restricted status but not samples / unconfirmed claims; direct REST or media requests could expose content hidden by production pages.
  - Triage: **accepted.** Added `public.deployment_config.content_mode` (`preview`|`production`, writable only via SQL — no RLS write policy). Anonymous RLS and the media-storage policy now also exclude `is_sample` rows and `needs_confirmation` blocks when the database is in production mode. Preview and production use **separate Supabase projects** (D5).
- [x] **M1-2 MAJOR — `next/image` optimiser cache (4 h minimum TTL) outlives the 5-minute withdrawal window.**
  - Triage: **accepted.** Revocable CMS media no longer go through the optimiser: uploads are re-encoded server-side into fixed WebP widths (640/1280/2000) and served by `/media/...` via a plain responsive `<img srcset>`; `Cache-Control: public, max-age=60, s-maxage=300`. Only static brand assets use `next/image`.
- [x] **M1-3 MAJOR — No rate/replay limit on inquiries.**
  - Triage: **accepted.** Server-side limits: per-IP (salted hash, never raw IP) 5 per 10 min and a global daily cap (`INQUIRY_DAILY_CAP`, default 80, under Resend's free 100/day). Tokens expire after 12 h; replays of identical content are de-duplicated by the Resend idempotency key. All fields have length bounds. Values are preserved on every failure.
- [x] **M1-4 MAJOR — Comparison spec incomplete; mobile behaviour undefined.**
  - Triage: **accepted.** Comparison rows fixed: offer type, installation status, system type, inverter kW, array kWp, battery kWh, price + mode + basis, promotion window/state, pickup/delivery, inclusions, exclusions, warranty. ≥768 px: semantic table with row headers. <768 px: attribute-first stacked groups (each attribute lists every selected package) so the 320 px layout never scrolls horizontally.
- [x] **M1-5 MAJOR — No interaction contracts for menu, dialogs, sticky bars.**
  - Triage: **accepted.** Mobile menu and confirm dialogs use native `<dialog>.showModal()` (focus moves in, background inert, Escape closes, focus returns to the opener). Targets ≥ 44 px. Sticky admin save bar reserves bottom padding and `scroll-padding-bottom`. Save results announced via `role="status"`; errors via an error summary that receives focus.
- [x] **M1-6 MAJOR — Saving a published item exposes unfinished edits; no staged revisions; no concurrency control.**
  - Triage: **partially accepted.** Full staged revisions are disproportionate for this site's volume and would double the schema. Implemented instead: (a) optimistic concurrency — every save sends the `updated_at` it loaded and is rejected if the row changed; (b) a prominent "This item is live — saving updates the public page" notice plus a "Save as draft (unpublish)" option; (c) unsaved-changes `beforeunload` warning; (d) authenticated admin preview of drafts. Recorded in DECISIONS.md D10.
- [x] **M1-7 MAJOR — Media associations missing for About/site content; no authenticated draft delivery.**
  - Triage: **accepted.** `media_assets` may also belong to a `content_block` (e.g. founder photo). Staff see drafts through `/admin/media/...` (session client, `private, no-store`).
- [x] **M1-8 MAJOR — Selected item not resolved server-side; no delivery-failure workflow.**
  - Triage: **accepted.** Server resolves `item_type`+`item_slug` against currently public records; unknown/withdrawn items are dropped with a visible notice; valid selections survive errors. Owner guide documents Resend bounce/delivery monitoring; failure messages list phone/WhatsApp/Viber.
- [x] **M1-9 MAJOR — "Established" and "across the Philippines" imply unconfirmed history/coverage.**
  - Triage: **partially rejected.** Service area "anywhere in the Philippines" and the line "Serving customers across the Philippines." are owner-confirmed in the brief. "Established" was internal design language only and will not appear in public copy. Founding date, founder credentials, warranty/support promises are gated by `claim_status`.
- [x] **M1-10 MINOR — Product detail / filter empty states unspecified.** Accepted: result count, persistent GET filters, "Clear filters", no-results block with a quote link; detail fields defined in DESIGN.md.
- [x] **M1-11 MINOR — Contact-method validation ambiguity; timing-rejection recovery.** Accepted: only supplied contact fields are validated; the group error is associated with both inputs; timing/provider errors preserve all values and explain how to retry.
- [x] **M1-12 MINOR — No explicit launch gate / structured-data policy.** Accepted: `npm run launch:check` reports production readiness (delivery configured, DB in production mode, no published samples/unconfirmed blocks); structured data restricted to name, URL, logo, phone, office address, area served; no ratings.

Status: triage complete; all items open until implemented and rechecked by Codex in a later round. `[ ]` = open, `[~]` = partially accepted (open), `[x]` = closed after Codex recheck.

---

## Round M2 — Working public pages (Codex, 2026-10-11)

Codex reviewed source and fetched rendered pages from the running dev server
(demo mode). **Codex verdict: FAIL** (4 MAJOR, 6 MINOR).

- [x] **M2-1 MAJOR — Comparison page rendered no packages.** `MAX_COMPARE` was imported into a Server Component from a `"use client"` module (a client reference, not a number). Repro: `/packages/compare?p=trio-6kw-hybrid-equipment-bundle&p=residential-hybrid-system-6kw-installed` → "Select at least two packages".
  - Fix (Claude): constant moved to `lib/catalog.ts`. Verified: the URL now renders all comparison rows.
- [x] **M2-2 MAJOR — `/media/**` still allowed through the image optimiser** (4 h cache).
  - Fix: removed from `images.localPatterns`; only `/brand/**` allowed. Verified: `/_next/image?url=/media/...` → HTTP 400.
- [x] **M2-3 MAJOR — Live delivery fell back to a per-instance memory limiter** when the service key was missing or the RPC failed.
  - Fix: limiter now fails **closed** (`unavailable` → no email attempt, values kept, direct contact routes offered). Memory limiter removed. `npm run launch:check` will require the service-role key when delivery is configured.
- [x] **M2-4 MAJOR — Rate-limit admission not serialised** (concurrent requests could exceed caps).
  - Fix: `pg_advisory_xact_lock` at the start of `inquiry_rate_check`. DB tests pass; PGlite is single-connection so a true concurrent test cannot run locally — recheck against a live Supabase project.
- [x] **M2-5 MINOR — Compare submit disabled without JavaScript.** Fix: enabled until hydration; the count-based disable applies only after hydration.
- [x] **M2-6 MINOR — No og:image / twitter:image on routes with explicit metadata.** Fix: shared `pageMetadata` adds the generated `/opengraph-image`. Verified in `/products` HTML.
- [x] **M2-7 MINOR — Expired-token recovery immediately hit the 3 s minimum.** Fix: the refreshed token is back-dated by the minimum fill time.
- [x] **M2-8 MINOR — Mobile comparison lacked sample labels.** Fix: "(sample)" beside each sample package name in the mobile legend.
- [x] **M2-9 MINOR — Privacy notice overstated 24 h deletion.** Fix: wording now says fingerprints are only used for 24 h and older ones are deleted the next time the form is used.
- [x] **M2-10 MINOR — `npm run check`, `launch:check` and `.env.example` missing.** Fix: added (see package.json, `.env.example`, `scripts/launch-check.ts`).

**M1 recheck by Codex:** verified M1-1, M1-5, M1-8, M1-9, M1-10. Still open at that time: M1-2, M1-3, M1-4, M1-11, M1-12 (addressed by M2-1…M2-4, M2-7, M2-10 above), M1-6 and M1-7 (admin — milestone 3).

---

## Round M3 — Staff admin (Codex, 2026-10-11)

Source review of the admin (no live Supabase available) plus local HTTP checks.
**Codex verdict: FAIL** (6 MAJOR, 6 MINOR). Codex verified M1-1…M1-4, M1-8…M1-11 and
all of M2-1…M2-10 (M2-4 live concurrency untested).

- [x] **M3-1 MAJOR — Last-owner trigger not serialised** (two owners demoting each other concurrently).
  - Fix: migration `20261011000200_admin_integrity.sql` takes `pg_advisory_xact_lock` before counting owners.
- [x] **M3-2 MAJOR — Datasheet replacement deleted the old asset before inserting the new one.**
  - Fix: replacement now *updates* the existing row conditionally on its current key; the old file is removed only after the update succeeds.
- [x] **M3-3 MAJOR — Permanent delete not atomic with archived status.**
  - Fix: `delete … where id = ? and status = 'archived'`; media files are removed only after the row is actually deleted (restored records keep their media).
- [x] **M3-4 MAJOR — Unsaved-change protection only on page unload.**
  - Fix: while dirty, in-app link clicks and other forms' submissions (Publish/Archive, image actions) ask for confirmation.
- [x] **M3-5 MAJOR — Fields editable during save, then reset by the response.**
  - Fix: all fields are inside a `<fieldset disabled>` while the save is pending; `aria-busy` set.
- [x] **M3-6 MAJOR — Draft detail previews (promised in D10) missing.**
  - Fix: public detail templates extracted to `components/detail/*Detail.tsx`; staff-only `/admin/preview/[entity]/[id]` renders drafts with session data and private media. "Preview full page" link on each edit page.
- [x] **M3-7 MINOR — Image replace had no version check; cleanup failures ignored.** Fix: update conditional on the old storage key; conflict message; cleanup failures logged.
- [x] **M3-8 MINOR — Cover/reorder were multiple independent writes.** Fix: `media_set_cover`, `media_move`, `record_move` SQL functions (SECURITY INVOKER, staff-checked, one transaction each). DB tests added (11/11 pass).
- [x] **M3-9 MINOR — Image decode errors escaped the field-error flow.** Fix: the whole sharp pipeline is wrapped; a damaged file returns a file error.
- [x] **M3-10 MINOR — Media form errors not associated/rendered.** Fix: `aria-invalid`/`aria-describedby` and visible messages for file, alt text and replacement errors.
- [x] **M3-11 MINOR — Scroll padding on a non-scrolling element.** Fix: `html:has([data-admin-form]) { scroll-padding-bottom: 9rem }`; form reserves bottom space.
- [x] **M3-12 MINOR — launch:check treated failed queries as empty.** Fix: every query error is a FAIL.
- M1-7 (Codex: no UI to attach a first image to non-founder blocks): every content block now has an image manager; the About page renders a block's first image.

---

## Round M4 — Final readiness (Codex, 2026-10-11)

**Codex verdict: FAIL** (2 MAJOR). Codex verified M1-5, M1-6 (accepted D10 alternative),
M1-12 and M3-1…M3-12 (live concurrency untested); M1-7 still open.

- [x] **M4-1 MAJOR — SETUP.md SQL-editor path applied only the first migration.** Fix: instructs applying every migration in filename order, naming both files.
- [x] **M4-2 MAJOR — Content-block deletion removed images before the row was deleted.** Fix: row deleted first (verified by returned row), then storage cleanup (failures logged).
- [x] **M1-7 (reopened) — About omitted images attached to intro, mission and vision.** Fix: those blocks now render their first image.

**Codex recheck of M4 fixes (2026-10-11): VERDICT: PASS** — M4-1, M4-2 and M1-7 verified;
no regressions in source review. All findings from rounds M1–M4 are now closed.
Still unverified by anyone (no credentials): live Supabase CRUD/RLS/Storage, Google OAuth,
real concurrency, Resend delivery. See TASKS.md "Pending live verification".
