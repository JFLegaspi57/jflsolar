// Regenerates web brand assets from the owner-supplied logo files in
// docs/reference/. Only trims, pads and downsizes — the artwork is never redrawn.
// Usage: node scripts/build-brand-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC_H = "docs/reference/logo-horizontal-source.png";
const SRC_S = "docs/reference/logo-symbol-source.png";
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

await mkdir("public/brand", { recursive: true });

// Full horizontal lockup: trim the near-white margin, keep native resolution
// (710 px wide source; displayed at <= 240 CSS px, so it covers 2x screens).
const horizontal = sharp(SRC_H).flatten({ background: WHITE }).trim({ background: "#ffffff", threshold: 12 });
const hMeta = await horizontal.clone().png().toBuffer({ resolveWithObject: true });
await sharp(hMeta.data)
  .extend({ top: 6, bottom: 6, left: 6, right: 6, background: WHITE })
  .png({ compressionLevel: 9, palette: true, quality: 95 })
  .toFile("public/brand/jfl-solar-logo.png");

// Symbol: trim, then centre on a white square with breathing room.
const symTrim = await sharp(SRC_S).flatten({ background: WHITE }).trim({ background: "#ffffff", threshold: 12 }).png().toBuffer({ resolveWithObject: true });
const side = Math.round(Math.max(symTrim.info.width, symTrim.info.height) * 1.18);
const square = await sharp({ create: { width: side, height: side, channels: 4, background: WHITE } })
  .composite([{ input: symTrim.data, gravity: "centre" }])
  .png()
  .toBuffer();

await sharp(square).png({ compressionLevel: 9 }).toFile("public/brand/jfl-symbol.png");
// Favicon / app icons (downsized only; source is ~260 px).
await sharp(square).resize(192, 192).png({ compressionLevel: 9 }).toFile("app/icon.png");
await sharp(square).resize(180, 180).png({ compressionLevel: 9 }).toFile("app/apple-icon.png");

const out = await sharp("public/brand/jfl-solar-logo.png").metadata();
console.log("logo", out.width, "x", out.height, "| symbol square", side);
