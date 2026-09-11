import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { BrandLogo } from "@/features/landing/components/brand-logo";
import { FOOTER_SECTIONS } from "@/features/landing/data/landing-content";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#instagram", Icon: InstagramLogoIcon },
  { label: "X", href: "#x", Icon: XLogoIcon },
  { label: "Facebook", href: "#facebook", Icon: FacebookLogoIcon },
];

export function LandingFooter() {
  return (
    <footer
      id="comunidad"
      className="mt-8 border-t border-white/5 bg-night-900/80"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="max-w-xs">
          <BrandLogo size="sm" />
          <p className="mt-4 text-sm text-ink-400">
            La red social de cine y series definitiva. Diseñada por y para
            amantes del séptimo arte.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <nav key={section.title} aria-label={section.title} className="lg:px-6">
            <h3 className="font-display text-sm font-bold text-ink-100">
              {section.title}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-400 transition-colors hover:text-ink-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <ul className="flex items-start gap-3 lg:justify-end">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-300 transition-colors hover:border-white/25 hover:text-ink-100"
              >
                <Icon weight="fill" className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-ink-500">
          <p>© 2026 Cinesfera, Inc. Todos los derechos reservados.</p>
          <p>Hecho con pasión por el cine.</p>
        </div>
      </div>
    </footer>
  );
}
