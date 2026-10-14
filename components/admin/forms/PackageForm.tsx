"use client";

import { savePackage } from "@/app/admin/actions/packages";
import { AdminForm } from "../AdminForm";
import { CheckboxField, Fieldset, SelectField, TextArea, TextField } from "../Fields";

export function PackageForm({ values, id, version, status }: { values: Record<string, string>; id?: string; version?: string; status?: string }) {
  return (
    <AdminForm action={savePackage} initialValues={values} hidden={{ id: id ?? "", version: version ?? "" }} status={status} isNew={!id}>
      <Fieldset legend="Basics">
        <TextField name="name" label="Package name" required maxLength={120} className="sm:col-span-2" />
        <TextField
          name="slug"
          label="URL slug"
          maxLength={80}
          hint="The web address: /packages/your-slug. Leave blank to create it from the name. Changing it breaks old links."
        />
        <TextField name="sku" label="SKU / code" maxLength={40} hint="Optional internal code for future ordering." />
        <SelectField
          name="package_type"
          label="Offer type"
          required
          options={[
            { value: "installed_system", label: "Installed system (supply + installation)" },
            { value: "equipment_bundle", label: "Equipment only (no installation)" },
          ]}
        />
        <SelectField
          name="system_type"
          label="System type"
          options={[
            { value: "", label: "Not specified" },
            { value: "on_grid", label: "On-grid" },
            { value: "hybrid", label: "Hybrid" },
            { value: "off_grid", label: "Off-grid" },
          ]}
        />
        <TextArea name="summary" label="Short summary" maxLength={300} rows={2} className="sm:col-span-2" hint="One or two sentences shown on package cards." />
        <TextArea name="description" label="Description" maxLength={6000} rows={5} className="sm:col-span-2" hint="Separate paragraphs with a blank line." />
      </Fieldset>

      <Fieldset legend="Capacity" description="Leave blank if it will be set after a site assessment.">
        <TextField name="inverter_kw" label="Inverter capacity (kW)" inputMode="decimal" hint="How much power the inverter can deliver at once, e.g. 6." />
        <TextField name="array_kwp" label="Solar array (kWp)" inputMode="decimal" hint="Total panel capacity: number of panels × panel watts ÷ 1000, e.g. 10 × 620 W = 6.2." />
        <TextField name="battery_kwh" label="Battery (kWh)" inputMode="decimal" hint="How much energy the battery stores, e.g. 16.5. Leave blank if no battery." />
        <TextArea
          name="components"
          label="Components"
          rows={4}
          mono
          className="sm:col-span-2"
          hint={<>One per line: <code>Component | details | quantity</code> — e.g. <code>Hybrid inverter | GoodWe GW6000-ES-C10, 6 kW | 1 unit</code></>}
        />
        <TextArea name="inclusions" label="Included" rows={5} hint="One item per line." />
        <TextArea name="exclusions" label="Not included" rows={5} hint="One item per line." />
      </Fieldset>

      <Fieldset legend="Price" description="Prices are shown in Philippine pesos. Choose “Request a quotation” when there is no published price.">
        <SelectField
          name="pricing_mode"
          label="Pricing mode"
          required
          options={[
            { value: "quote", label: "Request a quotation (no price shown)" },
            { value: "fixed", label: "Fixed price" },
            { value: "starting", label: "Starting price (“From ₱…”)" },
          ]}
        />
        <TextField name="price_php" label="Price (₱)" inputMode="decimal" hint="Numbers only, e.g. 205000." className="needs-price" />
        <p className="quote-note self-center text-sm text-steel-700">No price will be shown. Customers see “Price to be confirmed” and are asked to request a quotation.</p>
        <TextField name="price_basis" label="Price basis" maxLength={200} hint="e.g. “Pickup price, equipment only” or “Installed price, Metro Manila”." className="needs-price sm:col-span-2" />
        <div className="needs-price">
          <CheckboxField name="price_is_sample" label="This is a sample price" hint="Shows “Sample price — not a confirmed offer”. Untick only for an approved price." />
        </div>
      </Fieldset>

      <Fieldset legend="Promotion" description="Optional. Dates are inclusive, Philippine time. After the end date the promotional price is withdrawn automatically.">
        <TextField name="promo_label" label="Promotion label" maxLength={80} placeholder="e.g. October 2026 promotion" className="sm:col-span-2" />
        <TextField name="promo_start" label="Start date" type="date" />
        <TextField name="promo_end" label="End date" type="date" />
        <CheckboxField name="hide_when_expired" label="Hide this package after the promotion ends" hint="Otherwise it stays listed with “Promotion ended — request current price”." />
      </Fieldset>

      <Fieldset legend="Installation, delivery and warranty">
        <TextArea name="installation_terms" label="Installation terms" maxLength={1000} rows={3} className="sm:col-span-2" />
        <SelectField
          name="fulfillment"
          label="Pickup / delivery"
          required
          options={[
            { value: "to_be_confirmed", label: "To be confirmed at quotation" },
            { value: "installed", label: "Installed on site" },
            { value: "pickup", label: "Pickup at warehouse" },
            { value: "delivery", label: "Delivery" },
            { value: "pickup_or_delivery", label: "Pickup or delivery" },
          ]}
        />
        <TextField name="fulfillment_notes" label="Pickup / delivery notes" maxLength={600} />
        <TextArea name="warranty_terms" label="Warranty terms" maxLength={2000} rows={3} className="sm:col-span-2" hint="Leave blank to show the general warranty text from Settings (currently “to be confirmed”). Do not enter terms that are not confirmed." />
      </Fieldset>

      <Fieldset legend="Display and internal">
        <CheckboxField name="featured" label="Featured on the home page" />
        <CheckboxField name="is_sample" label="Sample / demonstration content" hint="Sample items are hidden on the production site. Untick once the content is real and approved." />
        <TextArea name="admin_notes" label="Internal notes (never shown publicly)" maxLength={2000} rows={3} className="sm:col-span-2" />
      </Fieldset>
    </AdminForm>
  );
}
