"use client";

import type { ReactNode } from "react";
import { useAdminField } from "./AdminForm";

const control =
  "w-full rounded-[var(--radius-control)] border border-steel-400 bg-white px-3 text-base text-steel-950 focus:border-steel-900 aria-[invalid=true]:border-danger-700";

function Wrap({ name, label, hint, error, required, children, className = "" }: { name: string; label: string; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="mb-1 block font-semibold text-steel-950">
        {label}
        {required && <span className="ml-1 text-sm font-normal text-steel-600">(required)</span>}
      </label>
      {hint && (
        <p id={`f-${name}-hint`} className="-mt-0.5 mb-1.5 text-sm text-steel-600">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`f-${name}-error`} className="mt-1 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

const described = (name: string, hint: unknown, error: unknown) =>
  [hint ? `f-${name}-hint` : "", error ? `f-${name}-error` : ""].filter(Boolean).join(" ") || undefined;

export function TextField({
  name,
  label,
  hint,
  required,
  maxLength,
  type = "text",
  inputMode,
  className,
  placeholder,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  maxLength?: number;
  type?: "text" | "email" | "url" | "date" | "tel";
  inputMode?: "decimal" | "numeric" | "text" | "tel" | "email" | "url";
  className?: string;
  placeholder?: string;
}) {
  const { value, error } = useAdminField(name);
  return (
    <Wrap name={name} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={`f-${name}`}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={described(name, hint, error)}
        className={`${control} min-h-11`}
      />
    </Wrap>
  );
}

export function TextArea({ name, label, hint, required, maxLength, rows = 4, className, mono = false }: { name: string; label: string; hint?: ReactNode; required?: boolean; maxLength?: number; rows?: number; className?: string; mono?: boolean }) {
  const { value, error } = useAdminField(name);
  return (
    <Wrap name={name} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={`f-${name}`}
        name={name}
        rows={rows}
        defaultValue={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={described(name, hint, error)}
        className={`${control} py-2.5 ${mono ? "font-mono text-sm" : ""}`}
      />
    </Wrap>
  );
}

export function SelectField({ name, label, hint, required, options, className }: { name: string; label: string; hint?: ReactNode; required?: boolean; options: { value: string; label: string }[]; className?: string }) {
  const { value, error } = useAdminField(name);
  return (
    <Wrap name={name} label={label} hint={hint} error={error} required={required} className={className}>
      <select id={`f-${name}`} name={name} defaultValue={value} aria-invalid={error ? true : undefined} aria-describedby={described(name, hint, error)} className={`${control} min-h-11`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function CheckboxField({ name, label, hint }: { name: string; label: string; hint?: ReactNode }) {
  const { value, error } = useAdminField(name);
  return (
    <div>
      <label htmlFor={`f-${name}`} className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          id={`f-${name}`}
          name={name}
          type="checkbox"
          defaultChecked={value === "on" || value === "true"}
          aria-describedby={described(name, hint, error)}
          className="mt-1 size-5 shrink-0 accent-steel-900"
        />
        <span>
          <span className="font-semibold text-steel-950">{label}</span>
          {hint && (
            <span id={`f-${name}-hint`} className="block text-sm text-steel-600">
              {hint}
            </span>
          )}
        </span>
      </label>
      {error && <p id={`f-${name}-error`} className="mt-1 text-sm font-semibold text-danger-700">{error}</p>}
    </div>
  );
}

export function Fieldset({ legend, description, children }: { legend: string; description?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="rounded-[var(--radius-panel)] border border-steel-200 bg-white p-5 sm:p-6">
      <legend className="px-1 text-lg font-bold text-steel-950">{legend}</legend>
      {description && <p className="mb-4 text-sm text-steel-600">{description}</p>}
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
