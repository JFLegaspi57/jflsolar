import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../env";
import { createSessionClient } from "../supabase/clients";

export type StaffRole = "owner" | "editor";

export interface Staff {
  userId: string;
  email: string;
  role: StaffRole;
}

export type StaffCheck =
  | { state: "ok"; staff: Staff; db: SupabaseClient }
  | { state: "unconfigured" }
  | { state: "signed_out" }
  | { state: "denied"; email: string | null };

/**
 * Server-side staff check. `getUser()` validates the session with Supabase
 * Auth (not just the cookie); the role comes from the `current_staff_role()`
 * database function, i.e. the same allowlist RLS uses.
 */
export async function checkStaff(): Promise<StaffCheck> {
  await connection(); // always evaluated per request, never prerendered
  if (!isSupabaseConfigured) return { state: "unconfigured" };
  const db = await createSessionClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return { state: "signed_out" };
  const { data: role, error: roleError } = await db.rpc("current_staff_role");
  if (roleError || (role !== "owner" && role !== "editor")) return { state: "denied", email: data.user.email ?? null };
  return { state: "ok", staff: { userId: data.user.id, email: data.user.email ?? "", role }, db };
}

/** For admin pages: redirect anyone who is not active staff. */
export async function requireStaffPage(options: { owner?: boolean } = {}) {
  const res = await checkStaff();
  if (res.state === "unconfigured") redirect("/admin/login");
  if (res.state === "signed_out") redirect("/admin/login?reason=signed_out");
  if (res.state === "denied") redirect("/admin/access-denied");
  if (options.owner && res.staff.role !== "owner") redirect("/admin?notice=owners_only");
  return res;
}

export type ActionGuard =
  | { ok: true; staff: Staff; db: SupabaseClient }
  | { ok: false; message: string };

/**
 * For Server Actions: never redirect (so the form keeps the user's input);
 * return a clear message instead. Every admin action must call this first.
 */
export async function requireStaffAction(options: { owner?: boolean } = {}): Promise<ActionGuard> {
  const res = await checkStaff();
  if (res.state === "unconfigured") return { ok: false, message: "The database is not configured." };
  if (res.state === "signed_out")
    return { ok: false, message: "Your session has expired. Sign in again in a new tab, then come back and save — your changes are still on this page." };
  if (res.state === "denied") return { ok: false, message: "Your account does not have staff access." };
  if (options.owner && res.staff.role !== "owner") return { ok: false, message: "Only owners can do this." };
  return { ok: true, staff: res.staff, db: res.db };
}
