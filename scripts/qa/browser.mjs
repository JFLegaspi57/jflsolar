// Headless browser QA helper using the locally installed Chrome/Edge.
//   node scripts/qa/browser.mjs shot <outDir> <width> <path...>     full-page screenshots
//   node scripts/qa/browser.mjs axe <path...>                        axe-core WCAG 2.2 AA scan
//   node scripts/qa/browser.mjs overflow <width> <path...>           horizontal-overflow check
// BASE_URL defaults to http://localhost:3000
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const candidates = [
  process.env.BROWSER_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));

const [cmd, ...args] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });

async function open(path, width, height = 900) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  // "load" + a short settle: networkidle never settles on deployments with prefetching.
  const res = await page.goto(BASE + path, { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector("main", { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));
  return { page, status: res?.status() };
}

try {
  if (cmd === "shot") {
    const [outDir, width, ...paths] = args;
    mkdirSync(outDir, { recursive: true });
    for (const p of paths) {
      const { page, status } = await open(p, Number(width));
      const file = join(outDir, `${p.replace(/[^a-z0-9]+/gi, "_") || "home"}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(status, file);
      await page.close();
    }
  } else if (cmd === "axe") {
    const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
    let total = 0;
    for (const p of args) {
      for (const width of [375, 1280]) {
        const { page } = await open(p, width);
        await page.addScriptTag({ content: axeSource });
        const result = await page.evaluate(async () =>
          axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }),
        );
        for (const v of result.violations) {
          total++;
          console.log(`[${width}] ${p} ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`);
          for (const n of v.nodes.slice(0, 3)) console.log(`    ${n.target.join(" ")} — ${n.failureSummary?.split("\n")[1] ?? ""}`);
        }
        await page.close();
      }
    }
    console.log(total ? `${total} violation groups` : "axe: no violations");
    process.exitCode = total ? 1 : 0;
  } else if (cmd === "overflow") {
    const [width, ...paths] = args;
    for (const p of paths) {
      const { page, status } = await open(p, Number(width), 700);
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      console.log(`${status} ${p} @${width}: scrollWidth ${r.sw} vs ${r.cw}${r.sw > r.cw ? "  << OVERFLOW" : ""}`);
      await page.close();
    }
  } else {
    console.log("usage: shot|axe|overflow");
  }
} finally {
  await browser.close();
}
