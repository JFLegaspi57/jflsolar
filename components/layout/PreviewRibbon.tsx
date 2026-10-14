import { isProductionSite } from "@/lib/env";
import { getPublicSnapshot } from "@/lib/content/public";

/** Visible notice on non-production deployments (DECISIONS.md D5). */
export async function PreviewRibbon() {
  if (isProductionSite) return null;
  const { source } = await getPublicSnapshot();
  return (
    <div role="region" aria-label="Proposal preview notice" className="bg-steel-950 text-center text-xs leading-5 text-steel-100">
      <p className="mx-auto max-w-[76rem] px-4 py-1.5">
        <strong className="font-semibold text-gold-400">Proposal preview.</strong>{" "}
        <span className="sm:hidden">Sample content is labelled.{source === "demo" && " No database connected."}</span>
        <span className="hidden sm:inline">
          Sample packages, products and projects are labelled; claims marked “Awaiting confirmation” are not yet approved.
          {source === "demo" && " Demo content — no database connected."} Not indexed by search engines.
        </span>
      </p>
    </div>
  );
}
