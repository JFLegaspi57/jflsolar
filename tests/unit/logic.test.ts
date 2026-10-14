import { test } from "node:test";
import assert from "node:assert/strict";
import { manilaToday, priceDisplay, promoState, formatCapacity } from "../../lib/pricing";
import { validateInquiry, readInquiry, emptyInquiry } from "../../lib/inquiry/schema";
import { FormParser, slugify } from "../../lib/admin/form";
import { filterProducts } from "../../lib/catalog";
import { parseMediaPath } from "../../lib/media";
import { demoCategories, demoProducts } from "../../lib/demo/content";

test("promotion state uses inclusive Asia/Manila calendar days", () => {
  const p = { promo_start: "2026-10-01", promo_end: "2026-10-31" };
  assert.equal(promoState(p, "2026-09-30"), "upcoming");
  assert.equal(promoState(p, "2026-10-01"), "active");
  assert.equal(promoState(p, "2026-10-31"), "active");
  assert.equal(promoState(p, "2026-11-01"), "ended");
  assert.equal(promoState({ promo_start: null, promo_end: null }, "2026-10-11"), "none");
  // 2026-10-31T16:30Z is already 1 Nov 00:30 in Manila (UTC+8)
  assert.equal(manilaToday(new Date("2026-10-31T16:30:00Z")), "2026-11-01");
  assert.equal(manilaToday(new Date("2026-10-31T15:59:00Z")), "2026-10-31");
});

test("price display: modes, samples and withdrawn promotions", () => {
  const base = { price_basis: "Pickup price", price_is_sample: false };
  assert.equal(priceDisplay({ ...base, pricing_mode: "fixed", price_php: 205000 }).headline, "₱205,000");
  assert.equal(priceDisplay({ ...base, pricing_mode: "starting", price_php: 120000 }).headline, "From ₱120,000");
  assert.equal(priceDisplay({ ...base, pricing_mode: "quote", price_php: null }).headline, "Price to be confirmed");
  const ended = priceDisplay({ ...base, pricing_mode: "fixed", price_php: 99000 }, "ended");
  assert.equal(ended.hasAmount, false);
  assert.match(ended.headline, /Promotion ended/);
  assert.equal(priceDisplay({ ...base, price_is_sample: true, pricing_mode: "fixed", price_php: 1 }).isSample, true);
  assert.equal(formatCapacity(5.58, "kWp"), "5.58 kWp");
  assert.equal(formatCapacity(6.2, "kWp"), "6.2 kWp");
  assert.equal(formatCapacity(null, "kWh"), null);
});

test("inquiry validation requires one usable contact method and validates only supplied ones", () => {
  const ok = { ...emptyInquiry, name: "Ana", inquiry_type: "residential", message: "Need a quote for a 6 kW hybrid system." };
  assert.deepEqual(validateInquiry({ ...ok, phone: "0917 123 4567" }), {});
  assert.deepEqual(validateInquiry({ ...ok, email: "ana@example.com" }), {});
  assert.ok(validateInquiry(ok).contact, "neither contact → error");
  assert.ok(validateInquiry({ ...ok, phone: "12" }).phone);
  assert.ok(validateInquiry({ ...ok, email: "not-an-email", phone: "09171234567" }).email, "a supplied invalid email is still reported");
  assert.ok(validateInquiry({ ...ok, phone: "0917", inquiry_type: "hacking" }).inquiry_type);
  assert.ok(validateInquiry({ ...ok, phone: "09171234567", message: "short" }).message);
  assert.ok(validateInquiry({ ...ok, phone: "09171234567", bill_range: "999k" }).bill_range);
  assert.ok(validateInquiry({ ...ok, phone: "09171234567", item_slug: "Bad Slug!", item_type: "package" }).item);
});

test("inquiry input is trimmed, bounded and stripped of control characters", () => {
  const fd = new FormData();
  fd.set("name", "  Ana\u0000 Cruz  ");
  fd.set("message", "Line 1\r\nLine 2" + "x".repeat(5000));
  fd.set("item_type", "admin");
  const v = readInquiry(fd);
  assert.equal(v.name, "Ana Cruz");
  assert.equal(v.message.length, 3000);
  assert.ok(v.message.startsWith("Line 1\nLine 2"));
  assert.equal(v.item_type, "", "unknown item types are dropped");
});

test("admin form parser validates slugs, prices, dates, lists, specs and components", () => {
  const fd = new FormData();
  fd.set("name", "Hybrid 6 kW — Installed!");
  fd.set("price", "₱205,000");
  fd.set("bad_date", "2026-13-40");
  fd.set("specs", "Rated power: 620 W\nBifacial");
  fd.set("components", "Inverter | GoodWe 6 kW | 1 unit\nPanels | 620 W");
  fd.set("inclusions", "- Panels\n• Inverter\n\n");
  const p = new FormParser(fd);
  assert.equal(p.slug("slug", p.text("name", "Name", { max: 120 })), "hybrid-6-kw-installed");
  assert.equal(p.number("price", "Price", { max: 1e9 }), 205000);
  assert.equal(p.date("bad_date", "Date"), null);
  assert.ok(p.errors.bad_date);
  p.specs("specs");
  assert.match(p.errors.specs, /Line 2/);
  assert.deepEqual(p.components("components"), [
    { label: "Inverter", detail: "GoodWe 6 kW", quantity: "1 unit" },
    { label: "Panels", detail: "620 W", quantity: null },
  ]);
  assert.deepEqual(p.lines("inclusions", "Inclusions", { maxItems: 5, maxLen: 50 }), ["Panels", "Inverter"]);
  assert.equal(slugify("Ñandú Solar  Packs!!"), "nandu-solar-packs");
});

test("catalogue search is case/accent-insensitive and filters by category and brand", () => {
  const products = demoProducts.map((p) => ({ ...p, category: demoCategories.find((c) => c.id === p.category_id) ?? null, images: [], datasheet: null }));
  assert.equal(filterProducts(products, { q: "GOODWE", category: "", brand: "" }).length, 1);
  assert.equal(filterProducts(products, { q: "620 w", category: "", brand: "" }).length, 1);
  assert.equal(filterProducts(products, { q: "", category: "solar-panels", brand: "" }).length, 4);
  assert.equal(filterProducts(products, { q: "", category: "solar-panels", brand: "trina solar" }).length, 1);
  assert.equal(filterProducts(products, { q: "nonexistent", category: "", brand: "" }).length, 0);
});

test("media paths are strictly validated", () => {
  const ok = "packages/00000000-0000-4000-8000-000000000201/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  assert.deepEqual(parseMediaPath(`${ok}/640.webp`.split("/")), { path: `${ok}/640.webp`, contentType: "image/webp" });
  assert.equal(parseMediaPath(`${ok}/datasheet.pdf`.split("/"))?.contentType, "application/pdf");
  assert.equal(parseMediaPath(["..", "..", "etc", "passwd"]), null);
  assert.equal(parseMediaPath(`${ok}/999.webp`.split("/")), null);
  assert.equal(parseMediaPath(`secret/${ok.split("/").slice(1).join("/")}/640.webp`.split("/")), null);
});
