import { isSupabaseConfigured } from "@/lib/env";
import { MEDIA_BUCKET, parseMediaPath } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/clients";

/**
 * Public media. Reads with the anonymous key, so Storage RLS only releases
 * files whose record is publicly visible (DECISIONS.md D4). Short CDN cache so
 * unpublished media disappear within ~5 minutes.
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path } = await ctx.params;
  const parsed = parseMediaPath(path);
  if (!parsed || !isSupabaseConfigured) return new Response("Not found", { status: 404 });

  const { data, error } = await createPublicClient().storage.from(MEDIA_BUCKET).download(parsed.path);
  if (error || !data) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } });

  return new Response(data.stream(), {
    headers: {
      "Content-Type": parsed.contentType,
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
      ...(parsed.contentType === "application/pdf" ? { "Content-Disposition": "inline; filename=datasheet.pdf" } : {}),
    },
  });
}
