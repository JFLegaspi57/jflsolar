import Link from "next/link";
import type { ReactNode } from "react";
import type { Entity } from "@/app/admin/actions/records";
import { ViewTabs } from "./PageTitle";
import { FeaturedToggle, MoveButtons, SampleTag, StatusControls, StatusPill } from "./RecordControls";

export interface RecordRow {
  id: string;
  name: string;
  status: string;
  isSample?: boolean;
  featured?: boolean;
  subtitle?: ReactNode;
  badges?: ReactNode;
}

export function RecordList({ entity, rows, archived, emptyText, featurable = true }: { entity: Entity; rows: RecordRow[]; archived: boolean; emptyText: string; featurable?: boolean }) {
  return (
    <>
      <ViewTabs base={`/admin/${entity}`} active={archived ? "archived" : "current"} />
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-panel)] border border-dashed border-steel-300 bg-white p-8 text-center text-steel-700">
          {archived ? "Nothing archived." : emptyText}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.id} className="rounded-[var(--radius-panel)] border border-steel-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={r.status} />
                    {r.isSample && <SampleTag />}
                    {r.badges}
                  </div>
                  <h2 className="mt-1.5 text-lg font-bold break-words text-steel-950">
                    <Link href={`/admin/${entity}/${r.id}`} className="underline-offset-2 hover:underline">
                      {r.name}
                    </Link>
                  </h2>
                  {r.subtitle && <p className="text-sm text-steel-600">{r.subtitle}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {!archived && featurable && <FeaturedToggle entity={entity} id={r.id} name={r.name} featured={Boolean(r.featured)} />}
                  {!archived && <MoveButtons entity={entity} id={r.id} name={r.name} first={i === 0} last={i === rows.length - 1} />}
                  <Link href={`/admin/${entity}/${r.id}`} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-4 text-sm font-semibold text-white hover:bg-steel-800">
                    Edit<span className="sr-only"> {r.name}</span>
                  </Link>
                </div>
              </div>
              <div className="mt-3 border-t border-steel-100 pt-3">
                <StatusControls entity={entity} id={r.id} name={r.name} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
