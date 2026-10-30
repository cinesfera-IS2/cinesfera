"use client";

import { FlagIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useId, useRef, useState, type FormEvent } from "react";

import { ApiError, apiFetch } from "@/lib/api";

type ReportButtonProps = {
  tipo: "comentario" | "usuario";
  objetivoId: string;
  etiqueta?: string;
};

const MOTIVOS = [
  ["spam", "Spam"],
  ["acoso", "Acoso"],
  ["odio", "Discurso de odio"],
  ["contenido_inapropiado", "Contenido inapropiado"],
  ["suplantacion", "Suplantación"],
  ["informacion_falsa", "Información falsa"],
  ["otro", "Otro"],
] as const;

export function ReportButton({
  tipo,
  objetivoId,
  etiqueta = "Reportar",
}: Readonly<ReportButtonProps>) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    setError(null);
    setEnviando(true);
    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>("/auth/csrf", {
        cache: "no-store",
      });
      await apiFetch("/reportes", {
        method: "POST",
        headers: { "X-CSRF-Token": csrf_token },
        body: JSON.stringify({
          tipo,
          objetivo_id: objetivoId,
          motivo: campos.get("motivo"),
          descripcion: String(campos.get("descripcion") ?? "").trim() || null,
        }),
      });
      setEnviado(true);
      formulario.reset();
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos enviar el reporte. Probá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  function abrir() {
    setError(null);
    setEnviado(false);
    dialogo.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold text-ink-400 transition-colors hover:bg-rose-400/10 hover:text-rose-300"
      >
        <FlagIcon className="size-3.5" />
        {etiqueta}
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={tituloId}
        className="dialogo-animado m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-night-850 p-0 text-ink-100 shadow-2xl backdrop:bg-night-950/80"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <h2 id={tituloId} className="font-display text-xl font-bold">
            Reportar {tipo === "usuario" ? "perfil" : "comentario"}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => dialogo.current?.close()}
            className="grid size-9 place-items-center rounded-full text-ink-400 hover:bg-white/5"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {enviado ? (
          <div className="px-6 py-8 text-center">
            <p className="font-display text-lg font-bold">Reporte recibido</p>
            <p className="mt-2 text-sm text-ink-400">
              El equipo lo revisará. El perfil o comentario no se oculta automáticamente.
            </p>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-5 px-6 py-6">
            <label className="grid gap-2 text-sm font-semibold text-ink-300">
              Motivo
              <select
                name="motivo"
                required
                defaultValue=""
                className="rounded-xl border border-night-600 bg-night-900 px-4 py-3 text-ink-100"
              >
                <option value="" disabled>Seleccioná un motivo</option>
                {MOTIVOS.map(([valor, texto]) => (
                  <option key={valor} value={valor}>{texto}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink-300">
              Detalles opcionales
              <textarea
                name="descripcion"
                maxLength={1000}
                rows={4}
                placeholder="Contanos qué ocurrió para ayudar con la revisión."
                className="resize-y rounded-xl border border-night-600 bg-night-900 px-4 py-3 font-normal text-ink-100 placeholder:text-ink-500"
              />
            </label>
            <p className="text-xs leading-relaxed text-ink-400">
              Reportar no elimina ni modifica el contenido. Un administrador revisará el caso.
            </p>
            {error && (
              <p role="alert" className="flex gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">
                <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => dialogo.current?.close()} className="px-4 py-2 text-sm text-ink-300">
                Cancelar
              </button>
              <button type="submit" disabled={enviando} className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {enviando ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
