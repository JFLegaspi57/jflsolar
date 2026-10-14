"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MAX_COMPARE } from "@/lib/catalog";

const button =
  "inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-control)] bg-steel-900 px-4 text-sm font-semibold text-white hover:bg-steel-800 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Package comparison controls for the GET form `formId`.
 * - In page flow (above the grid): instructions + submit. Works without JS.
 * - After the first selection (JS only): a compact sticky bar so the action
 *   stays reachable without covering cards before anything is chosen.
 */
export function CompareBar({ formId }: { formId: string }) {
  const [count, setCount] = useState(0);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[data-compare][form="${formId}"]`));
    const sync = () => {
      const checked = boxes().filter((b) => b.checked).length;
      setCount(checked);
      for (const b of boxes()) b.disabled = !b.checked && checked >= MAX_COMPARE;
    };
    sync();
    document.addEventListener("change", sync);
    return () => document.removeEventListener("change", sync);
  }, [formId]);

  const status = count === 0 ? `Tick “Compare” on 2 or 3 packages to see them side by side.` : `${count} of ${MAX_COMPARE} selected`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-steel-200 bg-steel-50 px-4 py-2.5">
        <p className="text-sm text-steel-700">{status}</p>
        <button type="submit" form={formId} disabled={hydrated && count < 2} className={button}>
          Compare selected
        </button>
      </div>
      {hydrated && count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-steel-200 bg-white/95 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-[76rem] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-steel-800" role="status" aria-live="polite">
              {count} of {MAX_COMPARE} selected{count < 2 ? " — choose one more" : ""}
            </p>
            <button type="submit" form={formId} disabled={count < 2} className={button}>
              Compare
            </button>
          </div>
        </div>
      )}
    </>
  );
}
