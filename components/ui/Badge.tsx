import type { ReactNode } from "react";

type Tone = "neutral" | "sample" | "pending" | "promo" | "ended" | "ok" | "dark" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-steel-100 text-steel-800 border-steel-200",
  sample: "bg-white text-steel-800 border-steel-400 border-dashed",
  pending: "bg-warn-50 text-warn-800 border-[#f0d39a]",
  promo: "bg-gold-100 text-gold-800 border-gold-200",
  ended: "bg-steel-100 text-steel-700 border-steel-300",
  ok: "bg-ok-50 text-ok-700 border-[#b7e2c6]",
  dark: "bg-steel-900 text-white border-steel-900",
  danger: "bg-danger-50 text-danger-700 border-[#f3c3be]",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border max-w-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Marks demo records in the proposal preview. Never shown in production (samples are hidden there). */
export function SampleBadge({ label = "Sample" }: { label?: string }) {
  return (
    <Badge tone="sample">
      <span aria-hidden="true">◇</span> {label}
    </Badge>
  );
}

/** Marks copy awaiting owner confirmation (preview only). */
export function PendingBadge() {
  return (
    <Badge tone="pending">
      <span aria-hidden="true">!</span> Awaiting confirmation
    </Badge>
  );
}
