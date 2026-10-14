import Link from "next/link";
import { getSettings } from "@/lib/content/public";
import { contactChannels } from "@/lib/contact";
import { quoteHref, telHref } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "./Logo";
import { DesktopNav } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";

export async function SiteHeader() {
  const settings = await getSettings();
  const contacts = contactChannels(settings)
    .filter((c) => c.key === "phone" || c.key === "whatsapp" || c.key === "viber")
    .map(({ label, href, detail }) => ({ label, href, detail }));

  return (
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-[4.5rem] max-w-[76rem] items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:h-20 lg:px-8">
        <Logo priority />
        <div className="ml-auto flex items-center gap-1 lg:gap-4">
          <DesktopNav />
          <a
            href={telHref(settings.phone_e164)}
            className="hidden min-h-11 items-center gap-2 px-2 text-sm font-semibold text-steel-800 hover:text-steel-950 xl:inline-flex"
          >
            <Icon name="phone" className="size-4 text-gold-800" />
            <span className="tabular">{settings.phone_display}</span>
          </a>
          <Link
            href={quoteHref}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-gold-500 px-3.5 text-sm font-semibold whitespace-nowrap text-steel-950 hover:bg-gold-400 sm:px-4 sm:text-[0.95rem]"
          >
            <span className="sm:hidden">Get a quote</span>
            <span className="hidden sm:inline">Request a Quote</span>
          </Link>
          <MobileMenu contacts={contacts} />
        </div>
      </div>
    </header>
  );
}
