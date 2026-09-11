import Link from "next/link";

import { BrandLogo } from "@/features/landing/components/brand-logo";
import { NAV_LINKS } from "@/features/landing/data/landing-content";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-night-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <BrandLogo />

        <div className="flex items-center gap-8">
          <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={index === 0 ? "page" : undefined}
                className={
                  index === 0
                    ? "text-sm font-medium text-ink-100"
                    : "text-sm font-medium text-ink-400 transition-colors hover:text-ink-100"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-100 transition-colors hover:border-white/40 hover:bg-white/5"
          >
            Acceder
          </Link>
        </div>
      </div>
    </header>
  );
}
