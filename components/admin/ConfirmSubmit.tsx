"use client";

import { useRef, type ReactNode } from "react";

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
}: {
  action: () => Promise<void>;
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={`inline-flex min-h-11 items-center rounded-[var(--radius-control)] border-2 border-danger-700 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50 ${className}`}
      >
        {label}
      </button>
      <dialog ref={ref} aria-labelledby="confirm-title" className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] p-0 shadow-2xl">
        <form action={action} className="p-6">
          <h2 id="confirm-title" className="text-xl font-bold text-steel-950">
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
            <button type="submit" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-danger-700 px-4 font-semibold text-white hover:bg-[#93190f]">
              {confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
