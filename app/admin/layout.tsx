import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | JFL Solar" },
  robots: { index: false, follow: false },
};

// Every admin page depends on the signed-in session.
export const instant = false;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-steel-50">{children}</div>;
}
