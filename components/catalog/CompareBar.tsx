"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MAX_COMPARE } from "@/lib/catalog";

/**
 * Submit bar for the package comparison GET form. Without JavaScript the form
 * still works (the compare page caps the selection at three). With JavaScript
 * it shows a live count and disables further boxes once three are chosen.
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

  return (
    <div className="sticky bottom-0 z-30 border-t border-steel-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <p className="text-sm text-steel-700" role="status" aria-live="polite">
          {count === 0
            ? `Tick “Compare” on up to ${MAX_COMPARE} packages.`
            : `${count} of ${MAX_COMPARE} selected${count >= MAX_COMPARE ? " — maximum reached" : ""}.`}
        </p>
        <button
          type="submit"
          form={formId}
          disabled={hydrated && count < 2}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white hover:bg-steel-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compare selected
        </button>
      </div>
    </div>
  );
}
