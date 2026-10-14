const notices: Record<string, string> = {
  created: "Draft created. Add images below, then publish when ready.",
  published: "Published. It is now visible on the public website.",
  draft: "Unpublished. It is now a draft and hidden from the public website.",
  archived: "Archived. It is hidden from the public website and can be restored or permanently deleted.",
  deleted: "Permanently deleted.",
  featured: "Marked as featured.",
  unfeatured: "Removed from featured.",
  reordered: "Order updated.",
  saved: "Saved.",
  staff_updated: "Staff list updated.",
  owners_only: "That page is available to owners only.",
};

const errors: Record<string, string> = {
  auth: "Your session expired or you no longer have access. Sign in again.",
  invalid: "That request was not valid.",
  missing: "That item no longer exists.",
  save_failed: "The change could not be saved. Please try again.",
  in_use: "This item is still in use (for example, a category that still has products). Move or delete those first.",
  not_archived: "Archive an item before deleting it permanently.",
  media_delete_failed: "Stored images could not be removed, so the item was not deleted. Please try again.",
  last_owner: "You cannot remove, deactivate or demote the last active owner.",
};

export async function Notice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const n = typeof sp.notice === "string" ? notices[sp.notice] : undefined;
  const e = typeof sp.error === "string" ? errors[sp.error] : undefined;
  if (!n && !e) return null;
  return e ? (
    <p role="alert" className="mb-6 rounded-[var(--radius-control)] border-2 border-danger-700 bg-danger-50 px-4 py-3 font-semibold text-danger-700">
      {e}
    </p>
  ) : (
    <p role="status" className="mb-6 rounded-[var(--radius-control)] border border-[#b7e2c6] bg-ok-50 px-4 py-3 font-semibold text-ok-700">
      {n}
    </p>
  );
}
