import Link from "next/link";
import type { ReactNode } from "react";
import type { Entity } from "@/app/admin/actions/records";
import { SampleTag, StatusControls, StatusPill } from "./RecordControls";

/** Status summary + lifecycle controls shown above an edit form. */
export function EditHeader({
  entity,
  id,
  name,
  status,
  isSample,
  publicHref,
  previewHref,
  children,
}: {
  entity: Entity;
  id: string;
  name: string;
  status: string;
  isSample?: boolean;
  publicHref?: string;
  previewHref?: string;
  children?: ReactNode;
}) {
  return (
    <section aria-label="Status" className="mb-8 rounded-[var(--radius-panel)] border border-steel-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={status} />
        {isSample && <SampleTag />}
        {previewHref && (
          <Link href={previewHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-steel-900 underline">
            Preview full page
          </Link>
        )}
        {publicHref && status === "published" && (
          <Link href={publicHref} target="_blank" rel="noopener" className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold text-steel-900 underline">
            View live page<span className="sr-only"> (opens in a new tab)</span>
          </Link>
        )}
      </div>
      {children}
      <div className="mt-3 border-t border-steel-100 pt-3">
        <StatusControls entity={entity} id={id} name={name} status={status} returnTo="edit" />
      </div>
    </section>
  );
}
