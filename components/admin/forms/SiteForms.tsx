"use client";

import { useActionState } from "react";
import { addStaff, saveBlock, saveSettings } from "@/app/admin/actions/site";
import { initialFormState } from "@/lib/admin/form";
import { AdminForm } from "../AdminForm";
import { CheckboxField, Fieldset, SelectField, TextArea, TextField } from "../Fields";

export function BlockForm({ values, version, isNew }: { values: Record<string, string>; version?: string; isNew: boolean }) {
  return (
    <AdminForm action={saveBlock} initialValues={values} hidden={{ version: version ?? "", original_key: values.original_key ?? "" }} isNew={isNew} publishable={false} labels={{ save: isNew ? "Create block" : "Save" }}>
      <Fieldset legend="Content">
        <TextField name="title" label="Title / heading" required maxLength={160} className="sm:col-span-2" />
        <TextField name="subtitle" label="Subtitle" maxLength={200} hint="Optional (e.g. a founder's role, or a short label)." className="sm:col-span-2" />
        <TextArea name="body" label="Text" maxLength={6000} rows={8} className="sm:col-span-2" hint="Plain text. Separate paragraphs with a blank line." />
      </Fieldset>
      <Fieldset legend="Accuracy and visibility" description="Copy marked as awaiting confirmation is shown only on the preview site (with a marker) and is hidden on the production site.">
        <CheckboxField name="confirmed" label="The owner has confirmed this text is accurate" hint="Tick only after the facts and promises in this text have been approved (founding date, credentials, warranty and support promises)." />
        <CheckboxField name="published" label="Show on the website" />
        <TextArea name="review_note" label="Review note (staff only)" maxLength={1000} rows={3} className="sm:col-span-2" hint="What needs checking, and who approved it." />
      </Fieldset>
      <Fieldset legend="Placement">
        <SelectField
          name="section"
          label="Section"
          required
          options={[
            { value: "about", label: "About page" },
            { value: "why", label: "Why choose us (home + About)" },
            { value: "home", label: "Home (reserved)" },
            { value: "services", label: "Services (reserved)" },
            { value: "legal", label: "Legal (reserved)" },
          ]}
        />
        <TextField name="sort_order" label="Order" inputMode="numeric" hint="Lower numbers appear first." />
        <TextField name="key" label="Block key" required maxLength={60} hint="Internal identifier, e.g. about.team. Standard keys (about.intro, about.mission, about.founder…) place the block in a fixed spot on the About page." className="sm:col-span-2" />
      </Fieldset>
    </AdminForm>
  );
}

export function SettingsForm({ values, version }: { values: Record<string, string>; version: string }) {
  return (
    <AdminForm action={saveSettings} initialValues={values} hidden={{ version }} isNew={false} publishable={false} labels={{ save: "Save settings" }}>
      <Fieldset legend="Phone and messaging" description="These are public. The inquiry email recipient is configured separately by your developer (it is not shown on the website).">
        <TextField name="phone_display" label="Phone (as displayed)" required maxLength={40} placeholder="0969 471 2098" />
        <TextField name="phone_e164" label="Phone (international format, for click-to-call)" required maxLength={16} placeholder="+639694712098" />
        <TextField name="messaging_display" label="WhatsApp / Viber number (as displayed)" maxLength={40} />
        <div className="hidden sm:block" />
        <TextField name="whatsapp_e164" label="WhatsApp number (international)" maxLength={16} />
        <CheckboxField name="whatsapp_enabled" label="Show WhatsApp button" hint="Only turn on after confirming the number uses WhatsApp." />
        <TextField name="viber_e164" label="Viber number (international)" maxLength={16} />
        <CheckboxField name="viber_enabled" label="Show Viber button" hint="Only turn on after confirming the number uses Viber." />
      </Fieldset>
      <Fieldset legend="Facebook and email">
        <TextField name="facebook_url" label="Facebook page link" type="url" maxLength={300} placeholder="https://www.facebook.com/…" />
        <CheckboxField name="facebook_enabled" label="Show Facebook link" hint="Turn on only after checking the link opens your public page while logged out." />
        <TextField name="messenger_url" label="Messenger link" type="url" maxLength={300} placeholder="https://m.me/…" />
        <CheckboxField name="messenger_enabled" label="Show Messenger button" />
        <TextField name="public_email" label="Public email address" type="email" maxLength={254} hint="Optional. Leave blank to hide." className="sm:col-span-2" />
      </Fieldset>
      <Fieldset legend="Locations">
        <TextArea name="office_address" label="Office address" required maxLength={300} rows={2} />
        <TextArea name="warehouse_address" label="Warehouse address" maxLength={300} rows={2} />
        <TextField name="business_hours" label="Business hours" maxLength={300} hint="Optional. Leave blank until confirmed." className="sm:col-span-2" />
      </Fieldset>
      <Fieldset legend="Service area and warranty">
        <TextField name="service_area" label="Service area" required maxLength={300} className="sm:col-span-2" />
        <TextArea name="service_area_note" label="Service area note" maxLength={1000} rows={2} className="sm:col-span-2" />
        <TextArea name="general_warranty" label="General warranty information" maxLength={4000} rows={4} className="sm:col-span-2" hint="Shown wherever a package or product has no specific warranty terms. Do not state periods or guarantees that are not confirmed." />
      </Fieldset>
    </AdminForm>
  );
}

export function AddStaffForm() {
  const [state, action, pending] = useActionState(addStaff, initialFormState);
  const v = state.status === "error" ? state.values ?? {} : {};
  const input = "min-h-11 w-full rounded-[var(--radius-control)] border border-steel-400 bg-white px-3 text-base";
  return (
    <form key={state.attempt} action={action} className="grid gap-4 rounded-[var(--radius-panel)] border border-steel-200 bg-white p-5 sm:grid-cols-3">
      <h2 className="text-lg font-bold text-steel-950 sm:col-span-3">Add a staff member</h2>
      <div className="sm:col-span-2">
        <label htmlFor="staff-email" className="mb-1 block font-semibold">
          Google account email <span className="text-sm font-normal text-steel-600">(required)</span>
        </label>
        <input id="staff-email" name="email" type="email" defaultValue={v.email} required className={input} aria-describedby={state.errors.email ? "staff-email-error" : undefined} />
        {state.errors.email && <p id="staff-email-error" className="mt-1 text-sm font-semibold text-danger-700">{state.errors.email}</p>}
      </div>
      <div>
        <label htmlFor="staff-role" className="mb-1 block font-semibold">
          Role
        </label>
        <select id="staff-role" name="role" defaultValue={v.role ?? "editor"} className={input}>
          <option value="editor">Editor — manages content</option>
          <option value="owner">Owner — content and staff</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="staff-name" className="mb-1 block font-semibold">
          Name
        </label>
        <input id="staff-name" name="display_name" defaultValue={v.display_name} className={input} />
      </div>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white disabled:opacity-60">
          Add staff member
        </button>
      </div>
      {state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={`text-sm font-semibold sm:col-span-3 ${state.status === "error" ? "text-danger-700" : "text-ok-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
