"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/content", label: "Site content" },
  { href: "/admin/settings", label: "Contact & settings" },
  { href: "/admin/staff", label: "Staff", ownerOnly: true },
];

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items
          .filter((i) => !i.ownerOnly || isOwner)
          .map((i) => (
            <li key={i.href} className="shrink-0">
              <Link
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className="flex min-h-11 items-center rounded-[var(--radius-control)] px-3 text-[0.95rem] font-semibold whitespace-nowrap text-steel-200 hover:bg-white/10 hover:text-white aria-[current=page]:bg-gold-500 aria-[current=page]:text-steel-950"
              >
                {i.label}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
