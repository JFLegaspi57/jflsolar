"use client";

import { useId, useRef, type ReactNode } from "react";

/**
 * Destructive action guarded by a native modal <dialog> (focus trapped,
 * Escape cancels, focus returns to the trigger). The real <form> is only
 * submitted after explicit confirmation.
 */
export function ConfirmSubmit({
  action,
  label,
  title,
  body,
  confirmLabel,
  className = "",
  tone = "danger",
}: {
  action: () => Promise<void>;
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  className?: string;
  /** danger = permanent/destructive (red); caution = reversible but consequential (neutral). */
  tone?: "danger" | "caution";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const trigger =
    tone === "danger"
      ? "border-2 border-danger-700 text-danger-700 hover:bg-danger-50"
      : "border border-steel-300 bg-white text-steel-900 hover:border-steel-900";
  const confirm = tone === "danger" ? "bg-danger-700 hover:bg-[#93190f]" : "bg-steel-900 hover:bg-steel-800";
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={`inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-4 text-sm font-semibold ${trigger} ${className}`}
      >
        {label}
      </button>
      <dialog ref={ref} aria-labelledby={titleId} className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] p-0 shadow-2xl">
        <form action={action} className="p-6">
          <h2 id={titleId} className="text-xl font-bold text-steel-950">
            {title}
          </h2>
          <div className="mt-2 text-steel-700">{body}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => ref.current?.close()}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border-2 border-steel-900 px-4 font-semibold text-steel-900 hover:bg-steel-50"
            >
              Cancel
            </button>
            <button type="submit" className={`inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-4 font-semibold text-white ${confirm}`}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
