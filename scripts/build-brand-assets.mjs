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

// Symbol: the owner's icon file stacks the symbol above a "JFL Solar" wordmark,
// which is unreadable at favicon size. Keep only the first band of artwork
// (rows down to the first fully blank gap), then trim and centre it on a white
// square with breathing room.
const flat = await sharp(SRC_S).flatten({ background: WHITE }).raw().toBuffer({ resolveWithObject: true });
const { width: sw, height: sh, channels: sc } = flat.info;
const inkRow = (y) => {
  for (let x = 0; x < sw; x++) {
    const i = (y * sw + x) * sc;
    if (flat.data[i] < 200 || flat.data[i + 2] < 200) return true;
  }
  return false;
};
// Bands of rows containing artwork, separated by fully blank rows. The last
// band is the wordmark; everything above it (including any detached sun ray)
// is the symbol.
const bands = [];
for (let y = 0, start = -1; y <= sh; y++) {
  const ink = y < sh && inkRow(y);
  if (ink && start < 0) start = y;
  if (!ink && start >= 0) {
    bands.push([start, y - 1]);
    start = -1;
  }
}
if (bands.length < 2) {
  throw new Error(`${SRC_S}: expected the symbol above a wordmark with a blank gap between them; found ${bands.length} band(s). Crop the file by hand.`);
}
const end = bands.at(-2)[1];
// Two passes: sharp applies trim before extract within a single pipeline.
const symBand = await sharp(flat.data, { raw: flat.info })
  .extract({ left: 0, top: 0, width: sw, height: Math.min(sh, end + 1) })
  .png()
  .toBuffer();
const symTrim = await sharp(symBand)
  .trim({ background: "#ffffff", threshold: 12 })
  .png()
  .toBuffer({ resolveWithObject: true });
const side = Math.round(Math.max(symTrim.info.width, symTrim.info.height) * 1.18);
const square = await sharp({ create: { width: side, height: side, channels: 4, background: WHITE } })
  .composite([{ input: symTrim.data, gravity: "centre" }])
  .png()
  .toBuffer();

await sharp(square).png({ compressionLevel: 9 }).toFile("public/brand/jfl-symbol.png");
// Favicon / app icons (downsized only).
await sharp(square).resize(192, 192).png({ compressionLevel: 9 }).toFile("app/icon.png");
await sharp(square).resize(180, 180).png({ compressionLevel: 9 }).toFile("app/apple-icon.png");

const out = await sharp("public/brand/jfl-solar-logo.png").metadata();
console.log("logo", out.width, "x", out.height, "| symbol square", side);
