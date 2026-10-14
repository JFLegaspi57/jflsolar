import { billRanges, inquiryTypes } from "../labels";

export const FIELD_LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  message: 3000,
  location: 120,
} as const;

export const MESSAGE_MIN = 10;

export interface InquiryValues {
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  location: string;
  bill_range: string;
  item_type: "" | "package" | "product";
  item_slug: string;
  item_name: string; // display only; re-resolved server-side
}

export type InquiryField = "name" | "email" | "phone" | "contact" | "inquiry_type" | "message" | "location" | "bill_range" | "item";
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export const emptyInquiry: InquiryValues = {
  name: "",
  email: "",
  phone: "",
  inquiry_type: "",
  message: "",
  location: "",
  bill_range: "",
  item_type: "",
  item_slug: "",
  item_name: "",
};

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
const PHONE_CHARS = /^[0-9+()\-.\s]+$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Collapse control characters and trim; cap to the field limit. */
export function clean(raw: unknown, max: number, multiline = false): string {
  if (typeof raw !== "string") return "";
  const s = multiline ? raw.replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ") : raw.replace(/\s+/g, " ");
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

export function readInquiry(fd: FormData): InquiryValues {
  const itemType = fd.get("item_type");
  return {
    name: clean(fd.get("name"), FIELD_LIMITS.name),
    email: clean(fd.get("email"), FIELD_LIMITS.email).toLowerCase(),
    phone: clean(fd.get("phone"), FIELD_LIMITS.phone),
    inquiry_type: clean(fd.get("inquiry_type"), 40),
    message: clean(fd.get("message"), FIELD_LIMITS.message, true),
    location: clean(fd.get("location"), FIELD_LIMITS.location),
    bill_range: clean(fd.get("bill_range"), 20),
    item_type: itemType === "package" || itemType === "product" ? itemType : "",
    item_slug: clean(fd.get("item_slug"), 80),
    item_name: clean(fd.get("item_name"), 160),
  };
}

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

/** Validates only what was supplied; at least one usable contact method is required. */
export function validateInquiry(v: InquiryValues): InquiryErrors {
  const e: InquiryErrors = {};
  if (v.name.length < 2) e.name = "Enter your name.";

  if (v.email && !EMAIL_RE.test(v.email)) e.email = "Enter a valid email address, like name@example.com.";
  if (v.phone) {
    const digits = phoneDigits(v.phone).length;
    if (!PHONE_CHARS.test(v.phone) || digits < 7 || digits > 15) e.phone = "Enter a valid phone number, like 0917 123 4567.";
  }
  if (!v.email && !v.phone) e.contact = "Give us a phone number or an email address so we can reply.";

  if (!inquiryTypes.some((t) => t.value === v.inquiry_type)) e.inquiry_type = "Choose what your inquiry is about.";
  if (v.message.length < MESSAGE_MIN) e.message = `Tell us a little more (at least ${MESSAGE_MIN} characters).`;
  if (v.bill_range && !billRanges.some((b) => b.value === v.bill_range)) e.bill_range = "Choose a bill range from the list.";
  if (v.item_slug && (!v.item_type || !SLUG_RE.test(v.item_slug))) e.item = "The selected item is not valid. Remove it and try again.";
  return e;
}

/** Inquiry types for which the electricity-bill question is useful. */
export const BILL_RELEVANT = new Set(["", "residential", "commercial", "consultancy", "package"]);
