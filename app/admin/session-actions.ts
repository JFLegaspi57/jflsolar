"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/clients";

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Starts Google sign-in. The callback URL must also be on Supabase's Redirect
 * URLs allow-list, so a spoofed Host header cannot redirect elsewhere.
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const db = await createSessionClient();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback`, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect("/admin/login?reason=error");
  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const db = await createSessionClient();
    await db.auth.signOut();
  }
  redirect("/admin/login?reason=signed_out");
}
