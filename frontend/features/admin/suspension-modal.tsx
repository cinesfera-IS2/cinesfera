"use client";

import { XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

export type DatosSuspension = {
  motivo: string;
  tipo_suspension: "temporal" | "indefinida";
  duracion_suspension: number | null;
  unidad_suspension: "horas" | "dias" | null;
  ocultar_contenido: true;
};

type Cuenta = { nombre: string; apellido?: string | null; nombre_usuario: string };

export function SuspensionModal({ cuenta, confirmar, cerrar }: Readonly<{
  cuenta: Cuenta;
  confirmar: (datos: DatosSuspension) => Promise<void>;
  cerrar: () => void;
}>) {
  const [tipo, setTipo] = useState<"" | "temporal" | "indefinida">("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState<"horas" | "dias">("horas");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState<number | null>(null);
  const motivoRef = useRef<HTMLTextAreaElement>(null);
  const dialogoRef = useRef<HTMLElement>(null);
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    focoAnteriorRef.current = document.activeElement as HTMLElement | null;
    motivoRef.current?.focus();
    const teclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !procesando) cerrar();
      if (evento.key === "Tab") {
        const elementos = dialogoRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])');
        if (!elementos?.length) return;
        const primero = elementos[0]; const ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
        else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
      }
    };
    document.addEventListener("keydown", teclado);
    return () => { document.removeEventListener("keydown", teclado); focoAnteriorRef.current?.focus(); };
  }, [cerrar, procesando]);

  const finalizacion = useMemo(() => {
    const numero = Number(cantidad);
    if (ahora === null || tipo !== "temporal" || !Number.isInteger(numero) || numero <= 0) return null;
    const ms = numero * (unidad === "dias" ? 86_400_000 : 3_600_000);
    return new Intl.DateTimeFormat("es-UY", {
      dateStyle: "full", timeStyle: "short", timeZone: "America/Montevideo",
    }).format(new Date(ahora + ms));
  }, [ahora, cantidad, tipo, unidad]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const motivo = String(new FormData(evento.currentTarget).get("motivo") ?? "").trim();
    const numero = Number(cantidad);
    if (!motivo) return setError("Ingresá un motivo para la suspensión.");
    if (!tipo) return setError("Seleccioná si la suspensión es temporal o indefinida.");
    if (tipo === "temporal" && (!Number.isInteger(numero) || numero <= 0)) {
      return setError("La duración debe ser un número entero positivo.");
    }
    if (tipo === "temporal" && numero > (unidad === "dias" ? 365 : 8760)) {
      return setError(`La duración no puede superar ${unidad === "dias" ? "365 días" : "8760 horas"}.`);
    }
    setProcesando(true);
    setError(null);
    try {
      await confirmar({
        motivo,
        tipo_suspension: tipo,
        duracion_suspension: tipo === "temporal" ? numero : null,
        unidad_suspension: tipo === "temporal" ? unidad : null,
        ocultar_contenido: true,
      });
      cerrar();
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : "No se pudo suspender la cuenta.");
    } finally {
      setProcesando(false);
    }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !procesando) cerrar(); }}>
    <section ref={dialogoRef} role="dialog" aria-modal="true" aria-labelledby="titulo-suspension" className="w-full max-w-lg rounded-3xl border border-white/10 bg-night-950 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="titulo-suspension" className="font-display text-xl font-bold text-ink-100">Suspender cuenta</h2><p className="mt-1 text-sm text-ink-400">{cuenta.nombre} {cuenta.apellido ?? ""} · @{cuenta.nombre_usuario}</p></div>
        <button type="button" aria-label="Cerrar" disabled={procesando} onClick={cerrar} className="rounded-full p-2 text-ink-400 hover:bg-white/5"><XIcon /></button>
      </div>
      <form onSubmit={enviar} className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm font-semibold text-ink-300">Motivo<textarea ref={motivoRef} name="motivo" required rows={3} className="resize-none rounded-xl border border-night-600 bg-night-900 px-3 py-2 font-normal" /></label>
        <fieldset><legend className="text-sm font-semibold text-ink-300">Tipo de suspensión</legend><div className="mt-2 grid grid-cols-2 gap-3">
          {(["temporal", "indefinida"] as const).map((valor) => <label key={valor} className={`rounded-xl border p-3 text-sm capitalize ${tipo === valor ? "border-brand-400 bg-brand-500/10 text-white" : "border-white/10 text-ink-400"}`}><input className="mr-2" type="radio" name="tipo" value={valor} checked={tipo === valor} onChange={() => { setTipo(valor); setAhora(Date.now()); }} />{valor}</label>)}
        </div></fieldset>
        {tipo === "temporal" && <div className="grid grid-cols-[1fr_9rem] gap-3"><label className="grid gap-1 text-sm text-ink-300">Cantidad<input value={cantidad} onChange={(e) => { setCantidad(e.target.value); setAhora(Date.now()); }} type="number" min="1" max={unidad === "dias" ? 365 : 8760} step="1" required className="rounded-xl border border-night-600 bg-night-900 px-3 py-2" /></label><label className="grid gap-1 text-sm text-ink-300">Unidad<select value={unidad} onChange={(e) => { setUnidad(e.target.value as "horas" | "dias"); setAhora(Date.now()); }} className="rounded-xl border border-night-600 bg-night-900 px-3 py-2"><option value="horas">Horas</option><option value="dias">Días</option></select></label></div>}
        {tipo === "temporal" && finalizacion && <p className="rounded-xl bg-sky-400/10 p-3 text-sm text-sky-200">Finalizará el {finalizacion} (hora de Uruguay).</p>}
        {tipo === "indefinida" && <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-100">Permanecerá suspendido hasta que un administrador levante la suspensión.</p>}
        {error && <p role="alert" className="rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={procesando} onClick={cerrar} className="rounded-full px-5 py-2 text-sm font-bold text-ink-400">Cancelar</button><button type="submit" disabled={procesando} className="rounded-full bg-rose-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{procesando ? "Suspendiendo…" : "Confirmar suspensión"}</button></div>
      </form>
    </section>
  </div>;
}
