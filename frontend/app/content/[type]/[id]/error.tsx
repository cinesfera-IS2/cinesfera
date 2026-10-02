"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useEffect } from "react";


export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">
          No pudimos cargar esta ficha
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Hubo un problema al consultar el catálogo.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600"
        >
          <ArrowClockwiseIcon weight="bold" className="size-4" />
          Volver a intentar
        </button>
      </div>
    </main>
  );
}
