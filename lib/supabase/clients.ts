import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabasePublicKey, supabaseUrl } from "../env";
import { serviceRoleKey } from "../env.server";

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

/**
 * Cookie-less anonymous client for public, cacheable reads. RLS limits it to
 * publicly visible content. Safe inside "use cache" functions.
 */
export function createPublicClient(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  return createClient(supabaseUrl, supabasePublicKey, { auth: noSession });
}

/**
 * Session-bound client for admin pages, Server Actions and route handlers.
 * Every query runs as the signed-in user, so RLS enforces staff permissions.
 */
export async function createSessionClient(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component render: cookies are read-only there.
          // proxy.ts refreshes the session on admin requests instead.
        }
      },
    },
  });
}

/**
 * Service-role client: bypasses RLS. Used ONLY for the inquiry rate-limit RPC
 * (and the out-of-band admin bootstrap script). Never pass user input as SQL.
 */
export function createServiceClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: noSession });
}
