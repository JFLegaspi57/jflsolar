"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/site";

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center px-3 text-[0.95rem] font-semibold transition-colors ${
                  active ? "text-steel-950" : "text-steel-700 hover:text-steel-950"
                }`}
              >
                {item.label}
                {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-1 h-[3px] rounded bg-gold-500" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
