// Regenerates web brand assets from the owner-supplied logo files in
// docs/reference/. Only trims, pads and downsizes — the artwork is never redrawn.
// Usage: node scripts/build-brand-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC_H = "docs/reference/logo-horizontal-source.png";
const SRC_S = "docs/reference/logo-symbol-source.png";
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

await mkdir("public/brand", { recursive: true });

// Full horizontal lockup: trim the margin, keep native resolution (the owner's
// high-resolution file, ~1120 px once trimmed; next/image serves smaller copies).
// Flatten in its own pass: within one pipeline sharp trims before flattening,
// and a transparent margin then never matches the white trim colour.
const flatH = await sharp(SRC_H).flatten({ background: WHITE }).png().toBuffer();
const horizontal = sharp(flatH).trim({ background: "#ffffff", threshold: 12 });
// The source sits on opaque white, which shows as a box over the translucent
// sticky header. "Colour to alpha" removes the white exactly (like GIMP's
// filter), so anti-aliased edges stay smooth on any light surface. Dark
// surfaces still use a white plate (the lettering is dark slate).
const { data: px, info } = await horizontal
  .clone()
  .extend({ top: 6, bottom: 6, left: 6, right: 6, background: WHITE })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < px.length; i += 4) {
  const a = Math.max(255 - px[i], 255 - px[i + 1], 255 - px[i + 2]) / 255;
  if (a === 0) {
    px[i + 3] = 0;
    continue;
  }
  for (let k = 0; k < 3; k++) px[i + k] = Math.round(255 - (255 - px[i + k]) / a);
  px[i + 3] = Math.round(a * 255);
}
await sharp(px, { raw: info }).png({ compressionLevel: 9 }).toFile("public/brand/jfl-solar-logo.png");

// Icon: the owner's circular badge (white circle with the symbol above a
// "JFL Solar" wordmark) is used whole. Trim the transparent margin and pad to
// a square, keeping the area outside the circle transparent.
const badge = await sharp(SRC_S).ensureAlpha().trim().png().toBuffer({ resolveWithObject: true });
const side = Math.max(badge.info.width, badge.info.height);
const square = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: badge.data, gravity: "centre" }])
  .png()
  .toBuffer();

await sharp(square).resize(512, 512).png({ compressionLevel: 9 }).toFile("public/brand/jfl-symbol.png");
// Browser-tab icon keeps the transparent corners, so it shows as a circle.
await sharp(square).resize(192, 192).png({ compressionLevel: 9 }).toFile("app/icon.png");
// iOS fills transparency with black, so the home-screen icon sits on white
// (the system rounds its corners).
await sharp(square).resize(180, 180).flatten({ background: WHITE }).png({ compressionLevel: 9 }).toFile("app/apple-icon.png");

const out = await sharp("public/brand/jfl-solar-logo.png").metadata();
console.log("logo", out.width, "x", out.height, "| icon badge", side);
