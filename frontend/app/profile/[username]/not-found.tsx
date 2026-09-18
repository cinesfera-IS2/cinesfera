import { FilmSlateIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { LandingFooter, LandingHeader } from "@/features/landing";

export default function PerfilNoEncontrado() {
  return (
    <>
      <LandingHeader />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
        <div
          aria-hidden
          className="hero-halo pointer-events-none absolute inset-x-0 -top-64 h-[36rem]"
        />

        <div className="relative flex max-w-md flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full border border-night-600 bg-night-850 text-ink-400">
            <FilmSlateIcon className="size-7" />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-100">
            No encontramos ese perfil
          </h1>
          <p className="text-sm text-ink-400 text-pretty">
            Puede que la persona haya cambiado su nombre de usuario o que el
            enlace esté mal escrito.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
          >
            Volver al inicio
          </Link>
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
