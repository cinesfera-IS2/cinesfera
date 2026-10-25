"use client";

import { useRef, useState, type FormEvent } from "react";

import type { CalificacionActualizada, TipoContenido } from "@/features/content/types";
import { SelectorCalificacion } from "@/features/content/components/selector-calificacion";
import { apiFetch } from "@/lib/api";

type EditContentRatingProps = {
  tipo: TipoContenido;
  tmdbId: number;
  resenaId: string;
  calificacion: number;
  onActualizada: (valoracion: CalificacionActualizada) => void;
};

export function EditContentRating({
  tipo, tmdbId, resenaId, calificacion, onActualizada,
}: EditContentRatingProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [apertura, setApertura] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setApertura((actual) => actual + 1);
    setError(null);
    dialogo.current?.showModal();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const puntaje = Number(new FormData(evento.currentTarget).get("calificacion"));
    setError(null);
    setEnviando(true);
    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>("/auth/csrf", { cache: "no-store" });
      const actualizada = await apiFetch<CalificacionActualizada>(
        `/contenidos/${tipo}/${tmdbId}/resenas/${resenaId}/valoracion`,
        {
          method: "PATCH",
          headers: { "X-CSRF-Token": csrf_token },
          body: JSON.stringify({ calificacion: puntaje }),
        },
      );
      onActualizada(actualizada);
      dialogo.current?.close();
    } catch {
      setError("No pudimos actualizar la valoración. Tu puntuación guardada se conserva. Probá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button type="button" onClick={abrir} className="rounded-full border border-night-600 px-5 py-2 text-sm font-bold hover:border-glow-400">
        Editar valoración
      </button>
      <dialog
        ref={dialogo}
        aria-label="Editar valoración"
        onCancel={(evento) => { if (enviando) evento.preventDefault(); }}
        className="m-auto w-[min(30rem,calc(100vw-1rem))] rounded-2xl border border-night-600 bg-night-850 p-4 text-ink-100 shadow-2xl backdrop:bg-night-950/80 sm:p-6"
      >
        <form onSubmit={guardar} className="flex flex-col gap-5">
          <h2 className="font-display text-xl font-bold">Editar valoración</h2>
          <p className="text-sm text-ink-400">Modificá tu puntuación de esta reseña. Tu comentario se conserva.</p>
          <fieldset disabled={enviando}>
            <SelectorCalificacion key={apertura} name="calificacion" valorInicial={calificacion} />
          </fieldset>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" disabled={enviando} onClick={() => dialogo.current?.close()} className="rounded-full border border-night-600 px-5 py-2">
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="rounded-full bg-brand-500 px-5 py-2 font-bold text-white disabled:opacity-50">
              {enviando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
