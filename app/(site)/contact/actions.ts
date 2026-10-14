"use server";

import { headers } from "next/headers";
import { getPublicSnapshot } from "@/lib/content/public";
import { isInquiryDeliveryConfigured } from "@/lib/env.server";
import { emptyInquiry, readInquiry, validateInquiry } from "@/lib/inquiry/schema";
import { MIN_FILL_MS, checkToken, deliverInquiry, issueToken, rateCheck } from "@/lib/inquiry/server";
import type { InquiryState } from "@/lib/inquiry/state";

export async function submitInquiry(prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const values = readInquiry(formData);
  const token = String(formData.get("token") ?? "");
  const base = { values, token, attempt: prev.attempt + 1, errors: {} };

  // Honeypot: real visitors never see or fill this field. Bots get a neutral
  // response and nothing is sent.
  if (String(formData.get("website") ?? "").trim()) {
    return { ...base, values: emptyInquiry, status: isInquiryDeliveryConfigured ? "sent" : "demo", message: null };
  }

  const tokenCheck = checkToken(token);
  if (!tokenCheck.ok) {
    if (tokenCheck.reason === "too_fast") {
      return { ...base, status: "error", message: "That was quick! Please check your details, then select Send inquiry again." };
    }
    return {
      ...base,
      // Back-dated so the immediate retry is not rejected as "too fast".
      token: issueToken(Date.now() - MIN_FILL_MS),
      status: "error",
      message: "This form had expired. Your details are still here — please select Send inquiry again.",
    };
  }

  const errors = validateInquiry(values);

  // Re-resolve the selected item against what is publicly visible right now.
  let itemLabel: string | null = null;
  if (values.item_slug && !errors.item) {
    const { packages, products } = await getPublicSnapshot();
    const found =
      values.item_type === "package" ? packages.find((p) => p.slug === values.item_slug) : products.find((p) => p.slug === values.item_slug);
    if (!found) {
      values.item_type = "";
      values.item_slug = "";
      values.item_name = "";
      errors.item = "The item you selected is no longer available, so we removed it. Please check your message and send again.";
    } else {
      itemLabel = `${values.item_type === "package" ? "Package" : "Product"}: ${found.name}${found.is_sample ? " (sample listing)" : ""}`;
      values.item_name = found.name;
    }
  }

  if (Object.keys(errors).length) {
    return { ...base, status: "invalid", errors, message: "Please correct the highlighted fields." };
  }

  if (!isInquiryDeliveryConfigured) {
    // Demo mode: validated, never sent anywhere.
    return {
      ...base,
      status: "demo",
      message: "Demo only — this inquiry was checked but NOT sent. Inquiry email delivery has not been set up yet.",
    };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rate = await rateCheck(ip);
  if (rate !== "ok") {
    return {
      ...base,
      status: "limited",
      message:
        rate === "client_limited"
          ? "You've sent several inquiries in a short time. Please wait a few minutes, or contact us directly by phone or message."
          : rate === "global_limited"
            ? "Our inquiry form is busy right now. Please contact us directly by phone, WhatsApp or Viber."
            : "We couldn't send your inquiry just now. Your details are still here — please try again shortly, or contact us directly by phone, WhatsApp or Viber.",
    };
  }

  const delivered = await deliverInquiry(values, itemLabel, tokenCheck.nonce);
  if (!delivered.ok) {
    return {
      ...base,
      status: "error",
      message: "We couldn't send your inquiry just now. Your details are still here — please try again, or contact us directly.",
    };
  }

  return { ...base, values: emptyInquiry, token: issueToken(), status: "sent", message: null };
}
