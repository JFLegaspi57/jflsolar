// Centralised, code-level business constants. Editable contact details live in
// the database (Admin → Settings); these are the fixed brand facts.

export const brand = {
  name: "JFL Solar",
  tagline: "PV System Solutions",
  audiences: "For residential, industrial and commercial",
  description:
    "Solar PV installation, consultancy and equipment distribution for homes and businesses across the Philippines.",
} as const;

export const mainNav = [
  { href: "/services", label: "Solar Services" },
  { href: "/packages", label: "Packages" },
  { href: "/products", label: "Products" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const quoteHref = "/contact#quote";

export function telHref(e164: string) {
  return `tel:${e164}`;
}

export function whatsappHref(e164: string) {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}

/** Viber deep link; opens the Viber app if installed. */
export function viberHref(e164: string) {
  return `viber://chat?number=${encodeURIComponent(e164)}`;
}
