import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { TrendingCard } from "@/features/landing/components/trending-card";
import { TRENDING_TITLES } from "@/features/landing/data/landing-content";

export function TrendingSection() {
  return (
    <section id="tendencias" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Tendencias de la Semana
            </h2>
            <p className="mt-1.5 text-sm text-ink-400">
              Las producciones que están dando de qué hablar en la comunidad hoy.
            </p>
          </div>

          <Link
            href="#tendencias"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-glow-400 transition-colors hover:text-glow-300"
          >
            Ver todas las tendencias
            <CaretRightIcon weight="bold" className="size-4" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRENDING_TITLES.map((item) => (
            <li key={item.id}>
              <TrendingCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
