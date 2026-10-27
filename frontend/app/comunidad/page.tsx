import type { Metadata } from "next";
import { LandingFooter, LandingHeader } from "@/features/landing";
import { BuscadorUsuarios } from "@/features/users/components/buscador-usuarios";

export const metadata: Metadata = {
  title: "Comunidad — Cinesfera",
  description: "Encontrá personas de la comunidad y seguí sus reseñas.",
};

export default function ComunidadPage() {
  return (
    <>
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Comunidad</h1>
        <p className="mt-2 mb-8 text-ink-400">Encontrá personas de la comunidad y seguí sus reseñas.</p>
        <BuscadorUsuarios />
      </main>
      <LandingFooter />
    </>
  );
}
