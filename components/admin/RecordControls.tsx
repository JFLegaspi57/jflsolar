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
      <button
        type="submit"
        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-sm font-semibold ${featured ? "border-gold-500 bg-gold-500 text-steel-950 hover:bg-gold-400" : "border-steel-300 bg-white text-steel-900 hover:border-steel-900"}`}
        aria-pressed={featured}
        title={featured ? "Shown on the home page — click to remove" : "Click to show on the home page"}
      >
        <span aria-hidden="true">{featured ? "★" : "☆"}</span>
        {featured ? "Featured" : "Feature"}
        <span className="sr-only"> {name}</span>
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
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-gold-500 bg-gold-500 px-3 text-sm font-semibold text-steel-950 hover:bg-gold-400">
            Publish{label}
          </button>
        </form>
      )}
      {status === "published" && (
        <ConfirmSubmit
          tone="caution"
          action={go("draft")}
          label={<>Unpublish{label}</>}
          title={`Unpublish “${name}”?`}
          body={
            <p>
              It disappears from the public website straight away and becomes a draft you can keep editing. Publish it again at any time. (Photos
              already viewed may stay cached for up to 5 minutes.)
            </p>
          }
          confirmLabel="Unpublish"
        />
      )}
      {status !== "archived" ? (
        <ConfirmSubmit
          tone="caution"
          action={go("archived")}
          label={<>Archive{label}</>}
          title={`Archive “${name}”?`}
          body={
            <p>
              Use this for items you no longer offer. It is hidden from the website and moved to the <strong>Archived</strong> tab, where you can
              restore it as a draft or delete it permanently.
            </p>
          }
          confirmLabel="Archive"
        />
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
