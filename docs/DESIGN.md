# Design direction — JFL Solar

Status: v1 (2026-10-11), for Codex UX review at milestone 1.

## Positioning

An established solar engineering and supply company: calm, precise, technical,
trustworthy. Three audiences, two main journeys:

| Audience | Primary need | Journey |
| --- | --- | --- |
| Homeowners | Bill savings, backup power, a trustworthy installer | Services → Packages (installed) → Request a Quote |
| Commercial / industrial | Assessment, engineering, proposal | Services (C&I) → Request a Quote (consultancy) |
| DIY buyers / installers | Equipment, models, specs, price | Products / Packages (equipment-only) → Request a Product Quote |

## Information architecture

Primary nav (desktop, ≥1024 px): Solar Services · Packages · Products · Projects ·
About · Contact — plus a persistent gold **Request a Quote** button and the phone
number. Mobile: logo + "Quote" button + menu button opening a full-height panel
(links, phone, WhatsApp, Viber).

```
/                       Home
/services               Solar Services (residential, C&I, assessment→after-sales, on-grid/hybrid/off-grid)
/packages               Package listing (filter: installed vs equipment-only) + compare (≤3)
/packages/compare?p=a,b Side-by-side comparison
/packages/[slug]        Package detail + "Ask About This Package"
/products               Catalogue: search, category, brand filters (GET form — works without JS)
/products/[slug]        Product detail + "Request a Product Quote"
/projects               Project gallery
/projects/[slug]        Project detail (photo gallery, captions)
/about                  Introduction, mission, vision, founder, why choose us, warranty
/contact                Request a Quote form + all contact routes, office vs warehouse
/privacy, /terms        Inquiry data handling; essential legal info (pending legal review)
/admin/...              Staff dashboard (Google sign-in + allowlist)
```

## Home page structure

1. **Hero** — headline on what JFL does ("Solar PV systems, engineered and
   supplied across the Philippines"), one-line explanation of the three services,
   primary CTA **Request a Quote**, secondary "Browse equipment".
2. **Two pathways** — side-by-side split: "I want solar installed" (home,
   business) vs "I'm buying equipment" (DIY, installers). Each lists 3 bullets and
   one clear link.
3. **Services strip** — Installation · Consultancy · Equipment supply.
4. **Featured packages** — 3 cards with kW / kWp / kWh spec row, type label
   (Installed system vs Equipment only), price or "Price to be confirmed".
5. **Product categories** — compact list of 6 categories (not a card grid).
6. **How a project works** — 6 numbered steps: assessment → consultancy →
   proposal → installation → commissioning → after-sales.
7. **Projects showcase** — labelled sample projects (preview only).
8. **Why JFL** — quality, warranty assistance, technical support, after-sales
   (preview shows "awaiting confirmation" markers on unconfirmed claims).
9. **Contact band** — phone, WhatsApp/Viber, office vs warehouse, quote CTA.

## Visual system

- Colours (sampled from supplied logos): slate-900 `#333F4F` (brand), deeper
  slate-950 `#1F2733` for large dark panels, gold-500 `#FFB004` (fill only), sun
  `#FED404` (tiny accents), gold-800 `#8A5300` (gold text on white), neutrals
  `#F6F7F9`, `#E6E9EE`, `#5B6574` (secondary text, 5.9:1 on white).
- Type: Archivo 600–800 for display (tight tracking), Source Sans 3 for body
  (17 px base, 1.6 line height). Numbers in specs use tabular figures.
- Shape: 6 px radius on controls, 10 px on panels; 1 px hairlines; gold
  4 px top rule as the recurring brand signature on section headers.
- Imagery: no stock. Placeholder slots render a slate panel with a fine PV-cell
  grid pattern and a visible "Placeholder" label.
- Motion: 150 ms colour/translate transitions; none when
  `prefers-reduced-motion: reduce`.

## Components

Button (primary gold / secondary slate outline / ghost), Badge (status, sample,
awaiting confirmation, promotion), SpecRow (kW · kWp · kWh), PriceBlock (fixed,
starting-at, quote; sample price label; promotion window; ended state),
SectionHeading, PlaceholderImage, ContactRoutes, InquiryForm, FilterBar,
CompareTray, Admin: DataTable, FormField, StatusPill, ConfirmDialog, ImageManager.

## Inquiry form

Fields: Name*; Phone and/or Email (≥1 required, both validated); Inquiry type*
(Residential installation, Commercial/industrial installation, Consultancy,
Equipment / product quote, Package inquiry, After-sales / support, Other);
Selected package/product (read-only chip, removable); Location (optional, province/
city); Monthly electricity bill range (optional, shown for installation types);
Message*; Privacy consent notice (link, not a pre-checked box). Errors listed in a
summary with links + inline per-field messages. Demo-mode banner when delivery
is not configured.

## Admin UX

Left rail (desktop) / top tabs (mobile): Overview · Packages · Products ·
Categories · Projects · Site content · Settings · Staff (owners). Lists show
status pill, Sample badge, featured star, order arrows. Edit pages: grouped
fieldsets, sticky Save bar with "Saved" toast, separate Publish / Unpublish /
Archive buttons, Delete only for archived items behind a confirmation dialog.
