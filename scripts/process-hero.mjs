// Builds the home hero photo from the owner-supplied banner (docs/reference/hero-source.png):
// crops off the footer bars, removes the overlaid headline/subtitle and the baked-in
// logo by seamless sky fill (patch from above + Poisson boundary correction), then
// applies a light enhancement. Usage: node scripts/process-hero.mjs
import sharp from "sharp";

const SRC = "docs/reference/hero-source.png";
const OUT = "public/images/hero-rooftop.jpg";
const PHOTO_HEIGHT = 469; // footer bars start at y≈470

// Regions to remove (x0, y0, x1, y1, source offset dx/dy) — generous padding covers text shadows.
const REGIONS = [
  { x0: 355, y0: 118, x1: 925, y1: 204, dx: 0, dy: -100 }, // headline + subtitle
  // logo: sky at the same height to the left (already cleaned), so brightness matches
  { x0: 962, y0: 74, x1: 1256, y1: 172, dx: -300, dy: 0 }, // logo lockup
];

const { data, info } = await sharp(SRC)
  .removeAlpha()
  .extract({ left: 0, top: 0, width: 1280, height: PHOTO_HEIGHT })
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const img = Float32Array.from(data);

for (const r of REGIONS) {
  const w = r.x1 - r.x0;
  const h = r.y1 - r.y0;
  for (let c = 0; c < 3; c++) {
    // D = target - source on the boundary; solve Laplace(D) = 0 inside; fill = source + D.
    const src = (x, y) => img[((y + r.dy) * W + (x + r.dx)) * 3 + c];
    const tgt = (x, y) => img[(y * W + x) * 3 + c];
    const D = new Float32Array((w + 2) * (h + 2));
    const idx = (i, j) => j * (w + 2) + i; // i,j in padded local coords
    for (let j = 0; j < h + 2; j++) {
      for (let i = 0; i < w + 2; i++) {
        const x = r.x0 - 1 + i;
        const y = r.y0 - 1 + j;
        const boundary = i === 0 || j === 0 || i === w + 1 || j === h + 1;
        D[idx(i, j)] = boundary ? tgt(x, y) - src(x, y) : 0;
      }
    }
    for (let it = 0; it < 3000; it++) {
      for (let j = 1; j <= h; j++) {
        for (let i = 1; i <= w; i++) {
          D[idx(i, j)] = 0.25 * (D[idx(i - 1, j)] + D[idx(i + 1, j)] + D[idx(i, j - 1)] + D[idx(i, j + 1)]);
        }
      }
    }
    for (let j = 1; j <= h; j++) {
      for (let i = 1; i <= w; i++) {
        const x = r.x0 - 1 + i;
        const y = r.y0 - 1 + j;
        img[(y * W + x) * 3 + c] = Math.max(0, Math.min(255, src(x, y) + D[idx(i, j)]));
      }
    }
  }
}

await sharp(Buffer.from(Uint8ClampedArray.from(img)), { raw: { width: W, height: H, channels: 3 } })
  .resize({ width: 1920, kernel: "lanczos3" })
  .modulate({ saturation: 1.08, brightness: 1.02 })
  .sharpen({ sigma: 0.9, m1: 0.6, m2: 1.5 })
  .jpeg({ quality: 84, mozjpeg: true, progressive: true })
  .toFile(OUT);

const m = await sharp(OUT).metadata();
console.log(`wrote ${OUT} ${m.width}x${m.height}`);
