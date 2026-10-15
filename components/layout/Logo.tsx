import Image from "next/image";
import Link from "next/link";
import logo from "@/public/brand/jfl-solar-logo.png";
import symbol from "@/public/brand/jfl-symbol.png";

/**
 * Owner-supplied lockup with its white background made transparent (see
 * scripts/build-brand-assets.mjs). The lettering is dark slate, so on dark
 * surfaces pass `plate` to sit it on a deliberate white plate.
 */
export function Logo({ plate = false, priority = false, className = "" }: { plate?: boolean; priority?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center rounded-[var(--radius-control)] ${plate ? "bg-white p-2.5" : ""} ${className}`}
      aria-label="JFL Solar — home"
    >
      <Image
        src={logo}
        alt=""
        priority={priority}
        sizes="(min-width: 1024px) 190px, (min-width: 640px) 150px, 132px"
        className="h-auto w-[132px] sm:w-[150px] lg:w-[190px]"
      />
    </Link>
  );
}

export function LogoSymbol({ className = "size-10" }: { className?: string }) {
  return <Image src={symbol} alt="" sizes="48px" className={className} />;
}
