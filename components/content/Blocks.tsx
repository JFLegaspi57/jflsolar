import { isProductionSite } from "@/lib/env";
import type { ContentBlock } from "@/lib/types";
import { PendingBadge } from "@/components/ui/Badge";

/** Plain-text body → paragraphs (blank line separated). No HTML is rendered. */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={`prose-copy ${className}`}>
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Shows an "Awaiting confirmation" marker on unconfirmed copy (preview only). */
export function ClaimMarker({ block, className = "" }: { block: Pick<ContentBlock, "claim_status">; className?: string }) {
  if (isProductionSite || block.claim_status === "confirmed") return null;
  return (
    <span className={`block ${className}`}>
      <PendingBadge />
    </span>
  );
}
