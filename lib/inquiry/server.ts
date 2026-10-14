import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { brand } from "../site";
import { billRanges, inquiryTypes } from "../labels";
import { getSigningSecret, inquiryConfig, isInquiryDeliveryConfigured } from "../env.server";
import { createServiceClient } from "../supabase/clients";
import type { InquiryValues } from "./schema";

// ---------------------------------------------------------------------------
// Form tokens: proof the form was rendered by us, minimum fill time, expiry.
// ---------------------------------------------------------------------------
export const MIN_FILL_MS = 3000;
export const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string) => createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");

export function issueToken(now = Date.now()): string {
  const payload = b64(JSON.stringify({ iat: now, n: randomUUID() }));
  return `${payload}.${sign(payload)}`;
}

export type TokenCheck = { ok: true; nonce: string } | { ok: false; reason: "invalid" | "too_fast" | "expired" };

export function checkToken(token: string, now = Date.now()): TokenCheck {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { ok: false, reason: "invalid" };
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" };
  try {
    const { iat, n } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { iat: number; n: string };
    if (typeof iat !== "number" || typeof n !== "string") return { ok: false, reason: "invalid" };
    if (now - iat < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
    if (now - iat > TOKEN_TTL_MS) return { ok: false, reason: "expired" };
    return { ok: true, nonce: n };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

// ---------------------------------------------------------------------------
// Rate limiting (salted IP hash; raw IPs are never stored or logged)
// ---------------------------------------------------------------------------
export const CLIENT_LIMIT = 5;
export const CLIENT_WINDOW_S = 600;

export function clientHash(ip: string) {
  return createHash("sha256").update(`${getSigningSecret()}|ip|${ip}`).digest("hex");
}

export type RateResult = "ok" | "client_limited" | "global_limited" | "unavailable";

/**
 * Shared, persistent limiter (Postgres via the service-role key). Fails CLOSED:
 * if the limiter cannot be reached no email is sent and the visitor is pointed
 * to phone/WhatsApp/Viber. Only called when live delivery is configured.
 */
export async function rateCheck(ip: string): Promise<RateResult> {
  const db = createServiceClient();
  if (!db) {
    console.error("[inquiry] rate limiter unavailable: SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY not set");
    return "unavailable";
  }
  const { data, error } = await db.rpc("inquiry_rate_check", {
    p_client_hash: clientHash(ip),
    p_client_limit: CLIENT_LIMIT,
    p_window_seconds: CLIENT_WINDOW_S,
    p_daily_cap: inquiryConfig.dailyCap,
  });
  if (error || (data !== "ok" && data !== "client_limited" && data !== "global_limited")) {
    console.error("[inquiry] rate check failed:", error?.code ?? "unexpected result");
    return "unavailable";
  }
  return data;
}

// ---------------------------------------------------------------------------
// Delivery via Resend
// ---------------------------------------------------------------------------
export type DeliveryResult = { ok: true } | { ok: false; reason: "not_configured" | "provider_error" };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildEmail(v: InquiryValues, itemLabel: string | null) {
  const type = inquiryTypes.find((t) => t.value === v.inquiry_type)?.label ?? v.inquiry_type;
  const bill = billRanges.find((b) => b.value === v.bill_range)?.label;
  const rows: [string, string][] = [
    ["Name", v.name],
    ["Phone", v.phone || "—"],
    ["Email", v.email || "—"],
    ["Inquiry type", type],
    ...(itemLabel ? ([["Selected item", itemLabel]] as [string, string][]) : []),
    ["Location", v.location || "—"],
    ...(bill && v.bill_range ? ([["Monthly bill", bill]] as [string, string][]) : []),
  ];
  const subject = `Website inquiry: ${type}${itemLabel ? ` — ${itemLabel}` : ""} (${v.name})`.slice(0, 200);
  const text = `${rows.map(([k, val]) => `${k}: ${val}`).join("\n")}\n\nMessage:\n${v.message}\n\n— Sent from the ${brand.name} website inquiry form`;
  const html = `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
    .map(([k, val]) => `<tr><th align="left" style="background:#f0f2f5">${esc(k)}</th><td>${esc(val)}</td></tr>`)
    .join("")}</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${esc(v.message)}</p><p style="color:#5b6574;font-size:12px">Sent from the ${esc(brand.name)} website inquiry form.</p>`;
  return { subject, text, html };
}

export function idempotencyKey(nonce: string, v: InquiryValues) {
  return createHash("sha256").update(`${nonce}|${JSON.stringify(v)}`).digest("hex").slice(0, 48);
}

export async function deliverInquiry(v: InquiryValues, itemLabel: string | null, nonce: string): Promise<DeliveryResult> {
  if (!isInquiryDeliveryConfigured) return { ok: false, reason: "not_configured" };
  const { subject, text, html } = buildEmail(v, itemLabel);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inquiryConfig.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey(nonce, v),
      },
      body: JSON.stringify({
        from: inquiryConfig.from,
        to: inquiryConfig.to.split(",").map((s) => s.trim()).filter(Boolean),
        subject,
        text,
        html,
        ...(v.email ? { reply_to: v.email } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    console.error("[inquiry] provider rejected the message: HTTP", res.status);
    return { ok: false, reason: "provider_error" };
  } catch (err) {
    console.error("[inquiry] provider request failed:", err instanceof Error ? err.name : "unknown");
    return { ok: false, reason: "provider_error" };
  }
}
