# Setup and deployment

Target: **Vercel** (Next.js app) + **Supabase** (Postgres, Auth, Storage) +
**Resend** (inquiry email). Nothing here has been connected or paid for yet — every
step below needs the owner's accounts and authorisation.

> Status: **ready to deploy after configuration**. Not yet deployed or verified
> against live Supabase, Google or Resend. See TASKS.md for the pending live checks.

## 0. Local development

```bash
npm install
cp .env.example .env.local   # leave Supabase/Resend empty for demo mode
npm run dev                  # http://localhost:3000
npm run check                # lint + typecheck + unit + database policy tests
npm run build
```

Without Supabase variables the public site shows bundled demo content (labelled)
and `/admin` explains that it is not connected. Without Resend variables the
contact form runs in clearly labelled demo mode and sends nothing.

## Prototype setup (one free Supabase project) — current plan

The prototype runs on the developer's own free accounts (DECISIONS.md D12). One
Supabase project is enough; it stays in `preview` mode, so samples remain visible
with labels and search engines are blocked. Sections 1–6 describe the full
two-project production setup for the eventual handover.

1. **Create the project** — sign in at <https://supabase.com/dashboard> with the
   account you already use for Provice CRM.
   - Top-left organisation menu → **New organization** → name it `JFL Solar`,
     plan **Free**. (A separate organisation keeps it apart from Provice and makes
     a later transfer cleaner.) Free accounts may have **two active free
     projects** in total — Provice CRM uses one, this uses the other.
   - **New project** in the `JFL Solar` organisation: name `jflsolar`, a strong
     database password (save it in your password manager), region **Southeast
     Asia (Singapore)**. Wait about 2 minutes for it to finish provisioning.
2. **Create the database** — *SQL Editor → New query*. Paste and **Run** each file,
   in this order:
   1. `supabase/migrations/20261011000100_initial_schema.sql`
   2. `supabase/migrations/20261011000200_admin_integrity.sql`
   3. `supabase/seed.sql` (sample content, contact details, categories)
   Then check *Table Editor* shows `packages`, `products`, … and *Storage* shows a
   private bucket `media`.
3. **Google sign-in** — follow section 2 below with this one project. Redirect URLs:
   `http://localhost:3000/auth/callback`, `http://localhost:3001/auth/callback`, and
   later your Vercel URL (`https://<project>.vercel.app/auth/callback` plus
   `https://*-<vercel-team-slug>.vercel.app/**` for previews). Turn the Email
   provider **off**.
4. **Keys into `.env.local`** (*Project Settings → API Keys*). Create/edit
   `.env.local` in the project folder yourself — do not paste the secret key into
   chat:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable or anon key>
   SUPABASE_SECRET_KEY=<secret or service_role key>
   ```
5. **First owner** — `npm run admin:grant -- you@gmail.com owner "Your Name"`, then
   `npm run dev`, open `http://localhost:3000/admin/login` and sign in with Google.
6. **Vercel (Hobby, optional for the prototype)** — import the GitHub repo and add
   the same three variables plus `NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app`.
   Leave `SITE_ENV` unset (preview mode = noindex).
7. **Keep it awake** — a free project pauses after ~7 days without traffic. If the
   preview shows a database error, open the Supabase dashboard and click
   **Restore project**.

**Handover to JFL Solar:** they create their own GitHub/Vercel/Supabase/Google
Cloud accounts, the repository is transferred to them, and sections 1–6 are
followed with their domain **jflsolar.ph** (Vercel Pro recommended for commercial
use). To carry over everything edited on the prototype — settings, content blocks,
categories, packages, products, projects, staff list, and every referenced photo
and datasheet in the `media` bucket — apply the migrations to the new, **unseeded**
project, then run:

```bash
# .env.migrate.local (git-ignored): FROM_/TO_SUPABASE_URL and FROM_/TO_SUPABASE_SECRET_KEY
npm run migrate:content            # dry run: counts, file check, target-empty check
npm run migrate:content -- --apply # files first, then rows parent-first, then row-count check
npm run migrate:content -- --apply --resume  # only if a copy stopped part-way
```

Sign-in accounts are not copied; staff sign in with Google again (access is by
email). The step-by-step owner-facing version is the "JFL Solar Website —
Migration Guide" document.

## 1. Supabase — two projects (production handover)

Create **two** Supabase projects (Free tier is fine to start; see DECISIONS.md D2
for the pause-after-inactivity caveat):

| Project | Used by | `content_mode` |
| --- | --- | --- |
| `jflsolar-preview` | local dev + Vercel Preview deployments | `preview` |
| `jflsolar-production` | Vercel Production (jflsolar.com) | `production` |

For each project:

1. **Apply the schema** — either Supabase CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push            # runs supabase/migrations/*.sql
   ```
   or paste **every** file in `supabase/migrations/` into *SQL Editor → New
   query → Run*, one at a time **in filename order** (currently
   `20261011000100_initial_schema.sql`, then `20261011000200_admin_integrity.sql`).
   Skipping a file leaves admin features (cover photos, reordering) broken.
2. **Seed** (preview project — and production for the initial settings/categories):
   paste `supabase/seed.sql` into the SQL editor. It contains the contact
   settings, categories, content blocks and **sample** packages/products/projects.
   On production you may instead seed and then archive the samples in the admin.
3. **Production only — switch the database to production mode** (hides samples and
   unconfirmed claims from the public at the database level):
   ```sql
   update public.deployment_config set content_mode = 'production';
   ```
4. **Storage**: the migration creates the private `media` bucket and its policies.
   Check *Storage → media* exists and is **not public**.
5. **API keys** (*Project Settings → API Keys*): copy the URL, the publishable
   (or anon) key, and the secret (or service_role) key.

## 2. Google sign-in (Supabase Auth)

1. Google Cloud Console → *APIs & Services → Credentials → Create OAuth client ID*
   (type **Web application**). Configure the OAuth consent screen (External,
   app name "JFL Solar Admin", support email = owner).
2. **Authorised redirect URI** (one per Supabase project):
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase → *Authentication → Sign In / Providers → Google*: enable, paste the
   Client ID and Secret.
4. Supabase → *Authentication → Providers*: **disable Email** (and any other
   provider) so Google is the only way in.
5. Supabase → *Authentication → URL Configuration*:
   - **Site URL**: `https://jflsolar.com` (production project) /
     `http://localhost:3000` (preview project)
   - **Redirect URLs** (allow-list — the app sends users to `/auth/callback`):
     - preview project: `http://localhost:3000/auth/callback`,
       `https://*-<vercel-team-slug>.vercel.app/**` (Vercel preview deployments; Supabase accepts glob patterns)
     - production project: `https://jflsolar.com/auth/callback`,
       `https://www.jflsolar.com/auth/callback`

Google sign-in alone grants **no** access — see step 4.

## 3. First administrator

Staff access comes from `public.staff_members`. Users cannot add themselves.
Bootstrap the first owner **out-of-band** with either:

```bash
# .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY for that project
npm run admin:grant -- owner@gmail.com owner "Owner Name"
```

or in the SQL editor:

```sql
insert into public.staff_members (email, role, display_name)
values ('owner@gmail.com', 'owner', 'Owner Name');
```

The owner then signs in at `/admin/login` with that Google account and can add
more staff in **Admin → Staff** (owner or editor). The database prevents removing
or demoting the last active owner.

## 4. Inquiry email (Resend)

1. Create a Resend account; add and **verify the domain** `jflsolar.com`
   (DNS records shown by Resend: SPF/DKIM, optionally DMARC).
2. Create an API key with *Sending access* only.
3. Set `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` (the business inbox — **pending from
   the owner**), `INQUIRY_FROM_EMAIL` (e.g. `JFL Solar Website <inquiries@jflsolar.com>`),
   `INQUIRY_SIGNING_SECRET` (32+ random chars), and the Supabase secret key (the
   rate limiter requires it; without it live inquiries fail safely).
4. **Test real delivery** on a Preview deployment: submit one inquiry, confirm it
   arrives, reply-to works, and Resend's dashboard shows "Delivered". Watch Resend
   → *Emails* for bounces in the first weeks.

## 5. Vercel

1. Import the GitHub repo `hunghang03/jflsolar` (framework: Next.js).
2. **Environment variables** (Project → Settings → Environment Variables), all
   from `.env.example`:

   | Variable | Preview | Production |
   | --- | --- | --- |
   | `SITE_ENV` | `preview` | `production` |
   | `NEXT_PUBLIC_SITE_URL` | preview URL or leave localhost | `https://jflsolar.com` |
   | `NEXT_PUBLIC_SUPABASE_URL` / `..._PUBLISHABLE_KEY` | preview project | production project |
   | `SUPABASE_SECRET_KEY` | preview project | production project |
   | `RESEND_API_KEY`, `INQUIRY_*` | optional (test inbox) | required |

   Mark the secret key, Resend key and signing secret as **Sensitive**.
3. Deploy. Preview deployments are `noindex` and show the proposal ribbon.
4. Plan: Vercel **Hobby is for non-commercial use**; a business site should use
   **Pro**. Owner decision — not enabled.

## 6. Custom domain (later, with owner authorisation)

1. Vercel → Project → *Domains* → add `jflsolar.com` and `www.jflsolar.com`
   (redirect `www` → apex or vice versa).
2. At the domain registrar, create exactly the DNS records Vercel displays for the
   apex and `www` (or switch to Vercel nameservers).
3. Update `NEXT_PUBLIC_SITE_URL`, the Supabase *Site URL* and *Redirect URLs*, then
   redeploy.
4. Run `npm run launch:check` with production variables in `.env.production.local`.
5. Submit `https://jflsolar.com/sitemap.xml` in Google Search Console (optional).

## 7. Operations

- **Schema changes**: add a new file in `supabase/migrations/`, run `npm run check`
  (PGlite applies it and runs the policy tests), then `supabase db push` to
  preview, then production.
- **Backups**: Supabase Free has no point-in-time recovery; Pro includes daily
  backups. Export periodically from the dashboard if staying on Free.
- **Media cache**: unpublished images may stay in the CDN for up to ~5 minutes.
- **Regenerating brand assets**: `npm run brand:assets` (from `docs/reference/`).
