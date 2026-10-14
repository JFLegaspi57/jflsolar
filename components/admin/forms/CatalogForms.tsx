"use client";

import { useActionState } from "react";
import { saveCategory, saveProduct, saveProject } from "@/app/admin/actions/catalog";
import { uploadDatasheet } from "@/app/admin/actions/media";
import { initialFormState } from "@/lib/admin/form";
import { AdminForm } from "../AdminForm";
import { CheckboxField, Fieldset, SelectField, TextArea, TextField } from "../Fields";

type Common = { values: Record<string, string>; id?: string; version?: string; status?: string };

const pricingOptions = [
  { value: "quote", label: "Request price (no price shown)" },
  { value: "fixed", label: "Fixed price" },
  { value: "starting", label: "Starting price (“From ₱…”)" },
];

export function ProductForm({ values, id, version, status, categories }: Common & { categories: { id: string; name: string }[] }) {
  return (
    <AdminForm action={saveProduct} initialValues={values} hidden={{ id: id ?? "", version: version ?? "" }} status={status} isNew={!id}>
      <Fieldset legend="Basics">
        <TextField name="name" label="Product name" required maxLength={140} className="sm:col-span-2" />
        <SelectField name="category_id" label="Category" required options={[{ value: "", label: "Choose a category…" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
        <TextField name="slug" label="URL slug" maxLength={80} hint="/products/your-slug — leave blank to create from the name." />
        <TextField name="brand" label="Brand" maxLength={60} />
        <TextField name="model" label="Model" maxLength={80} />
        <TextField name="sku" label="SKU / code" maxLength={40} hint="Optional internal code for future ordering." />
        <TextArea name="summary" label="Short summary" maxLength={300} rows={2} className="sm:col-span-2" />
        <TextArea name="description" label="Description" maxLength={6000} rows={4} className="sm:col-span-2" />
        <TextArea
          name="specs"
          label="Specifications"
          rows={6}
          mono
          className="sm:col-span-2"
          hint={<>One per line: <code>Label: value</code> — e.g. <code>Rated power: 620 W</code>. Only enter confirmed specifications.</>}
        />
      </Fieldset>
      <Fieldset legend="Price and availability">
        <SelectField name="pricing_mode" label="Pricing mode" required options={pricingOptions} />
        <TextField name="price_php" label="Price (₱)" inputMode="decimal" />
        <TextField name="price_basis" label="Price basis" maxLength={200} className="sm:col-span-2" hint="e.g. “Per piece, pickup price”." />
        <CheckboxField name="price_is_sample" label="This is a sample price" />
        <SelectField
          name="availability"
          label="Availability"
          required
          hint="Shown as a general status — not a live stock count."
          options={[
            { value: "on_request", label: "Ask about availability" },
            { value: "available", label: "Available to order" },
            { value: "preorder", label: "Available on pre-order" },
            { value: "unavailable", label: "Currently unavailable" },
          ]}
        />
        <TextArea name="warranty_terms" label="Warranty terms" maxLength={2000} rows={3} className="sm:col-span-2" hint="Leave blank to show the general warranty text. Only enter confirmed terms." />
      </Fieldset>
      <Fieldset legend="Display and internal">
        <CheckboxField name="featured" label="Featured product" />
        <CheckboxField name="is_sample" label="Sample / demonstration content" hint="Hidden on the production site." />
        <TextArea name="admin_notes" label="Internal notes (never shown publicly)" maxLength={2000} rows={3} className="sm:col-span-2" />
      </Fieldset>
    </AdminForm>
  );
}

export function ProjectForm({ values, id, version, status }: Common) {
  return (
    <AdminForm action={saveProject} initialValues={values} hidden={{ id: id ?? "", version: version ?? "" }} status={status} isNew={!id}>
      <Fieldset legend="Project">
        <TextField name="title" label="Title" required maxLength={140} className="sm:col-span-2" />
        <TextField name="slug" label="URL slug" maxLength={80} hint="/projects/your-slug — leave blank to create from the title." />
        <SelectField
          name="project_type"
          label="Project type"
          required
          options={[
            { value: "residential", label: "Residential" },
            { value: "commercial", label: "Commercial" },
            { value: "industrial", label: "Industrial" },
          ]}
        />
        <TextField name="location" label="General location" maxLength={120} hint="City or province only — never a client's full address." />
        <TextField name="system_size_kwp" label="System size (kWp)" inputMode="decimal" />
        <CheckboxField name="system_size_confirmed" label="System size is confirmed" hint="Unconfirmed sizes are not shown publicly." />
        <TextField name="scope" label="Scope of work" maxLength={600} className="sm:col-span-2" hint="e.g. “Assessment, supply, installation and commissioning”." />
        <TextArea name="summary" label="Short summary" maxLength={300} rows={2} className="sm:col-span-2" />
        <TextArea name="description" label="Description" maxLength={6000} rows={5} className="sm:col-span-2" />
      </Fieldset>
      <Fieldset legend="Display and internal">
        <CheckboxField name="featured" label="Show on the home page" />
        <CheckboxField name="is_sample" label="Sample / demonstration project" hint="Sample projects are labelled in preview and hidden on the production site. Untick only for a real, approved JFL Solar project." />
        <TextArea name="admin_notes" label="Internal notes (never shown publicly)" maxLength={2000} rows={3} className="sm:col-span-2" />
      </Fieldset>
    </AdminForm>
  );
}

export function CategoryForm({ values, id, version, status }: Common) {
  return (
    <AdminForm action={saveCategory} initialValues={values} hidden={{ id: id ?? "", version: version ?? "" }} status={status} isNew={!id}>
      <Fieldset legend="Category">
        <TextField name="name" label="Name" required maxLength={80} />
        <TextField name="slug" label="URL slug" maxLength={80} hint="Used in /products?category=slug" />
        <TextArea name="description" label="Description" maxLength={400} rows={2} className="sm:col-span-2" />
      </Fieldset>
    </AdminForm>
  );
}

export function DatasheetManager({ productId, current }: { productId: string; current: { file_name: string | null; bytes: number | null; storage_key: string } | null }) {
  const [state, action, pending] = useActionState(uploadDatasheet.bind(null, productId), initialFormState);
  return (
    <section aria-labelledby="ds-title" className="rounded-[var(--radius-panel)] border border-steel-200 bg-white p-5 sm:p-6">
      <h2 id="ds-title" className="text-lg font-bold text-steel-950">
        Datasheet (PDF)
      </h2>
      {current ? (
        <p className="mt-1 text-sm text-steel-700">
          Current:{" "}
          <a href={`/admin/media/${current.storage_key}/datasheet.pdf`} className="font-semibold underline" target="_blank" rel="noopener">
            {current.file_name ?? "datasheet.pdf"}
          </a>
          {current.bytes ? ` (${Math.round(current.bytes / 1024)} KB)` : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm text-steel-600">No datasheet uploaded. Use the manufacturer’s official datasheet only.</p>
      )}
      <form key={state.attempt} action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="ds-file" className="mb-1 block font-semibold">
            {current ? "Replace with" : "Upload"} PDF <span className="text-sm font-normal text-steel-600">(max 4 MB)</span>
          </label>
          <input id="ds-file" name="file" type="file" accept="application/pdf" required className="block text-sm file:mr-3 file:min-h-11 file:rounded file:border-0 file:bg-steel-900 file:px-4 file:font-semibold file:text-white" />
        </div>
        <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white disabled:opacity-60">
          {pending ? "Uploading…" : "Upload datasheet"}
        </button>
        {state.message && (
          <p role={state.status === "error" ? "alert" : "status"} className={`w-full text-sm font-semibold ${state.status === "error" ? "text-danger-700" : "text-ok-700"}`}>
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
