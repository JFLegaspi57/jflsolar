// Builds the home hero photo from the owner-supplied clean rooftop photo
// (docs/reference/hero-source.jpg — no overlaid text, so nothing is removed).
// Keeps the native resolution (never upscales) and applies a light enhancement.
// Usage: node scripts/process-hero.mjs
import sharp from "sharp";

const SRC = "docs/reference/hero-source.jpg";
const OUT = "public/images/hero-rooftop.jpg";

const out = await sharp(SRC)
  .rotate()
  .modulate({ saturation: 1.06, brightness: 1.01 })
  .sharpen({ sigma: 0.6, m1: 0.5, m2: 1.2 })
  .jpeg({ quality: 86, mozjpeg: true, progressive: true })
  .toFile(OUT);
console.log("hero", out.width, "x", out.height, Math.round(out.size / 1024), "KB");
