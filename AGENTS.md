<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent collaboration rules

This repository is maintained by Claude Code and OpenAI Codex for **JFL Solar**
(solar installation, consultancy and equipment distribution, Philippines).
It is a separate business from Provice — never reuse Provice branding, copy,
business details or design.

## Roles

- **Claude Code — primary developer.** Implementation, integrations,
  documentation, remediation of review findings.
- **Codex — senior web UX lead and independent QA/QE reviewer.** Reviews
  information architecture, customer journeys, visual hierarchy, accessibility,
  security, SEO and deployment readiness. Records reproducible findings in
  `REVIEW.md` (severity, impact, suggested remediation) and rechecks fixes
  before closing them. Codex does not edit application code unless explicitly
  assigned.

## Workflow

1. Read `TASKS.md` before making changes; update it as work progresses.
2. Read `DECISIONS.md` before changing architecture. Do not reverse a decision
   without recording why.
3. Review at milestones: design direction → public pages → admin → final readiness.
4. Run `npm run check` (lint + typecheck + db policy tests) and `npm run build`
   before calling work complete.
5. Never claim a review, live integration test or deployment happened unless it did.

## Content accuracy rules (non-negotiable)

- No invented testimonials, ratings, client counts, certifications, warranty
  periods, business hours, map coordinates or email addresses.
- Sample/demo records carry `is_sample = true` and are hidden from public pages
  when `SITE_ENV=production`.
- Claims needing owner confirmation live in content blocks with
  `claim_status = 'needs_confirmation'`; they render only in preview mode, flagged.
- Brands listed do not imply authorised-distributor status.

## Development rules

- Next.js 16 App Router (Cache Components on), strict TypeScript, Tailwind CSS v4.
- Supabase for database, auth (Google) and storage. Privileged keys stay server-side.
- Mobile-first (works at 320 px), WCAG 2.2 AA, minimal client JavaScript.
- No secrets in Git; document every variable in `.env.example`.
