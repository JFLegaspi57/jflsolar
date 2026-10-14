import type { InquiryErrors, InquiryValues } from "./schema";

export type InquiryStatus = "idle" | "invalid" | "error" | "limited" | "sent" | "demo";

export interface InquiryState {
  status: InquiryStatus;
  message: string | null;
  errors: InquiryErrors;
  values: InquiryValues;
  /** Current form token (a fresh one is issued when the old one expired). */
  token: string;
  /** Increments on every server response so the form re-mounts with `values`. */
  attempt: number;
}
