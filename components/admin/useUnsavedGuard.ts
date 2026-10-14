"use client";

import { useEffect, type RefObject } from "react";

// Events already confirmed by one guard, so several dirty sections ask only once.
const confirmed = new WeakSet<Event>();

/**
 * Unsaved-changes protection while `dirty`: page unload, in-app links and
 * other forms (e.g. Publish/Archive buttons, image actions) all ask before
 * discarding edits. Submitting `ownForm` itself is never interrupted.
 */
export function useUnsavedGuard(dirty: boolean, ownForm: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (!dirty) return;
    const message = "You have unsaved changes on this page. Leave without saving them?";
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    const ask = (e: Event) => {
      if (confirmed.has(e)) return;
      if (window.confirm(message)) confirmed.add(e);
      else {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      ask(e);
    };
    const onSubmit = (e: SubmitEvent) => {
      if (e.target === ownForm.current || e.defaultPrevented) return;
      ask(e);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [dirty, ownForm]);
}
