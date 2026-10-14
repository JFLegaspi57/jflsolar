import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export function NotFoundContent() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-20">
      <p className="font-display text-sm font-bold tracking-wide text-gold-800 uppercase">Error 404</p>
      <h1 className="mt-2 text-4xl font-extrabold text-steel-950">We couldn’t find that page.</h1>
      <p className="mt-4 text-lg text-steel-600">It may have moved, or the package or product may no longer be listed.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/">Go to the home page</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact us
        </ButtonLink>
      </div>
      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-steel-800">
        {[
          ["/packages", "Packages"],
          ["/products", "Products"],
          ["/services", "Solar Services"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="inline-flex min-h-11 items-center font-semibold underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
