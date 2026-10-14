import Link from "next/link";
import { cacheLife } from "next/cache";
import { getSettings } from "@/lib/content/public";
import { contactChannels } from "@/lib/contact";
import { brand, mainNav } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "./Logo";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function SiteFooter() {
  const settings = await getSettings();
  const channels = contactChannels(settings);

  return (
    <footer className="on-dark bg-steel-950 text-steel-200">
      <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Logo plate />
          <p className="max-w-xs text-sm text-steel-300">{brand.description}</p>
          <p className="text-sm font-semibold text-white">{settings.service_area}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">Explore</h2>
          <ul className="space-y-1 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-9 items-center hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">Contact</h2>
          <ul className="space-y-1 text-sm">
            {channels.map((c) => (
              <li key={c.key}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex min-h-9 items-center gap-2 hover:text-white hover:underline"
                >
                  <span className="text-steel-400">{c.label}:</span> <span className="tabular">{c.detail}</span>
                  {c.external && <span className="sr-only">(opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-wide text-white uppercase">
              <Icon name="building" className="size-4 text-gold-500" /> Office
            </h2>
            <address className="not-italic">{settings.office_address}</address>
          </div>
          {settings.warehouse_address && (
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-wide text-white uppercase">
                <Icon name="warehouse" className="size-4 text-gold-500" /> Warehouse
              </h2>
              <address className="not-italic">{settings.warehouse_address}</address>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[76rem] flex-col gap-2 px-4 py-5 text-xs text-steel-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © <CopyrightYear /> {brand.name}. All rights reserved.
          </p>
          <ul className="flex gap-4">
            <li>
              <Link href="/privacy" className="inline-flex min-h-9 items-center hover:text-white hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="inline-flex min-h-9 items-center hover:text-white hover:underline">
                Terms of use
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
