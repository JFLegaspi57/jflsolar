import { deleteRecord, moveRecord, setStatus, toggleFeatured, type Entity } from "@/app/admin/actions/records";
import { ConfirmSubmit } from "./ConfirmSubmit";

const small =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-steel-300 bg-white px-3 text-sm font-semibold text-steel-900 hover:border-steel-900 disabled:opacity-40";

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-ok-50 text-ok-700 border-[#b7e2c6]",
    draft: "bg-steel-100 text-steel-800 border-steel-300",
    archived: "bg-white text-steel-600 border-steel-300 border-dashed",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

export function SampleTag() {
  return <span className="inline-flex rounded-full border border-dashed border-steel-500 px-2 py-0.5 text-xs font-semibold text-steel-700">Sample</span>;
}

export function MoveButtons({ entity, id, name, first, last }: { entity: Entity; id: string; name: string; first: boolean; last: boolean }) {
  return (
    <div className="flex gap-1">
      <form action={moveRecord.bind(null, entity, id, "up")}>
        <button type="submit" disabled={first} className={`${small} w-11 px-0`} aria-label={`Move ${name} up`}>
          ↑
        </button>
      </form>
      <form action={moveRecord.bind(null, entity, id, "down")}>
        <button type="submit" disabled={last} className={`${small} w-11 px-0`} aria-label={`Move ${name} down`}>
          ↓
        </button>
      </form>
    </div>
  );
}

export function FeaturedToggle({ entity, id, name, featured }: { entity: Entity; id: string; name: string; featured: boolean }) {
  return (
    <form action={toggleFeatured.bind(null, entity, id, !featured)}>
      <button type="submit" className={`${small} w-11 px-0 text-lg ${featured ? "border-gold-500 bg-gold-50" : ""}`} aria-pressed={featured} aria-label={`Featured: ${name}`}>
        <span aria-hidden="true">{featured ? "★" : "☆"}</span>
      </button>
    </form>
  );
}

/** Publish / unpublish / archive / restore / delete controls for one record. */
export function StatusControls({ entity, id, name, status, returnTo = "list" }: { entity: Entity; id: string; name: string; status: string; returnTo?: "list" | "edit" }) {
  const go = (s: "draft" | "published" | "archived") => setStatus.bind(null, entity, id, s, returnTo);
  const label = <span className="sr-only"> {name}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "draft" && (
        <form action={go("published")}>
          <button type="submit" className={`${small} border-gold-500 bg-gold-500 text-steel-950 hover:bg-gold-400`}>
            Publish{label}
          </button>
        </form>
      )}
      {status === "published" && (
        <form action={go("draft")}>
          <button type="submit" className={small}>
            Unpublish{label}
          </button>
        </form>
      )}
      {status !== "archived" ? (
        <form action={go("archived")}>
          <button type="submit" className={small}>
            Archive{label}
          </button>
        </form>
      ) : (
        <>
          <form action={go("draft")}>
            <button type="submit" className={small}>
              Restore as draft{label}
            </button>
          </form>
          <ConfirmSubmit
            action={deleteRecord.bind(null, entity, id)}
            label={<>Delete permanently{label}</>}
            title={`Delete “${name}” permanently?`}
            body={<p>This removes the item and all of its images and files. It cannot be undone. Archived items stay hidden without being deleted.</p>}
            confirmLabel="Delete permanently"
          />
        </>
      )}
    </div>
  );
}
