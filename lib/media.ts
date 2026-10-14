// Media storage layout: `<entity>/<entity id>/<asset id>/<file>`
// files: `<width>.webp` for images, `datasheet.pdf` for datasheets.

export const MEDIA_BUCKET = "media";
export const IMAGE_WIDTHS = [640, 1280, 2000] as const;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const OBJECT_RE = new RegExp(`^(packages|products|projects|blocks)/${UUID}/${UUID}/(640\\.webp|1280\\.webp|2000\\.webp|datasheet\\.pdf)$`);

/** Validate a requested object path; returns null if it is not a well-formed media path. */
export function parseMediaPath(segments: string[]): { path: string; contentType: string } | null {
  const path = segments.join("/");
  if (!OBJECT_RE.test(path)) return null;
  return { path, contentType: path.endsWith(".pdf") ? "application/pdf" : "image/webp" };
}

export type MediaEntity = "packages" | "products" | "projects" | "blocks";
