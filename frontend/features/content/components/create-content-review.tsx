
"use client";

import { ChatCircleTextIcon, XIcon } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import type { TipoContenido } from "@/features/content/types";

type CreateContentReviewProps = {
  tipo: TipoContenido;
  tmdbId: number;
  usuarioId: string;
  resenaPadreId?: string;
  onPublicada: () => void;
};

export function CreateContentReview({
  tipo,
  tmdbId,
  usuarioId,
  resenaPadreId,
  onPublicada,
}: CreateContentReviewProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRespuesta = Boolean(resenaPadreId);

  function abrir() {
    setError(null);
    dialogo.current?.showModal();
  }

  function cerrar() {
    if (!enviando) dialogo.current?.close();
  }

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);

    const texto = String(campos.get("texto") ?? "").trim();
    const calificacion = Number(campos.get("calificacion"));

    if (!texto) {
      setError("Escribí una reseña antes de publicarla.");
      return;
    }

    setError(null);
    setEnviando(true);

    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>(
        "/auth/csrf",
        { cache: "no-store" }
      );

      await apiFetch(`/contenidos/${tipo}/${tmdbId}/resenas`, {
        method: "POST",
        headers: { "X-CSRF-Token": csrf_token },
        body: JSON.stringify({
          usuario_id: usuarioId,
          texto,
          calificacion,
          plataforma_id: null,
          resena_padre_id: resenaPadreId ?? null,
        }),
      });

      formulario.reset();
      dialogo.current?.close();
      onPublicada();
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos publicar la reseña. Probá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600"
      >
        <ChatCircleTextIcon className="size-4" />
        {esRespuesta ? "Responder" : "Escribir una reseña"}
      </button>

      <dialog
        ref={dialogo}
        aria-label={esRespuesta ? "Responder reseña" : "Nueva reseña"}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-night-600 bg-night-850 p-0 text-ink-100 shadow-2xl backdrop:bg-night-950/80"
      >
        <form onSubmit={publicar} className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              {esRespuesta ? "Responder reseña" : "Nueva reseña"}
            </h2>

            <button
              type="button"
              aria-label="Cerrar"
              onClick={cerrar}
              disabled={enviando}
            >
              <XIcon className="size-5" />
            </button>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            Calificación
            <select
              name="calificacion"
              defaultValue="4"
              className="rounded-lg border border-night-600 bg-night-900 p-3"
            >
              {Array.from({ length: 11 }, (_, i) => i * 0.5).map(
                (valor) => (
                  <option key={valor} value={valor}>
                    {valor.toFixed(1)} de 5
                  </option>
                )
              )}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            {esRespuesta ? "Tu respuesta" : "Tu reseña"}
            <textarea
              name="texto"
              rows={5}
              minLength={1}
              maxLength={5000}
              required
              placeholder="Escribí tu opinión..."
              className="rounded-lg border border-night-600 bg-night-900 p-3"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              className="rounded-full border border-night-600 px-5 py-2"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-brand-500 px-5 py-2 font-bold text-white disabled:opacity-50"
            >
              {enviando ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
