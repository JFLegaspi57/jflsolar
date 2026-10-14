import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/clients";

/** OAuth (PKCE) callback. Always lands on /admin — no caller-controlled redirect target. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/admin", request.nextUrl.origin);
  if (!isSupabaseConfigured || !code) {
    target.pathname = "/admin/login";
    target.searchParams.set("reason", "error");
    return NextResponse.redirect(target, 303);
  }
  const db = await createSessionClient();
  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) {
    target.pathname = "/admin/login";
    target.searchParams.set("reason", "error");
  }
  return NextResponse.redirect(target, 303);
}
