import { NotFoundContent } from "@/components/content/NotFoundContent";

export const metadata = { title: "Page not found", robots: { index: false } };

/** Rendered inside the site layout (which already provides <main>). */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
