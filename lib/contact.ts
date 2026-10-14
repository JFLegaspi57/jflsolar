import type { SiteSettings } from "./types";
import { telHref, viberHref, whatsappHref } from "./site";

export type ChannelKey = "phone" | "whatsapp" | "viber" | "messenger" | "facebook" | "email";

export interface ContactChannel {
  key: ChannelKey;
  label: string;
  detail: string;
  href: string;
  external: boolean;
}

/** Enabled public contact channels, in priority order. Disabled/unverified channels are omitted. */
export function contactChannels(s: SiteSettings): ContactChannel[] {
  const list: ContactChannel[] = [{ key: "phone", label: "Call", detail: s.phone_display, href: telHref(s.phone_e164), external: false }];
  if (s.whatsapp_enabled && s.whatsapp_e164) {
    list.push({ key: "whatsapp", label: "WhatsApp", detail: s.messaging_display ?? s.whatsapp_e164, href: whatsappHref(s.whatsapp_e164), external: true });
  }
  if (s.viber_enabled && s.viber_e164) {
    list.push({ key: "viber", label: "Viber", detail: s.messaging_display ?? s.viber_e164, href: viberHref(s.viber_e164), external: false });
  }
  if (s.messenger_enabled && s.messenger_url) {
    list.push({ key: "messenger", label: "Messenger", detail: "Message us on Facebook", href: s.messenger_url, external: true });
  }
  if (s.facebook_enabled && s.facebook_url) {
    list.push({ key: "facebook", label: "Facebook", detail: "JFL Solar on Facebook", href: s.facebook_url, external: true });
  }
  if (s.public_email) {
    list.push({ key: "email", label: "Email", detail: s.public_email, href: `mailto:${s.public_email}`, external: false });
  }
  return list;
}
