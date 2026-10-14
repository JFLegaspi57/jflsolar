// End-to-end customer-journey checks against a running site (demo or live).
//   BASE_URL=http://localhost:3001 node scripts/qa/journeys.mjs
// Uses real keyboard/mouse input via puppeteer. Never submits to a live inbox
// unless the site itself is configured for live delivery (check first!).
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3001";
const exe = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(path, width = 390) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: 900 });
  await p.goto(BASE + path, { waitUntil: "load", timeout: 60000 });
  // Wait for hydration-relevant content rather than network idle (prefetches keep the network busy).
  await p.waitForSelector("main", { timeout: 30000 });
  if (path.startsWith("/contact")) await p.waitForSelector("#f-name", { timeout: 30000 });
  await sleep(500);
  return p;
}
const text = (p, sel) => p.$eval(sel, (e) => e.textContent ?? "").catch(() => "");
const value = (p, sel) => p.$eval(sel, (e) => e.value).catch(() => null);

try {
  // Detect delivery mode — refuse to run form submissions against live delivery.
  const probe = await page("/contact");
  const demo = (await probe.content()).includes("Demo form — submissions are not delivered");
  await probe.close();
  check("Contact form is in demo mode (safe to submit test inquiries)", demo, demo ? "" : "LIVE delivery detected — form submissions skipped");

  if (demo) {
    // 1. Package context carried into the form
    let p = await page("/packages/trio-6kw-hybrid-equipment-bundle");
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), p.click('a[href^="/contact?package=trio-6kw-hybrid-equipment-bundle"]')]);
    check("“Ask About This Package” opens the quote form", p.url().includes("/contact?package=trio-6kw-hybrid-equipment-bundle"));
    check("Selected package shown in the form", (await text(p, "#item-label")).includes("package") && (await p.content()).includes("Trio Package — 6 kW hybrid equipment bundle"));
    check("Inquiry type preselected as package", (await value(p, "#f-type")) === "package");

    // 2. Validation: submit with only a name → errors, values kept, focus on summary
    await sleep(3200);
    await p.type("#f-name", "Test Buyer");
    await p.click('button[type="submit"]');
    await p.waitForSelector('[role="alert"]');
    check("Validation error summary shown", (await text(p, '[role="alert"]')).includes("Please correct the highlighted fields"));
    check("Error summary receives focus", await p.evaluate(() => document.activeElement?.getAttribute("role") === "alert"));
    check("Name retained after validation error", (await value(p, "#f-name")) === "Test Buyer");
    check("Selected package retained after validation error", (await value(p, 'input[name="item_slug"]')) === "trio-6kw-hybrid-equipment-bundle");
    check("Contact-method group error shown", (await p.content()).includes("Give us a phone number or an email address"));
    check("Phone input marked invalid with description", (await p.$eval("#f-phone", (e) => e.getAttribute("aria-invalid") + "|" + e.getAttribute("aria-describedby"))).startsWith("true|"));

    // 3. Invalid phone only
    await p.type("#f-phone", "12");
    await p.type("#f-message", "Please quote this bundle with delivery to Laguna.");
    await p.click('button[type="submit"]');
    await p.waitForFunction(() => document.body.textContent.includes("Enter a valid phone number"));
    check("Invalid phone rejected", true);
    check("Message retained after error", (await value(p, "#f-message")) === "Please quote this bundle with delivery to Laguna.");

    // 4. Fix phone → demo result, nothing sent
    await p.click("#f-phone");
    await p.keyboard.down("Control");
    await p.keyboard.press("KeyA");
    await p.keyboard.up("Control");
    await p.keyboard.press("Backspace");
    await p.type("#f-phone", "0917 123 4567");
    const submit = await p.$('button[type="submit"]');
    await submit.click();
    const disabledWhilePending = await p.$eval('button[type="submit"]', (b) => b.disabled).catch(() => false);
    await p.waitForFunction(() => document.body.textContent.includes("Checked, but not sent (demo)"), { timeout: 15000 });
    check("Valid demo submission reports NOT sent", (await p.content()).includes("NOT sent"));
    check("Submit button disabled while pending (duplicate prevention)", disabledWhilePending, "may be false if the response was instant");
    check("Values kept after demo submission", (await value(p, "#f-phone")) === "0917 123 4567");

    // 5. Remove selected item
    await p.click("#item-remove");
    check("Selected item can be removed", (await p.$('input[name="item_slug"]')) === null);
    await p.close();

    // 6. Too-fast submission
    p = await page("/contact");
    await p.type("#f-name", "Speedy");
    await p.type("#f-email", "speedy@example.com");
    await p.select("#f-type", "other");
    await p.type("#f-message", "Fast bot-like submission test.");
    await p.click('button[type="submit"]');
    await p.waitForSelector('[role="alert"]');
    check("Submission faster than 3 s is held back with a clear message", (await text(p, '[role="alert"]')).includes("That was quick"));
    check("Values kept after too-fast rejection", (await value(p, "#f-email")) === "speedy@example.com");
    await p.close();

    // 7. Forged / withdrawn item
    p = await page("/contact?product=goodwe-gw6000-es-c10-hybrid-inverter");
    await sleep(3200);
    await p.type("#f-name", "Forger");
    await p.type("#f-email", "forger@example.com");
    await p.type("#f-message", "Testing a forged product reference.");
    // Tamper immediately before submitting, as a forged request would.
    await p.evaluate(() => {
      document.querySelector('input[name="item_slug"]').value = "not-a-real-product";
      document.querySelector("form").requestSubmit();
    });
    await p.waitForSelector('[role="alert"]');
    check("Forged/withdrawn item rejected and removed", (await p.content()).includes("no longer available") && (await p.$('input[name="item_slug"]')) === null);
    await p.close();

    // 8. Honeypot
    p = await page("/contact");
    await sleep(3200);
    await p.type("#f-name", "Bot");
    await p.type("#f-email", "bot@example.com");
    await p.select("#f-type", "other");
    await p.type("#f-message", "Spam spam spam spam.");
    await p.evaluate(() => {
      document.querySelector('input[name="website"]').value = "http://spam.example";
      document.querySelector("form").requestSubmit();
    });
    await sleep(1500);
    check("Honeypot submission gets a neutral response", !(await p.content()).includes("Please correct"));
    await p.close();
  }

  // 9. Product search and filters
  let p = await page("/products?q=goodwe");
  check("Search “goodwe” finds the GoodWe inverter", (await text(p, '[role="status"]')).startsWith("1 product"));
  await p.close();
  p = await page("/products?category=solar-panels&brand=Jinko%20Solar");
  check("Category + brand filter", (await text(p, '[role="status"]')).startsWith("1 product"));
  await p.close();
  p = await page("/products?q=zzzz");
  check("No-results state with recovery links", (await p.content()).includes("No products match your search") && (await p.content()).includes("Request a product quote"));
  await p.close();

  // 10. Package comparison via real checkbox clicks
  p = await page("/packages", 1280);
  const boxes = await p.$$("input[data-compare]");
  await boxes[0].click();
  await boxes[1].click();
  await boxes[2].click();
  const fourthDisabled = await boxes[3].evaluate((b) => b.disabled);
  check("Compare limits selection to 3", fourthDisabled);
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2" }), p.click('button[form="compare-form"]')]);
  check("Compare page shows a table with 3 packages", (await p.$$eval("table thead th", (t) => t.length)) === 3);
  await p.close();

  // 11. Mobile menu dialog: open, focus inside, Escape closes, focus returns
  p = await page("/", 375);
  await p.click('button[aria-controls="mobile-menu"]');
  check("Mobile menu opens as modal dialog", await p.$eval("#mobile-menu", (d) => d.open));
  check("Focus moves into the menu", await p.evaluate(() => document.getElementById("mobile-menu").contains(document.activeElement)));
  await p.keyboard.press("Escape");
  await sleep(200);
  check("Escape closes the menu", !(await p.$eval("#mobile-menu", (d) => d.open)));
  check("Focus returns to the menu button", await p.evaluate(() => document.activeElement?.getAttribute("aria-controls") === "mobile-menu"));
  await p.close();

  // 12. Promotion expiry handling
  p = await page("/packages/off-grid-starter-equipment-bundle");
  const html = await p.content();
  check("Ended promotion withdraws the price", html.includes("Promotion ended") && !html.includes("₱99,000"));
  await p.close();

  // 13. Preview protections
  const robots = await (await fetch(BASE + "/robots.txt")).text();
  check("robots.txt disallows everything in preview", /Disallow: \/\s*$/m.test(robots));
  const home = await fetch(BASE + "/");
  check("X-Robots-Tag noindex header in preview", (home.headers.get("x-robots-tag") ?? "").includes("noindex"));
  check("noindex meta in preview", (await home.text()).includes('name="robots" content="noindex, nofollow"'));
  const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
  check("Sitemap empty in preview", !sitemap.includes("<loc>"));
  check("Unknown package slug returns 404", (await fetch(BASE + "/packages/does-not-exist")).status === 404);

  // 14. Admin access without a session
  const adm = await fetch(BASE + "/admin", { redirect: "manual" });
  check("/admin without a session redirects to login", [303, 307, 308].includes(adm.status) || (await adm.text()).includes("/admin/login"), `status ${adm.status}`);
  const media = await fetch(BASE + "/admin/media/packages/00000000-0000-4000-8000-000000000201/00000000-0000-4000-8000-000000000001/640.webp");
  check("/admin/media without a session is refused", [401, 403].includes(media.status), `status ${media.status}`);
  const pub = await fetch(BASE + "/media/../../etc/passwd");
  check("Public media route rejects malformed paths", pub.status === 404);
} finally {
  await browser.close();
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
