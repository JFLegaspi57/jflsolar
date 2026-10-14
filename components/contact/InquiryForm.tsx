"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitInquiry } from "@/app/(site)/contact/actions";
import { billRanges, inquiryTypes } from "@/lib/labels";
import { BILL_RELEVANT, FIELD_LIMITS, type InquiryErrors, type InquiryValues } from "@/lib/inquiry/schema";
import type { InquiryState } from "@/lib/inquiry/state";
import { Icon } from "@/components/ui/Icon";

const input =
  "min-h-12 w-full rounded-[var(--radius-control)] border bg-white px-3.5 text-base text-steel-950 placeholder:text-steel-600 focus:border-steel-900 aria-[invalid=true]:border-danger-700 aria-[invalid=true]:bg-danger-50/40";

const fieldOrder: (keyof InquiryErrors)[] = ["item", "name", "contact", "phone", "email", "inquiry_type", "location", "bill_range", "message"];
const fieldTarget: Record<keyof InquiryErrors, string> = {
  item: "item-remove",
  name: "f-name",
  contact: "f-phone",
  phone: "f-phone",
  email: "f-email",
  inquiry_type: "f-type",
  location: "f-location",
  bill_range: "f-bill",
  message: "f-message",
};

export interface QuickContact {
  label: string;
  detail: string;
  href: string;
  external: boolean;
}

export function InquiryForm({
  initialValues,
  token,
  demo,
  quickContacts = [],
}: {
  initialValues: InquiryValues;
  token: string;
  demo: boolean;
  quickContacts?: QuickContact[];
}) {
  const [state, formAction, pending] = useActionState<InquiryState, FormData>(submitInquiry, {
    status: "idle",
    message: null,
    errors: {},
    values: initialValues,
    token,
    attempt: 0,
  });

  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.attempt === 0) return;
    if (state.status === "sent" || state.status === "demo") doneRef.current?.focus();
    else summaryRef.current?.focus();
  }, [state.attempt, state.status]);

  if (state.status === "sent") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="rounded-[var(--radius-panel)] border border-[#b7e2c6] bg-ok-50 p-6 focus:outline-none">
        <h3 className="flex items-center gap-2 text-xl font-bold text-ok-700">
          <Icon name="check" className="size-6" /> Thank you — your inquiry was sent.
        </h3>
        <p className="mt-2 text-steel-800">We have received your message and will reply using the contact details you gave.</p>
      </div>
    );
  }

  return (
    <FormBody
      key={state.attempt}
      state={state}
      formAction={formAction}
      pending={pending}
      demo={demo}
      quickContacts={quickContacts}
      summaryRef={summaryRef}
      doneRef={doneRef}
    />
  );
}

function FormBody({
  state,
  formAction,
  pending,
  demo,
  quickContacts,
  summaryRef,
  doneRef,
}: {
  state: InquiryState;
  formAction: (fd: FormData) => void;
  pending: boolean;
  demo: boolean;
  quickContacts: QuickContact[];
  summaryRef: React.RefObject<HTMLDivElement | null>;
  doneRef: React.RefObject<HTMLDivElement | null>;
}) {
  const v = state.values;
  const e = state.errors;
  const [type, setType] = useState(v.inquiry_type);
  const [item, setItem] = useState(v.item_slug ? { type: v.item_type, slug: v.item_slug, name: v.item_name } : null);
  const [messageLength, setMessageLength] = useState(v.message.length);
  const errorList = fieldOrder.filter((k) => e[k]);
  const showSummary = state.status === "invalid" || state.status === "error" || state.status === "limited";

  const describe = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

  return (
    <form action={formAction} noValidate aria-describedby={demo ? "demo-note" : undefined} className="space-y-5">
      {demo && (
        <div id="demo-note" className="rounded-[var(--radius-control)] border-2 border-dashed border-gold-600 bg-gold-50 p-4 text-steel-900">
          <p className="font-bold">Demo form — submissions are not delivered.</p>
          <p className="mt-1 text-sm">Inquiry email has not been set up yet, so nothing typed here will be sent. To reach JFL Solar now:</p>
          {quickContacts.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {quickContacts.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-steel-900 px-4 text-sm font-semibold text-white hover:bg-steel-800"
                  >
                    {c.label} <span className="font-normal text-steel-200 tabular">{c.detail}</span>
                    {c.external && <span className="sr-only">(opens in a new tab)</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.status === "demo" && (
        <div ref={doneRef} tabIndex={-1} role="status" className="rounded-[var(--radius-control)] border border-steel-300 bg-steel-50 p-4 focus:outline-none">
          <p className="font-bold text-steel-950">Checked, but not sent (demo).</p>
          <p className="mt-1 text-sm text-steel-700">{state.message}</p>
        </div>
      )}

      {showSummary && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-control)] border-2 border-danger-700 bg-danger-50 p-4 focus:outline-none">
          <p className="font-bold text-danger-700">{state.message}</p>
          {errorList.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {errorList.map((k) => (
                <li key={k}>
                  <a href={`#${fieldTarget[k]}`} className="text-danger-700 underline">
                    {e[k]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input type="hidden" name="token" value={state.token} />
      {/* Honeypot: hidden from people and assistive technology */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {item ? (
        <div className="rounded-[var(--radius-control)] border border-steel-300 bg-steel-50 p-3" role="group" aria-labelledby="item-label">
          <input type="hidden" name="item_type" value={item.type} />
          <input type="hidden" name="item_slug" value={item.slug} />
          <input type="hidden" name="item_name" value={item.name} />
          <p id="item-label" className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
            Asking about this {item.type === "package" ? "package" : "product"}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-steel-950">{item.name}</p>
            <button
              id="item-remove"
              type="button"
              onClick={() => setItem(null)}
              className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-sm font-semibold text-steel-800 underline hover:text-steel-950"
            >
              <Icon name="x" className="size-4" /> Remove<span className="sr-only"> selected item</span>
            </button>
          </div>
        </div>
      ) : (
        e.item && (
          <p id="item-remove" tabIndex={-1} className="text-sm font-semibold text-danger-700">
            {e.item}
          </p>
        )
      )}

      <Field id="f-name" label="Your name" error={e.name} required>
        <input
          id="f-name"
          name="name"
          autoComplete="name"
          defaultValue={v.name}
          maxLength={FIELD_LIMITS.name}
          required
          aria-invalid={e.name ? true : undefined}
          aria-describedby={describe(e.name && "f-name-error")}
          className={`${input} border-steel-400`}
        />
      </Field>

      <fieldset aria-describedby={describe("contact-hint", e.contact && "contact-error")} className="space-y-4">
        <legend className="text-base font-semibold text-steel-950">How can we reach you?</legend>
        <p id="contact-hint" className="-mt-2 text-sm text-steel-600">
          Give at least one: phone or email.
        </p>
        {e.contact && (
          <p id="contact-error" className="flex items-start gap-1.5 text-sm font-semibold text-danger-700">
            <Icon name="x" className="mt-0.5 size-4" /> {e.contact}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="f-phone" label="Mobile or phone" error={e.phone}>
            <input
              id="f-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={v.phone}
              maxLength={FIELD_LIMITS.phone}
              aria-invalid={e.phone || e.contact ? true : undefined}
              aria-describedby={describe(e.phone && "f-phone-error", e.contact && "contact-error")}
              className={`${input} border-steel-400 tabular`}
            />
          </Field>
          <Field id="f-email" label="Email" error={e.email}>
            <input
              id="f-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              defaultValue={v.email}
              maxLength={FIELD_LIMITS.email}
              aria-invalid={e.email || e.contact ? true : undefined}
              aria-describedby={describe(e.email && "f-email-error", e.contact && "contact-error")}
              className={`${input} border-steel-400`}
            />
          </Field>
        </div>
      </fieldset>

      <Field id="f-type" label="What is your inquiry about?" error={e.inquiry_type} required>
        <select
          id="f-type"
          name="inquiry_type"
          defaultValue={v.inquiry_type}
          onChange={(ev) => setType(ev.currentTarget.value)}
          required
          aria-invalid={e.inquiry_type ? true : undefined}
          aria-describedby={describe(e.inquiry_type && "f-type-error")}
          className={`${input} border-steel-400`}
        >
          <option value="">Choose one…</option>
          {inquiryTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="f-location" label="Location" hint="City or province (optional)" error={e.location}>
          <input
            id="f-location"
            name="location"
            autoComplete="address-level2"
            defaultValue={v.location}
            maxLength={FIELD_LIMITS.location}
            aria-describedby={describe("f-location-hint", e.location && "f-location-error")}
            className={`${input} border-steel-400`}
          />
        </Field>
        {BILL_RELEVANT.has(type) && (
          <Field id="f-bill" label="Average monthly electricity bill" hint="Optional — helps us size a system" error={e.bill_range}>
            <select
              id="f-bill"
              name="bill_range"
              defaultValue={v.bill_range}
              aria-invalid={e.bill_range ? true : undefined}
              aria-describedby={describe("f-bill-hint", e.bill_range && "f-bill-error")}
              className={`${input} border-steel-400`}
            >
              {billRanges.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field id="f-message" label="Message" hint="Your property, system or equipment needs, and any timing." error={e.message} required>
        <textarea
          id="f-message"
          name="message"
          rows={5}
          defaultValue={v.message}
          maxLength={FIELD_LIMITS.message}
          required
          onChange={(ev) => setMessageLength(ev.currentTarget.value.length)}
          aria-invalid={e.message ? true : undefined}
          aria-describedby={describe("f-message-hint", e.message && "f-message-error", "f-message-count")}
          className={`${input} border-steel-400 py-3`}
        />
        <p id="f-message-count" className="mt-1 text-right text-xs text-steel-600 tabular">
          {messageLength} / {FIELD_LIMITS.message}
        </p>
      </Field>

      <p className="text-sm text-steel-600">
        We use your details only to reply to this inquiry. See our{" "}
        <a href="/privacy" className="font-semibold text-steel-900 underline">
          privacy notice
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-gold-500 px-6 text-base font-semibold text-steel-950 hover:bg-gold-400 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {pending ? "Sending…" : demo ? "Send inquiry (demo)" : "Send inquiry"}
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {pending ? "Sending your inquiry" : ""}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-steel-950">
        {label}
        {required ? (
          <span className="ml-1 text-sm font-normal text-steel-600">(required)</span>
        ) : null}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 mb-1.5 text-sm text-steel-600">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-danger-700">
          <Icon name="x" className="mt-0.5 size-4" /> {error}
        </p>
      )}
    </div>
  );
}
