"use client";

import { useEffect, type RefObject } from "react";

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
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onSubmit = (e: SubmitEvent) => {
      if (e.target === ownForm.current || e.defaultPrevented) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
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
