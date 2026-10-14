import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/auth";
import { blockValues } from "@/lib/admin/values";
import { isStandardBlock, placementLabel } from "@/lib/admin/blocks";
import type { ContentBlock, MediaAsset } from "@/lib/types";
import { deleteBlock } from "@/app/admin/actions/site";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { ImageManager } from "@/components/admin/ImageManager";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";
import { BlockForm } from "@/components/admin/forms/SiteForms";

export const metadata = { title: "Edit content" };

export default function EditBlock({ params, searchParams }: PageProps<"/admin/content/[key]">) {
  return (
    <>
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/content/[key]">, "params">) {
  const key = decodeURIComponent((await params).key);
  const { db } = await requireStaffPage();
  const [{ data }, { data: media }] = await Promise.all([
    db.from("content_blocks").select("*").eq("key", key).maybeSingle(),
    db.from("media_assets").select("*").eq("content_block_key", key).order("sort_order"),
  ]);
  if (!data) notFound();
  const block = data as ContentBlock & { updated_at: string };
  return (
    <>
      <PageTitle title={block.title} back={{ href: "/admin/content", label: "Site content" }} />
      {block.claim_status !== "confirmed" && block.review_note && (
        <p className="mb-6 rounded-[var(--radius-control)] border border-[#f0d39a] bg-warn-50 px-4 py-3 text-sm text-warn-800">
          <strong>Needs confirmation:</strong> {block.review_note}
        </p>
      )}
      <BlockForm values={blockValues(block)} version={block.updated_at} isNew={false} placement={placementLabel(block.key, block.section)} />
      <div className="mb-28 space-y-8">
        <ImageManager
          owner={{ kind: "block", key: block.key }}
          images={(media ?? []) as MediaAsset[]}
          title={block.key === "about.founder" ? "Founder photo" : "Image (optional)"}
          guidance={block.key === "about.founder" ? "Use a recent portrait the founder has approved for publication." : "Optional image shown with this block. Only use images you have permission to publish."}
        />
        <section aria-labelledby="danger-title" className="rounded-[var(--radius-panel)] border border-[#f3c3be] bg-white p-5">
          <h2 id="danger-title" className="text-lg font-bold text-danger-700">
            Delete this block
          </h2>
          <p className="mt-1 text-sm text-steel-700">
            Permanently removes the text and any image. To hide it for now, untick “Show on the website” above instead.
            {isStandardBlock(block.key) && " This is a standard block: deleting it removes that part of the page."}
          </p>
          <div className="mt-3">
            <ConfirmSubmit
              action={deleteBlock.bind(null, block.key)}
              label="Delete block"
              title={`Delete “${block.title}”?`}
              body={<p>The text and any images in this block are permanently removed. This cannot be undone.</p>}
              confirmLabel="Delete block"
            />
          </div>
        </section>
      </div>
    </>
  );
}
