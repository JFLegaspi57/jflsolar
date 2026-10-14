import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "light" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-gold-500 text-steel-950 hover:bg-gold-400 active:bg-gold-600",
  secondary: "border-2 border-steel-900 text-steel-900 hover:bg-steel-900 hover:text-white",
  dark: "bg-steel-900 text-white hover:bg-steel-800",
  ghost: "text-steel-900 underline-offset-4 hover:underline",
  light: "border-2 border-white/80 text-white hover:bg-white hover:text-steel-950",
  danger: "bg-danger-700 text-white hover:bg-[#93190f]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-11 px-3.5 text-sm",
  md: "min-h-11 px-5 text-[0.95rem]",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
