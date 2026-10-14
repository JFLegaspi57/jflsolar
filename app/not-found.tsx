import { Logo } from "@/components/layout/Logo";
import { NotFoundContent } from "@/components/content/NotFoundContent";

export const metadata = { title: "Page not found", robots: { index: false } };

/** Unmatched URLs (no site layout). In-site notFound() uses app/(site)/not-found.tsx. */
export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="border-b border-steel-200 px-4 py-4 sm:px-8">
        <Logo />
      </div>
      <NotFoundContent />
    </main>
  );
}
