import { checkStaff } from "@/lib/admin/auth";
import { MEDIA_BUCKET, parseMediaPath } from "@/lib/media";

/** Staff-only media (includes drafts). Never cached by shared caches. */
export async function GET(_req: Request, ctx: RouteContext<"/admin/media/[...path]">) {
  const { path } = await ctx.params;
  const parsed = parseMediaPath(path);
  const noStore = { "Cache-Control": "private, no-store" };
  if (!parsed) return new Response("Not found", { status: 404, headers: noStore });
  const res = await checkStaff();
  if (res.state !== "ok") return new Response("Forbidden", { status: res.state === "signed_out" ? 401 : 403, headers: noStore });
  const { data, error } = await res.db.storage.from(MEDIA_BUCKET).download(parsed.path);
  if (error || !data) return new Response("Not found", { status: 404, headers: noStore });
  return new Response(data.stream(), { headers: { ...noStore, "Content-Type": parsed.contentType, "X-Content-Type-Options": "nosniff" } });
}
