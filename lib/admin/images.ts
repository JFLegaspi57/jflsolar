import "server-only";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { IMAGE_WIDTHS, MAX_UPLOAD_BYTES } from "../media";

export interface ProcessedImage {
  variants: { width: number; data: Buffer }[];
  width: number;
  height: number;
  bytes: number;
}

const ACCEPTED = new Set(["jpeg", "png", "webp", "avif", "heif"]);

/**
 * Validates an uploaded image by decoding it (the browser-supplied MIME type
 * is not trusted), applies EXIF orientation, strips metadata and writes WebP
 * variants at fixed widths, never upscaling.
 */
export async function processImage(file: File): Promise<ProcessedImage | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "This image is larger than 4 MB. Please choose a smaller file." };
  const input = Buffer.from(await file.arrayBuffer());

  let meta: SharpMetadata;
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    return { error: "This file is not a supported image. Use JPEG, PNG, WebP or AVIF." };
  }
  if (!meta.format || !ACCEPTED.has(meta.format)) return { error: "Unsupported image type. Use JPEG, PNG, WebP or AVIF." };
  if ((meta.pages ?? 1) > 1 && meta.format !== "heif") return { error: "Animated images are not supported." };

  try {
    return await encode(input);
  } catch {
    return { error: "This image could not be processed. It may be damaged — try exporting it again as JPEG or PNG." };
  }
}

async function encode(input: Buffer): Promise<ProcessedImage | { error: string }> {
  const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate();
  const oriented = await base.clone().toBuffer({ resolveWithObject: true });
  const srcWidth = oriented.info.width;
  if (srcWidth < 320 || oriented.info.height < 200) return { error: "This image is too small. Use at least 320 × 200 pixels." };

  const widths = IMAGE_WIDTHS.filter((w, i) => w <= srcWidth || i === 0);
  const variants: ProcessedImage["variants"] = [];
  let largest = { width: 0, height: 0, bytes: 0 };
  for (const w of widths) {
    const out = await sharp(oriented.data)
      .resize({ width: Math.min(w, srcWidth), withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    variants.push({ width: w, data: out.data });
    if (out.info.width >= largest.width) largest = { width: out.info.width, height: out.info.height, bytes: out.info.size };
  }
  return { variants, ...largest };
}

/** Datasheets: real PDF (magic bytes), ≤ 4 MB. */
export async function readPdf(file: File): Promise<Buffer | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF file." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Datasheets must be 4 MB or smaller." };
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return { error: "This file is not a PDF." };
  return buf;
}
