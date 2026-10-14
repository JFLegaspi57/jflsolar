import { contactChannels } from "@/lib/contact";
import type { SiteSettings } from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/Icon";

const icons: Record<string, IconName> = {
  phone: "phone",
  whatsapp: "chat",
  viber: "chat",
  messenger: "chat",
  facebook: "facebook",
  email: "mail",
};

/** Direct contact routes (always usable, including while the form is in demo mode). */
export function ContactRoutes({ settings, dark = false }: { settings: SiteSettings; dark?: boolean }) {
  const channels = contactChannels(settings);
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {channels.map((c) => (
        <li key={c.key}>
          <a
            href={c.href}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] border px-4 py-2.5 transition-colors ${
              dark ? "border-white/15 bg-white/5 hover:bg-white/10" : "border-steel-200 bg-white hover:border-steel-400"
            }`}
          >
            <span className={`inline-flex size-9 items-center justify-center rounded-full ${dark ? "bg-gold-500 text-steel-950" : "bg-steel-900 text-white"}`}>
              <Icon name={icons[c.key]} className="size-[1.1rem]" />
            </span>
            <span>
              <span className={`block text-xs font-semibold tracking-wide uppercase ${dark ? "text-steel-300" : "text-steel-600"}`}>{c.label}</span>
              <span className="block font-semibold tabular">{c.detail}</span>
            </span>
            {c.external && <span className="sr-only">(opens in a new tab)</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Addresses({ settings }: { settings: SiteSettings }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[var(--radius-control)] border border-steel-200 bg-white p-4">
        <dt className="flex items-center gap-2 text-sm font-bold tracking-wide text-steel-950 uppercase">
          <Icon name="building" className="size-4 text-gold-800" /> Office
        </dt>
        <dd className="mt-1.5 text-steel-700">
          <address className="not-italic">{settings.office_address}</address>
          <p className="mt-1 text-sm text-steel-600">Main office.</p>
        </dd>
      </div>
      {settings.warehouse_address && (
        <div className="rounded-[var(--radius-control)] border border-steel-200 bg-white p-4">
          <dt className="flex items-center gap-2 text-sm font-bold tracking-wide text-steel-950 uppercase">
            <Icon name="warehouse" className="size-4 text-gold-800" /> Warehouse
          </dt>
          <dd className="mt-1.5 text-steel-700">
            <address className="not-italic">{settings.warehouse_address}</address>
            <p className="mt-1 text-sm text-steel-600">Equipment warehouse. Pickup details are confirmed with your quotation.</p>
          </dd>
        </div>
      )}
      {settings.business_hours && (
        <div className="sm:col-span-2">
          <dt className="text-sm font-bold text-steel-950">Business hours</dt>
          <dd className="text-steel-700">{settings.business_hours}</dd>
        </div>
      )}
    </dl>
  );
}
