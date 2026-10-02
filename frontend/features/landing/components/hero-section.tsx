import { ArrowRightIcon, CompassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
      {/* Halo azul que baja desde el borde superior */}
      <div
        aria-hidden
        className="hero-halo pointer-events-none absolute inset-x-0 -top-64 h-[42rem]"
      />
      {/* Esfera luminosa que asoma por el borde superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-[26rem] size-[32rem] -translate-x-1/2 rounded-full bg-brand-500/45 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-[27rem] size-[34rem] -translate-x-1/2 rounded-full bg-glow-400/20 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl md:text-6xl">
          Tu próxima película favorita empieza acá
        </h1>

        <p className="max-w-xl text-base text-ink-400 text-pretty">
          Descubre, puntúa y comparte tus películas y series favoritas junto a
          una comunidad que vive el cine tanto como vos.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/catalogo"
              className="group inline-flex items-center gap-2.5 rounded-full bg-linear-to-r from-brand-500 to-glow-400 px-9 py-4 font-display text-base font-extrabold text-white shadow-xl shadow-glow-400/30 ring-1 ring-white/20 transition hover:shadow-glow-400/50 hover:brightness-110"
            >
              <CompassIcon weight="bold" className="size-5" />
              Explorar el catálogo
              <ArrowRightIcon
                weight="bold"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center rounded-full border border-white/20 px-8 py-4 font-display text-sm font-bold text-ink-100 transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Crear cuenta gratis
            </Link>
          </div>

          <p className="text-sm text-ink-400">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 transition-colors hover:text-ink-100"
            >
              Inicia sesión acá
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
