"use client";

import {
  ChatCircleTextIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { ApiError, apiFetch } from "@/lib/api";

type CreateReviewDialogProps = {
  usuarioId: string;
};

type TipoContenido = "pelicula" | "serie";

export function CreateReviewDialog({ usuarioId }: CreateReviewDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setError(null);
    dialogo.current?.showModal();
  }

  function cerrar() {
    if (!enviando) {
      dialogo.current?.close();
    }
  }

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const tipo = campos.get("tipo") as TipoContenido;
    const tmdbId = Number(campos.get("tmdb_id"));
    const calificacion = Number(campos.get("calificacion"));
    const texto = String(campos.get("texto") ?? "").trim();

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
          resena_padre_id: null,
        }),
      });

      formulario.reset();
      dialogo.current?.close();
      router.refresh();
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos publicar la reseña. Probá de nuevo en un momento."
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
        className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
      >
        <ChatCircleTextIcon weight="bold" className="size-4" />
        Escribir una reseña
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-crear-resena"
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-night-600 bg-night-850 p-0 text-ink-100 shadow-2xl shadow-black/60 backdrop:bg-night-950/80 backdrop:backdrop-blur-sm"
      >
        <form onSubmit={publicar} className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="titulo-crear-resena"
                className="font-display text-xl font-extrabold tracking-tight"
              >
                Nueva reseña
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Elegí el contenido y contá qué te pareció.
              </p>
            </div>
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100 disabled:opacity-50"
            >
              <XIcon weight="bold" className="size-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect label="Tipo" name="tipo" defaultValue="pelicula">
              <option value="pelicula">Película</option>
              <option value="serie">Serie</option>
            </CampoSelect>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
              ID de TMDB
              <input
                name="tmdb_id"
                type="number"
                min={1}
                step={1}
                required
                placeholder="Ej. 550"
                className="rounded-lg border border-night-600 bg-night-900 px-3.5 py-2.5 text-sm font-normal text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-brand-400"
              />
            </label>
          </div>

          <CampoSelect
            label="Calificación"
            name="calificacion"
            defaultValue="4.5"
          >
            {Array.from({ length: 11 }, (_, indice) => indice * 0.5).map(
              (valor) => (
                <option key={valor} value={valor}>
                  {valor.toFixed(1)} de 5
                </option>
              )
            )}
          </CampoSelect>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Reseña
            <textarea
              name="texto"
              rows={5}
              minLength={1}
              maxLength={5000}
              required
              placeholder="Escribí tu opinión..."
              className="w-full resize-y rounded-lg border border-night-600 bg-night-900 px-3.5 py-2.5 text-sm font-normal leading-relaxed text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-brand-400"
            />
          </label>

          <p className="text-xs leading-relaxed text-ink-500">
            El ID de TMDB es el número que identifica la película o serie en
            The Movie Database.
          </p>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200"
            >
              <WarningCircleIcon
                weight="fill"
                className="mt-0.5 size-4 shrink-0 text-rose-400"
              />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrar}
              disabled={enviando}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-300 transition-colors hover:border-white/40 hover:text-ink-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:bg-brand-500/50"
            >
              {enviando ? "Publicando..." : "Publicar reseña"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function CampoSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="rounded-lg border border-night-600 bg-night-900 px-3.5 py-2.5 text-sm font-normal text-ink-100 outline-none transition-colors focus:border-brand-400"
      >
        {children}
      </select>
    </label>
  );
}
