import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { LandingFooter, LandingHeader } from "@/features/landing";
import { EMAIL_SOPORTE } from "@/features/landing/data/landing-content";

export const metadata: Metadata = {
  title: "Soporte — Cinesfera",
  description: "¿Tenés un problema con tu cuenta o con la plataforma? Escribinos y te ayudamos.",
};

const ASUNTO = "Consulta de soporte — Cinesfera";

export default function SoportePage() {
  return (
    <>
      <LandingHeader />

      <main className="flex-1">
        <div className="hero-halo">
          <div className="mx-auto max-w-3xl px-6 pt-10 pb-6 sm:pt-12">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Soporte
            </h1>
            <p className="mt-2 text-sm text-pretty text-ink-400 sm:text-base">
              ¿Algo no funciona o tenés una duda sobre tu cuenta? Escribinos y te respondemos.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 pt-8 pb-16">
          <section
            aria-labelledby="contacto"
            className="rounded-2xl border border-white/10 bg-night-900/60 p-6 sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-400"
              >
                <EnvelopeSimpleIcon weight="bold" className="size-6" />
              </span>
              <div className="min-w-0">
                <h2 id="contacto" className="font-display text-lg font-bold text-ink-100">
                  Escribinos por correo
                </h2>
                <p className="mt-1 text-sm break-all text-ink-300 select-all">{EMAIL_SOPORTE}</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-400">Para ayudarte más rápido, contanos:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-300 marker:text-ink-500">
              <li>tu nombre de usuario,</li>
              <li>qué estabas haciendo y qué pasó,</li>
              <li>en qué dispositivo y navegador.</li>
            </ul>

            <a
              href={`mailto:${EMAIL_SOPORTE}?subject=${encodeURIComponent(ASUNTO)}`}
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-400 active:scale-[0.97]"
            >
              <EnvelopeSimpleIcon weight="bold" className="size-4" />
              Enviar un correo
            </a>
          </section>
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
