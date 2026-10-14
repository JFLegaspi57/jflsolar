// Captures admin screenshots for UX review. Opens a visible Chrome window with a
// throwaway profile; YOU sign in with Google in that window (the script never
// sees credentials). Once /admin loads, it captures every admin page at 1280 px
// and 390 px, full length, split into segments.
//   BASE_URL=https://jflsolar.vercel.app node scripts/qa/admin-shots.mjs <outDir> <profileDir>
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL || "https://jflsolar.vercel.app";
const [out, profile] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const exe = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Launch a NORMAL Chrome (no automation flags, nothing attached) so Google sign-in
// behaves as usual. We only poll the tab list over the local DevTools HTTP port and
// attach after the user has reached a signed-in admin page.
const PORT = 9333;
const { spawn } = await import("node:child_process");
spawn(exe, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--window-size=1100,900", BASE + "/admin"], {
  detached: true,
  stdio: "ignore",
}).unref();
console.log("WAITING_FOR_SIGN_IN: sign in with Google in the Chrome window that opened.");
const deadline = Date.now() + 15 * 60 * 1000;
let lastLog = 0;
for (;;) {
  if (Date.now() > deadline) throw new Error("Timed out waiting for sign-in");
  const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).catch(() => []);
  const urls = tabs.filter((t) => t.type === "page").map((t) => t.url);
  const done = urls.some((u) => {
    try {
      const { host, pathname } = new URL(u);
      return host === new URL(BASE).host && pathname.startsWith("/admin") && !/login|access-denied/.test(pathname);
    } catch {
      return false;
    }
  });
  if (done) break;
  if (Date.now() - lastLog > 20000) {
    console.log("still waiting; tabs:", urls.join(" | ") || "(browser not reachable)");
    lastLog = Date.now();
  }
  await sleep(2000);
}
await sleep(3000);
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${PORT}`, defaultViewport: null, protocolTimeout: 180000 });
const work = (await browser.pages()).find((p) => p.url().includes("/admin")) ?? (await browser.newPage());
console.log("SIGNED_IN — capturing");

/** Navigation with retries: client-side redirects/prefetches can abort a goto. */
async function go(url) {
  for (let i = 0; i < 4; i++) {
    try {
      await work.goto(url, { waitUntil: "load", timeout: 60000 });
      return;
    } catch (e) {
      if (i === 3) throw e;
      await sleep(1500);
    }
  }
}

// Discover a few record URLs from the lists.
async function firstEdit(path) {
  await go(BASE + path);
  await sleep(1500);
  return work.evaluate((p) => [...document.querySelectorAll(`a[href^="${p}/"]`)].map((a) => a.getAttribute("href")).find((h) => !h.endsWith("/new")), path);
}
const pkg = await firstEdit("/admin/packages");
const prod = await firstEdit("/admin/products");
const proj = await firstEdit("/admin/projects");
const cat = await firstEdit("/admin/categories");

const targets = [
  ["overview", "/admin"],
  ["packages-list", "/admin/packages"],
  ["packages-archived", "/admin/packages?view=archived"],
  ["package-new", "/admin/packages/new"],
  ["package-edit", pkg],
  ["package-preview", pkg && pkg.replace("/admin/packages/", "/admin/preview/packages/")],
  ["products-list", "/admin/products"],
  ["product-edit", prod],
  ["categories-list", "/admin/categories"],
  ["category-edit", cat],
  ["projects-list", "/admin/projects"],
  ["project-edit", proj],
  ["content-list", "/admin/content"],
  ["content-founder", "/admin/content/about.founder"],
  ["settings", "/admin/settings"],
  ["staff", "/admin/staff"],
].filter(([, p]) => p);

const SEG = 1500;
async function capture(name, width) {
  const scaleTo = width > 500 ? 960 : 390;
  const buf = Buffer.from(await work.screenshot({ fullPage: true }));
  const resized = await sharp(buf).resize({ width: scaleTo }).toBuffer();
  const { height } = await sharp(resized).metadata();
  for (let top = 0, i = 1; top < height; top += SEG, i++) {
    const h = Math.min(SEG, height - top);
    await sharp(resized).extract({ left: 0, top, width: scaleTo, height: h }).png({ compressionLevel: 9 }).toFile(join(out, `admin-${name}-${width > 500 ? "desktop" : "mobile"}-${i}.png`));
  }
}

for (const width of [1280, 390]) {
  await work.setViewport({ width, height: 900 });
  for (const [name, path] of targets) {
    await go(BASE + path);
    await sleep(1800);
    await capture(name, width);
  }
  // Validation error state on a new package (nothing is saved: required name missing).
  await go(BASE + "/admin/packages/new");
  await sleep(1500);
  await work.evaluate(() => {
    const f = [...document.querySelectorAll("form[data-admin-form]")].find((x) => x.offsetParent !== null);
    [...f.querySelectorAll("button[type=submit]")].find((b) => b.textContent.trim() === "Save as draft").click();
  });
  await sleep(4000);
  await capture("package-new-validation-error", width);
}

await browser.close();
console.log("DONE");
