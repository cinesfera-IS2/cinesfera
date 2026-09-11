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
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-brand-500 px-8 py-3.5 font-display text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            Crear cuenta gratis
          </Link>

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
