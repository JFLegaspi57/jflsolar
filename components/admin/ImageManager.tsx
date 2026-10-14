"use client";

import { useActionState, useRef, useState } from "react";
import { imageOperation, replaceImage, updateImageText, uploadImage, type MediaOwner } from "@/app/admin/actions/media";
import { initialFormState, type AdminFormState } from "@/lib/admin/form";
import type { MediaAsset } from "@/lib/types";
import { useUnsavedGuard } from "./useUnsavedGuard";

const MAX_DIM = 2560;
const TARGET_BYTES = 3.5 * 1024 * 1024;
const btn =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-steel-300 bg-white px-3 text-sm font-semibold text-steel-900 hover:border-steel-900 disabled:opacity-40";
const input = "min-h-11 w-full rounded-[var(--radius-control)] border border-steel-400 bg-white px-3 text-base";

/**
 * Downsizes large photos in the browser so uploads stay under the server
 * limit. The server still validates and re-encodes everything.
 */
async function prepare(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= TARGET_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // the server will report an unreadable file
  }
}

function FilePicker({
  name = "file",
  id,
  required = true,
  onPrepared,
  describedBy,
}: {
  name?: string;
  id: string;
  required?: boolean;
  onPrepared?: (url: string | null) => void;
  describedBy?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        required={required}
        aria-invalid={describedBy ? true : undefined}
        aria-describedby={describedBy}
        className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-[var(--radius-control)] file:border-0 file:bg-steel-900 file:px-4 file:font-semibold file:text-white"
        onChange={async (e) => {
          const el = e.currentTarget;
          const f = el.files?.[0];
          if (!f) return onPrepared?.(null);
          setBusy(true);
          const ready = await prepare(f);
          if (ready !== f) {
            const dt = new DataTransfer();
            dt.items.add(ready);
            el.files = dt.files;
          }
          onPrepared?.(URL.createObjectURL(ready));
          setBusy(false);
        }}
      />
      {busy && <p className="mt-1 text-sm text-steel-600" role="status">Preparing image…</p>}
    </>
  );
}

function Result({ state }: { state: AdminFormState }) {
  if (state.attempt === 0 || !state.message) return null;
  return (
    <p role={state.status === "error" ? "alert" : "status"} className={`text-sm font-semibold ${state.status === "error" ? "text-danger-700" : "text-ok-700"}`}>
      {state.message}
    </p>
  );
}

const DEFAULT_GUIDANCE: Record<MediaOwner["kind"], string> = {
  package: "Use equipment or system photos you have permission to publish.",
  product: "Use clear product photos — ideally the manufacturer’s official images or your own photos.",
  project: "Use only real JFL Solar project photos that you have permission to publish. Never use stock photos or other companies’ work.",
  block: "Only use images you have permission to publish.",
};

export function ImageManager({
  owner,
  images,
  title = "Images",
  coverLabel = "cover",
  guidance,
}: {
  owner: MediaOwner;
  images: MediaAsset[];
  title?: string;
  coverLabel?: string;
  guidance?: string;
}) {
  const [state, action, pending] = useActionState(uploadImage.bind(null, owner), initialFormState);
  const [preview, setPreview] = useState<string | null>(null);
  const v = state.status === "error" ? state.values ?? {} : {};

  return (
    <section aria-labelledby="images-title" className="rounded-[var(--radius-panel)] border border-steel-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="images-title" className="text-lg font-bold text-steel-950">
          {title}
        </h2>
        <p className="rounded-full bg-steel-100 px-2.5 py-0.5 text-xs font-semibold text-steel-700">Saved separately — changes here apply immediately</p>
      </div>
      <p className="mt-1 text-sm text-steel-600">
        {guidance ?? DEFAULT_GUIDANCE[owner.kind]} JPEG, PNG, WebP or AVIF; large photos are reduced automatically. Images become public only when
        this item is published.
      </p>

      {images.length > 0 && (
        <ol className="mt-5 space-y-4">
          {images.map((img, i) => (
            <ImageRow key={`${img.id}-${img.storage_key}`} img={img} first={i === 0} last={i === images.length - 1} coverLabel={coverLabel} showCover={owner.kind !== "block"} />
          ))}
        </ol>
      )}

      <form key={state.status === "saved" ? state.attempt : "upload"} action={action} className="mt-6 grid gap-4 rounded-[var(--radius-control)] border border-dashed border-steel-400 bg-steel-50 p-4 sm:grid-cols-2">
        <h3 className="font-bold text-steel-950 sm:col-span-2">Add an image</h3>
        <div className="sm:col-span-2">
          <label htmlFor="upload-file" className="mb-1 block font-semibold">
            Image file <span className="text-sm font-normal text-steel-600">(required)</span>
          </label>
          <FilePicker id="upload-file" onPrepared={setPreview} describedBy={state.errors.file ? "upload-file-error" : undefined} />
          {state.errors.file && (
            <p id="upload-file-error" className="mt-1 text-sm font-semibold text-danger-700">
              {state.errors.file}
            </p>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="" className="mt-3 h-32 w-auto rounded border border-steel-200 object-cover" />}
        </div>
        <div>
          <label htmlFor="upload-alt" className="mb-1 block font-semibold">
            Alternative text <span className="text-sm font-normal text-steel-600">(required)</span>
          </label>
          <input
            id="upload-alt"
            name="alt"
            defaultValue={v.alt}
            maxLength={300}
            aria-invalid={state.errors.alt ? true : undefined}
            aria-describedby={state.errors.alt ? "upload-alt-hint upload-alt-error" : "upload-alt-hint"}
            className={input}
          />
          <p id="upload-alt-hint" className="mt-1 text-sm text-steel-600">
            Describe what the photo shows, for people who cannot see it.
          </p>
          {state.errors.alt && (
            <p id="upload-alt-error" className="mt-1 text-sm font-semibold text-danger-700">
              {state.errors.alt}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="upload-caption" className="mb-1 block font-semibold">
            Caption
          </label>
          <input id="upload-caption" name="caption" defaultValue={v.caption} maxLength={300} className={input} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white hover:bg-steel-800 disabled:opacity-60">
            {pending ? "Uploading…" : "Upload image"}
          </button>
          <Result state={state} />
        </div>
      </form>
    </section>
  );
}

function ImageRow({ img, first, last, coverLabel, showCover }: { img: MediaAsset; first: boolean; last: boolean; coverLabel: string; showCover: boolean }) {
  const [opState, op, opPending] = useActionState((prev: AdminFormState, fd: FormData) => imageOperation(img.id, fd.get("op") as "cover" | "up" | "down" | "delete", prev), initialFormState);
  const [textState, saveText, textPending] = useActionState(updateImageText.bind(null, img.id), initialFormState);
  const [repState, replace, repPending] = useActionState(replaceImage.bind(null, img.id), initialFormState);
  const dialog = useRef<HTMLDialogElement>(null);
  const thumb = `/admin/media/${img.storage_key}/${img.widths.includes(640) ? 640 : img.widths[0]}.webp`;
  const t = textState.values ?? { alt: img.alt, caption: img.caption ?? "" };
  // Unsaved alt/caption edits stay flagged (and protected) until a save succeeds.
  const [textEditedAt, setTextEditedAt] = useState<number | null>(null);
  const textDirty = textEditedAt === textState.attempt || (textState.status === "error" && textState.attempt > 0);
  const textForm = useRef<HTMLFormElement>(null);
  useUnsavedGuard(textDirty, textForm);

  return (
    <li className="grid gap-4 rounded-[var(--radius-control)] border border-steel-200 p-3 sm:grid-cols-[10rem_1fr]">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt={img.alt} className="aspect-[4/3] w-full rounded bg-steel-100 object-cover" />
        {img.is_cover && showCover && <p className="mt-1 text-xs font-bold text-gold-800 uppercase">★ {coverLabel}</p>}
        <p className="mt-1 text-xs text-steel-600 tabular">
          {img.width}×{img.height}
        </p>
      </div>
      <div className="space-y-3">
        <form ref={textForm} action={saveText} onChange={() => setTextEditedAt(textState.attempt)} className="grid gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor={`alt-${img.id}`} className="block text-sm font-semibold">
              Alternative text
            </label>
            <input
              id={`alt-${img.id}`}
              name="alt"
              defaultValue={t.alt}
              maxLength={300}
              aria-invalid={textState.errors.alt ? true : undefined}
              aria-describedby={textState.errors.alt ? `alt-${img.id}-error` : undefined}
              className={input}
            />
            {textState.errors.alt && (
              <p id={`alt-${img.id}-error`} className="mt-1 text-sm font-semibold text-danger-700">
                {textState.errors.alt}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`cap-${img.id}`} className="block text-sm font-semibold">
              Caption
            </label>
            <input id={`cap-${img.id}`} name="caption" defaultValue={t.caption} maxLength={300} className={input} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button type="submit" disabled={textPending} className={btn}>
              Save image details
            </button>
            {textState.status === "error" && <Result state={textState} />}
            {textDirty ? <p className="text-sm font-semibold text-warn-800">Unsaved changes</p> : textState.status !== "error" && <Result state={textState} />}
          </div>
        </form>

        <form action={op} className="flex flex-wrap items-center gap-1.5">
          {showCover && !img.is_cover && (
            <button type="submit" name="op" value="cover" disabled={opPending} className={btn}>
              Make {coverLabel}
            </button>
          )}
          <button type="submit" name="op" value="up" disabled={first || opPending} className={btn} aria-label="Move image earlier">
            ↑ Earlier
          </button>
          <button type="submit" name="op" value="down" disabled={last || opPending} className={btn} aria-label="Move image later">
            ↓ Later
          </button>
          <button type="button" onClick={() => dialog.current?.showModal()} className={`${btn} border-danger-700 text-danger-700`}>
            Delete
          </button>
          <Result state={opState} />
          <dialog ref={dialog} aria-labelledby={`del-${img.id}`} className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] p-6 shadow-2xl">
            <h3 id={`del-${img.id}`} className="text-lg font-bold">
              Delete this image?
            </h3>
            <p className="mt-2 text-steel-700">The file is removed permanently. This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => dialog.current?.close()} className={btn}>
                Cancel
              </button>
              <button type="submit" name="op" value="delete" onClick={() => dialog.current?.close()} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-danger-700 px-4 font-semibold text-white">
                Delete image
              </button>
            </div>
          </dialog>
        </form>

        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-steel-900 underline">Replace file</summary>
          <form action={replace} className="mt-2 space-y-2">
            <label htmlFor={`rep-${img.id}`} className="block text-sm font-semibold">
              New image file
            </label>
            <FilePicker id={`rep-${img.id}`} describedBy={repState.errors.file ? `rep-${img.id}-error` : undefined} />
            {repState.errors.file && (
              <p id={`rep-${img.id}-error`} className="text-sm font-semibold text-danger-700">
                {repState.errors.file}
              </p>
            )}
            <button type="submit" disabled={repPending} className={btn}>
              {repPending ? "Uploading…" : "Replace image"}
            </button>
            <Result state={repState} />
          </form>
        </details>
      </div>
    </li>
  );
}
