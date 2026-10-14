"use client";

import { createContext, use, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { initialFormState, type AdminFormState } from "@/lib/admin/form";

type Action = (prev: AdminFormState, fd: FormData) => Promise<AdminFormState>;

interface Ctx {
  values: Record<string, string>;
  errors: Record<string, string>;
}
const FormCtx = createContext<Ctx>({ values: {}, errors: {} });
export const useAdminField = (name: string) => {
  const { values, errors } = use(FormCtx);
  return { value: values[name] ?? "", error: errors[name] };
};

/**
 * Admin edit form: restores every field from server state after a failed
 * save, focuses an error summary, announces success, warns about unsaved
 * changes, and offers Save / Publish / Unpublish (DECISIONS.md D10, D11).
 */
export function AdminForm({
  action,
  initialValues,
  hidden,
  status,
  isNew,
  children,
  labels = {},
  publishable = true,
}: {
  action: Action;
  initialValues: Record<string, string>;
  hidden: Record<string, string>;
  status?: string;
  isNew: boolean;
  children: ReactNode;
  labels?: { save?: string };
  publishable?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const values = state.values ?? initialValues;
  const currentStatus = values.current_status ?? status ?? "draft";
  const version = state.version ?? hidden.version ?? "";
  // Attempt number during which the user last edited; a newer server response means "saved".
  const [editedAt, setEditedAt] = useState<number | null>(null);
  const dirty = editedAt === state.attempt || (state.status === "error" && state.attempt > 0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLParagraphElement>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Unsaved-changes protection: page unload, in-app links and other forms
  // (e.g. Publish/Archive buttons, image actions) all ask before discarding edits.
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
      if (e.target === formRef.current) return;
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
  }, [dirty]);

  useEffect(() => {
    if (state.attempt === 0) return;
    if (state.status === "error") summaryRef.current?.focus();
    else savedRef.current?.focus();
  }, [state.attempt, state.status]);

  const errorEntries = Object.entries(state.errors);
  const live = currentStatus === "published";

  return (
    <FormCtx value={{ values, errors: state.errors }}>
      <form
        key={state.attempt}
        ref={formRef}
        action={formAction}
        noValidate
        data-admin-form
        aria-busy={pending}
        onChange={() => setEditedAt(state.attempt)}
        className="space-y-8 pb-36"
      >
        {Object.entries({ ...hidden, version, current_status: currentStatus }).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

        {state.status === "error" && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-control)] border-2 border-danger-700 bg-danger-50 p-4 focus:outline-none">
            <p className="font-bold text-danger-700">{state.message}</p>
            {errorEntries.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {errorEntries.map(([field, msg]) => (
                  <li key={field}>
                    <a href={`#f-${field}`} className="text-danger-700 underline">
                      {msg}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {state.status === "saved" && (
          <p ref={savedRef} tabIndex={-1} role="status" className="rounded-[var(--radius-control)] border border-[#b7e2c6] bg-ok-50 px-4 py-3 font-semibold text-ok-700 focus:outline-none">
            {state.message}
          </p>
        )}
        {live && !isNew && publishable && (
          <p className="rounded-[var(--radius-control)] border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-steel-900">
            <strong>This item is live.</strong> Saving updates the public page immediately. To take it offline while you work, use “Save and unpublish”.
          </p>
        )}

        {/* Locked while saving so nothing typed during a save is lost on the response. */}
        <fieldset disabled={pending} className="m-0 min-w-0 space-y-8 border-0 p-0">
          {children}
        </fieldset>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-steel-200 bg-white/95 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            <p className="mr-auto text-sm text-steel-600" aria-live="polite">
              {pending ? "Saving…" : dirty ? "Unsaved changes" : isNew ? "New item — not saved yet" : "All changes saved"}
            </p>
            <button
              type="submit"
              name="intent"
              value="save"
              disabled={pending}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white hover:bg-steel-800 disabled:opacity-60"
            >
              {labels.save ?? (isNew ? "Save as draft" : "Save")}
            </button>
            {publishable && (live ? (
              <button
                type="submit"
                name="intent"
                value="unpublish"
                disabled={pending}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border-2 border-steel-900 px-4 font-semibold text-steel-900 hover:bg-steel-50 disabled:opacity-60"
              >
                Save and unpublish
              </button>
            ) : (
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={pending}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-gold-500 px-5 font-semibold text-steel-950 hover:bg-gold-400 disabled:opacity-60"
              >
                Save and publish
              </button>
            ))}
          </div>
        </div>
      </form>
    </FormCtx>
  );
}
