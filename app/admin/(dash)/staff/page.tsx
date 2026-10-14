import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { updateStaff } from "@/app/admin/actions/site";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";
import { AddStaffForm } from "@/components/admin/forms/SiteForms";

export const metadata = { title: "Staff" };

interface StaffRow {
  id: string;
  email: string;
  role: "owner" | "editor";
  active: boolean;
  display_name: string | null;
}


export default function StaffAdmin({ searchParams }: PageProps<"/admin/staff">) {
  return (
    <>
      <PageTitle
        title="Staff access"
        intro="Only people on this list can use the admin, and only after signing in with the matching Google account. Owners manage this list; editors manage content."
      />
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  const { db, staff } = await requireStaffPage({ owner: true });
  const { data } = await db.from("staff_members").select("id, email, role, active, display_name").order("role").order("email");
  const rows = (data ?? []) as StaffRow[];
  return (
    <div className="space-y-8">
      <ul className="divide-y divide-steel-200 rounded-[var(--radius-panel)] border border-steel-200 bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-bold break-all text-steel-950">
                {r.email} {r.email === staff.email.toLowerCase() && <span className="text-sm font-normal text-steel-600">(you)</span>}
              </p>
              <p className="text-sm text-steel-600">
                {r.display_name ? `${r.display_name} · ` : ""}
                <span className="capitalize">{r.role}</span> · {r.active ? "Active" : "Deactivated"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const self = r.email === staff.email.toLowerCase();
                const selfNote = self ? <p className="mt-2 font-semibold text-danger-700">This is your own account.</p> : null;
                const toRole = r.role === "owner" ? "editor" : "owner";
                return (
                  <>
                    <ConfirmSubmit
                      tone="caution"
                      action={updateStaff.bind(null, r.id, { role: toRole })}
                      label={
                        <>
                          Make {toRole}
                          <span className="sr-only"> {r.email}</span>
                        </>
                      }
                      title={`Make ${r.email} ${toRole === "owner" ? "an owner" : "an editor"}?`}
                      body={
                        <>
                          <p>
                            {toRole === "owner"
                              ? "Owners can manage content and the staff list, including removing other owners."
                              : "Editors can manage content but cannot change the staff list. If this is you, you will lose access to this page immediately."}
                          </p>
                          {selfNote}
                        </>
                      }
                      confirmLabel={`Make ${toRole}`}
                    />
                    <ConfirmSubmit
                      tone="caution"
                      action={updateStaff.bind(null, r.id, { active: !r.active })}
                      label={
                        <>
                          {r.active ? "Deactivate" : "Reactivate"}
                          <span className="sr-only"> {r.email}</span>
                        </>
                      }
                      title={`${r.active ? "Deactivate" : "Reactivate"} ${r.email}?`}
                      body={
                        <>
                          <p>
                            {r.active
                              ? "They will lose admin access immediately, but stay on the list so an owner can reactivate them later."
                              : "They will be able to sign in to the admin again with this Google account."}
                          </p>
                          {selfNote}
                        </>
                      }
                      confirmLabel={r.active ? "Deactivate" : "Reactivate"}
                    />
                    <ConfirmSubmit
                      action={updateStaff.bind(null, r.id, { remove: true })}
                      label={
                        <>
                          Remove<span className="sr-only"> {r.email}</span>
                        </>
                      }
                      title={`Remove ${r.email}?`}
                      body={
                        <>
                          <p>They will lose admin access immediately and be removed from the list. Their past edits are kept.</p>
                          {selfNote}
                        </>
                      }
                      confirmLabel="Remove access"
                    />
                  </>
                );
              })()}
            </div>
          </li>
        ))}
      </ul>
      <AddStaffForm />
      <p className="text-sm text-steel-600">The last active owner cannot be removed, deactivated or demoted. Only owners can change roles.</p>
    </div>
  );
}
