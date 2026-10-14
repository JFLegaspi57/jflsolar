import type { MediaAsset } from "@/lib/types";

/** Public URL of a stored media variant (served by app/media/[...path]). */
export function mediaUrl(asset: Pick<MediaAsset, "storage_key">, file: string, scope: "public" | "admin" = "public") {
  return `${scope === "admin" ? "/admin/media" : "/media"}/${asset.storage_key}/${file}`;
}

/**
 * Responsive CMS image. Uses pre-generated WebP widths instead of the
 * next/image optimiser so unpublished media are withdrawn within the CDN TTL
 * (DECISIONS.md D4).
 */
export function MediaImage({
  asset,
  sizes,
  className = "",
  priority = false,
  scope = "public",
}: {
  asset: MediaAsset;
  sizes: string;
  className?: string;
  priority?: boolean;
  scope?: "public" | "admin";
}) {
  const widths = [...asset.widths].sort((a, b) => a - b);
  const largest = widths.at(-1) ?? 1280;
  const srcSet = widths.map((w) => `${mediaUrl(asset, `${w}.webp`, scope)} ${w}w`).join(", ");
  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional, see doc comment
    <img
      src={mediaUrl(asset, `${widths.find((w) => w >= 1280) ?? largest}.webp`, scope)}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={asset.alt}
      width={asset.width ?? undefined}
      height={asset.height ?? undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/**
 * Clearly labelled placeholder for missing imagery — never presented as a
 * real project photo.
 */
export function PlaceholderImage({
  label = "Placeholder image",
  detail,
  className = "",
  icon = "panel",
}: {
  label?: string;
  detail?: string;
  className?: string;
  icon?: "panel" | "inverter" | "battery" | "hardware";
}) {
  return (
    <div role="img" aria-label={`${label}${detail ? ` — ${detail}` : ""}`} className={`pv-grid relative flex h-full w-full items-end overflow-hidden ${className}`}>
      <PlaceholderGlyph kind={icon} />
      <span className="relative m-3 inline-flex items-center gap-1.5 rounded bg-white/95 px-2 py-1 text-[0.7rem] font-semibold tracking-wide text-steel-900 uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-500" />
        {label}
      </span>
    </div>
  );
}

function PlaceholderGlyph({ kind }: { kind: "panel" | "inverter" | "battery" | "hardware" }) {
  const common = { fill: "none", stroke: "rgb(255 255 255 / 0.28)", strokeWidth: 1.5 } as const;
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" className="absolute inset-0 m-auto h-1/2 w-1/2">
      {kind === "panel" && (
        <g {...common}>
          <path d="M20 62 34 18h52l14 44Z" />
          <path d="M27 40h66M24 51h72M48 18l-6 44M72 18l6 44" />
          <circle cx="98" cy="12" r="6" stroke="#ffb004" />
        </g>
      )}
      {kind === "inverter" && (
        <g {...common}>
          <rect x="38" y="12" width="44" height="56" rx="4" />
          <rect x="48" y="24" width="24" height="12" rx="2" />
          <path d="M50 58h4M58 58h4M66 58h4" />
        </g>
      )}
      {kind === "battery" && (
        <g {...common}>
          <rect x="36" y="14" width="48" height="54" rx="4" />
          <path d="M52 8h16v6H52zM60 30v18M51 39h18" />
        </g>
      )}
      {kind === "hardware" && (
        <g {...common}>
          <path d="M14 50h92M14 58h92M30 50v-14h14v14M76 50v-14h14v14" />
        </g>
      )}
    </svg>
  );
}
