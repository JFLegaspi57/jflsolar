// Captures review screenshots (desktop + mobile) and splits long pages into
// segments small enough to attach to a reviewer prompt.
//   BASE_URL=http://localhost:3000 node scripts/qa/ux-shots.mjs <outDir>
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const exe = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const pages = [
  ["home", "/"],
  ["services", "/services"],
  ["packages", "/packages"],
  ["package-detail", "/packages/trio-6kw-hybrid-equipment-bundle"],
  ["package-ended-promo", "/packages/off-grid-starter-equipment-bundle"],
  ["compare", "/packages/compare?p=trio-6kw-hybrid-equipment-bundle&p=residential-hybrid-system-6kw-installed&p=commercial-on-grid-system"],
  ["products", "/products"],
  ["product-detail", "/products/goodwe-gw6000-es-c10-hybrid-inverter"],
  ["projects", "/projects"],
  ["project-detail", "/projects/sample-residential-hybrid-rooftop"],
  ["about", "/about"],
  ["contact", "/contact?package=trio-6kw-hybrid-equipment-bundle"],
  ["not-found", "/packages/does-not-exist"],
  ["admin-login", "/admin/login"],
];
const SEG = 1500;
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const files = [];
try {
  for (const [name, path] of pages) {
    for (const [label, width, scaleTo] of [["desktop", 1280, 960], ["mobile", 390, 390]]) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      await page.goto(BASE + path, { waitUntil: "load", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1200));
      const buf = Buffer.from(await page.screenshot({ fullPage: true }));
      await page.close();
      const img = sharp(buf).resize({ width: scaleTo });
      const { height } = await img.metadata().then(async () => (await sharp(await img.toBuffer()).metadata()));
      const full = await img.toBuffer();
      // Desktop: whole page in segments. Mobile: first two screens (journeys/layout), rest skipped to limit volume.
      const limit = label === "mobile" ? Math.min(height, 1700) : height;
      for (let top = 0, i = 1; top < limit; top += SEG, i++) {
        const h = Math.min(SEG, limit - top);
        const f = join(out, `${name}-${label}-${i}.png`);
        await sharp(full).extract({ left: 0, top, width: scaleTo, height: h }).png({ compressionLevel: 9 }).toFile(f);
        files.push(f);
      }
    }
  }
} finally {
  await browser.close();
}
console.log(files.length + " images");
console.log(files.join("\n"));
