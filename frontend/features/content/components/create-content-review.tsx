"use client";

import {
  ChatCircleTextIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useId, useRef, useState, type FormEvent } from "react";

import { SelectorCalificacion } from "@/features/content/components/selector-calificacion";
import type { TipoContenido } from "@/features/content/types";
import { ApiError, apiFetch } from "@/lib/api";

const LARGO_MAXIMO = 5000;

type CreateContentReviewProps = {
  tipo: TipoContenido;
  tmdbId: number;
  usuarioId: string;
  resenaPadreId?: string;
  permiteCalificacion?: boolean;
  /** Debajo del título del diálogo: qué se reseña o a quién se responde. */
  subtitulo?: string;
  onPublicada: () => void;
};

export function CreateContentReview({
  tipo,
  tmdbId,
  usuarioId,
  resenaPadreId,
  permiteCalificacion = true,
  subtitulo,
  onPublicada,
}: CreateContentReviewProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campoTexto = useRef<HTMLTextAreaElement>(null);
  const idTexto = useId();
  const idTitulo = useId();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [largo, setLargo] = useState(0);

  const esRespuesta = Boolean(resenaPadreId);
  const [incluirValoracion, setIncluirValoracion] = useState(!esRespuesta);
  const valorar = permiteCalificacion && incluirValoracion;
  const titulo = esRespuesta ? "Responder reseña" : "Nueva reseña";

  function abrir() {
    setError(null);
    dialogo.current?.showModal();
    campoTexto.current?.focus();
  }

  function cerrar() {
    if (!enviando) dialogo.current?.close();
  }

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);

    const texto = String(campos.get("texto") ?? "").trim();
    const calificacion = valorar ? campos.get("calificacion") : null;

    if (valorar && calificacion === null) {
      setError("Elegí una calificación marcando las estrellas.");
      return;
    }

    if (!texto) {
      setError(
        esRespuesta
          ? "Escribí tu respuesta antes de publicarla."
          : "Escribí una reseña antes de publicarla."
      );
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
          calificacion: calificacion === null ? null : Number(calificacion),
          plataforma_id: null,
          resena_padre_id: resenaPadreId ?? null,
        }),
      });

      formulario.reset();
      setIncluirValoracion(!esRespuesta);
      setLargo(0);
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
        className={
          esRespuesta
            ? "-mx-2.5 -my-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold text-ink-300 transition-[color,background-color,transform] duration-150 ease-out hover:bg-white/5 hover:text-glow-300 active:scale-[0.97]"
            : "flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-600 active:scale-[0.97]"
        }
      >
        <ChatCircleTextIcon className="size-4" />
        {esRespuesta ? "Responder" : "Escribir una reseña"}
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        // Esc no cierra mientras se publica, igual que los botones.
        onCancel={(evento) => {
          if (enviando) evento.preventDefault();
        }}
        className="dialogo-animado m-auto w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-night-850 p-0 text-ink-100 shadow-[0_32px_80px_-20px_rgb(0_0_0/0.8)] backdrop:bg-night-950/80 backdrop:backdrop-blur-sm"
      >
        <form onSubmit={publicar} noValidate className="flex flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-7">
            <div className="min-w-0">
              <h2
                id={idTitulo}
                className="font-display text-xl font-extrabold tracking-tight"
              >
                {titulo}
              </h2>
              {subtitulo && (
                <p className="mt-1 truncate text-sm text-ink-400">{subtitulo}</p>
              )}
            </div>

            <button
              type="button"
              aria-label="Cerrar"
              onClick={cerrar}
              disabled={enviando}
              className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100 disabled:opacity-50"
            >
              <XIcon className="size-5" />
            </button>
          </div>

          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
            {esRespuesta && permiteCalificacion && (
              <label className="flex items-center gap-2 text-sm text-ink-300">
                <input type="checkbox" checked={incluirValoracion} onChange={(evento) => setIncluirValoracion(evento.target.checked)} />
                Incluir valoración
              </label>
            )}
            {valorar && <SelectorCalificacion name="calificacion" />}

            <div className="flex flex-col gap-2">
              <label htmlFor={idTexto} className="text-sm font-semibold text-ink-300">
                {esRespuesta ? "Tu respuesta" : "Tu reseña"}
              </label>
              <textarea
                ref={campoTexto}
                id={idTexto}
                name="texto"
                rows={6}
                maxLength={LARGO_MAXIMO}
                onChange={(evento) => setLargo(evento.target.value.length)}
                placeholder={
                  esRespuesta
                    ? "¿Qué le contestarías?"
                    : "¿Qué te pareció? Contalo sin spoilers."
                }
                className="w-full resize-y rounded-xl border border-night-600 bg-night-900 px-4 py-3 text-sm leading-relaxed text-ink-100 transition-colors placeholder:text-ink-400 hover:border-night-600/80 focus:border-brand-400 focus:outline-none"
              />
              <p className="self-end text-xs text-ink-400 tabular-nums">
                {largo} / {LARGO_MAXIMO}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
              >
                <WarningCircleIcon
                  weight="fill"
                  className="mt-0.5 size-4 shrink-0 text-rose-400"
                />
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 bg-night-900/60 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-300 transition-[color,background-color,transform] duration-150 ease-out hover:bg-white/5 hover:text-ink-100 active:scale-[0.97] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-600 active:scale-[0.97] disabled:bg-brand-500/50"
            >
              {enviando ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
