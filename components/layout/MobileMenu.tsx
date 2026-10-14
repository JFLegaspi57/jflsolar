"use client";

import Link from "next/link";
import { useRef } from "react";
import { mainNav, quoteHref } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { useIsActive } from "./NavLinks";

export interface MenuContact {
  label: string;
  href: string;
  detail: string;
}

/**
 * Full-height navigation sheet built on native <dialog>.showModal(): focus
 * moves into the dialog, the page behind is inert, Escape closes it and focus
 * returns to the menu button (DECISIONS.md D11).
 */
export function MobileMenu({ contacts }: { contacts: MenuContact[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isActive = useIsActive();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-steel-900 hover:bg-steel-100 lg:hidden"
        aria-haspopup="dialog"
        aria-controls="mobile-menu"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Icon name="menu" className="size-6" />
        <span className="sr-only">Open menu</span>
      </button>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-label="Menu"
        className="sheet bg-white text-steel-900 shadow-2xl"
        onClick={(e) => {
          if (e.target === dialogRef.current) close(); // click on backdrop
        }}
      >
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between border-b border-steel-200 px-4 py-3">
            <span className="font-display text-lg font-bold">Menu</span>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-steel-100"
              autoFocus
            >
              <Icon name="x" className="size-6" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main" className="px-2 py-3">
            <ul>
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex min-h-12 items-center justify-between rounded-[var(--radius-control)] px-3 text-lg font-semibold hover:bg-steel-50 aria-[current=page]:bg-gold-50 aria-[current=page]:text-steel-950"
                  >
                    {item.label}
                    <Icon name="arrow" className="size-4 text-steel-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-3 border-t border-steel-200 p-4">
            <Link
              href={quoteHref}
              onClick={close}
              className="flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-gold-500 font-semibold text-steel-950 hover:bg-gold-400"
            >
              Request a Quote
            </Link>
            <ul className="space-y-1">
              {contacts.map((c) => (
                <li key={c.href}>
                  <a href={c.href} className="flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-2 hover:bg-steel-50">
                    <Icon name={c.label === "Call" ? "phone" : "chat"} className="size-5 text-gold-800" />
                    <span>
                      <span className="block text-sm text-steel-600">{c.label}</span>
                      <span className="block font-semibold tabular">{c.detail}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </dialog>
    </>
  );
}
