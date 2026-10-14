"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry?: () => void }) {
  useEffect(() => {
    console.error("[site] render error", error.digest ?? "");
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="text-3xl font-extrabold text-steel-950">Something went wrong loading this page.</h1>
      <p className="mt-3 text-lg text-steel-600">Please try again. If it keeps happening, call or message us — our contact details are below.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {retry && (
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white hover:bg-steel-800"
          >
            Try again
          </button>
        )}
        <Link href="/contact" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border-2 border-steel-900 px-5 font-semibold">
          Contact us
        </Link>
      </div>
    </div>
  );
}
