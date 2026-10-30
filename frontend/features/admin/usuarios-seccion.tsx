"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { UsuarioAdmin } from "@/features/admin/types";
import { SuspensionModal, type DatosSuspension } from "@/features/admin/suspension-modal";

export type FiltroUsuarios = "todos" | "activos" | "suspendidos";

async function mutar(ruta: string, options: RequestInit) {
  const { csrf_token } = await apiFetch<{ csrf_token: string }>("/auth/csrf", { cache: "no-store" });
  return apiFetch(ruta, { ...options, headers: { "X-CSRF-Token": csrf_token, ...options.headers } });
}

export function UsuariosSeccion({ usuarios, filtro, setFiltro, recargar }: Readonly<{
  usuarios: UsuarioAdmin[]; filtro: FiltroUsuarios; setFiltro: (filtro: FiltroUsuarios) => void; recargar: () => Promise<void>;
}>) {
  const [suspender, setSuspender] = useState<UsuarioAdmin | null>(null);
  const [accion, setAccion] = useState<{ usuario: UsuarioAdmin; tipo: "reactivar_usuario" | "eliminar_usuario" } | null>(null);

  async function confirmarSuspension(datos: DatosSuspension) {
    if (!suspender) return;
    try {
      await mutar(`/admin/usuarios/${suspender.id}/accion`, { method: "POST", body: JSON.stringify({ accion: "suspender_usuario", ...datos }) });
      await recargar();
    } catch (problema) { throw new Error(problema instanceof ApiError ? problema.message : "No se pudo suspender la cuenta."); }
  }

  async function confirmarAccion(motivo: string) {
    if (!accion) return;
    await mutar(`/admin/usuarios/${accion.usuario.id}/accion`, { method: "POST", body: JSON.stringify({ accion: accion.tipo, motivo, ocultar_contenido: true }) });
    await recargar();
  }

  return <section className="mt-6">
    <div aria-label="Filtro de usuarios" className="inline-flex rounded-full border border-white/10 bg-night-900 p-1">
      {([['todos','Todos'], ['activos','Activos'], ['suspendidos','Suspendidos']] as const).map(([valor, etiqueta]) => <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)} className={`rounded-full px-4 py-2 text-sm font-bold ${filtro === valor ? "bg-brand-500 text-white" : "text-ink-400 hover:text-ink-100"}`}>{etiqueta}</button>)}
    </div>
    {usuarios.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/10 py-14 text-center"><h3 className="font-display text-lg font-bold">{filtro === "suspendidos" ? "No hay usuarios suspendidos" : "No hay usuarios para este filtro"}</h3><p className="mt-2 text-sm text-ink-500">{filtro === "suspendidos" ? "Las cuentas con suspensiones vencidas no aparecen en esta lista." : "Probá con otro estado."}</p></div> :
    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/5"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-night-900 text-xs uppercase text-ink-500"><tr><th className="p-4">Usuario</th><th className="p-4">Estado</th><th className="p-4">Reportes</th><th className="p-4">Motivo</th><th className="p-4">Finalización</th><th className="p-4">Acciones</th></tr></thead><tbody>{usuarios.map((usuario) => <tr key={usuario.id} className="border-t border-white/5"><td className="p-4"><strong>{usuario.nombre} {usuario.apellido}</strong><br/><span className="text-ink-400">@{usuario.nombre_usuario} · {usuario.email}</span></td><td className="p-4 capitalize">{usuario.estado}</td><td className="p-4">{usuario.cantidad_reportes}</td><td className="p-4 text-ink-300">{usuario.estado === "suspendido" ? usuario.motivo_suspension ?? "Sin motivo disponible" : "—"}</td><td className="p-4 text-ink-400">{usuario.estado === "suspendido" ? usuario.suspension_hasta ? fechaUruguay(usuario.suspension_hasta) : "Indefinida" : "—"}</td><td className="p-4"><div className="flex flex-wrap gap-2">{usuario.estado === "activo" && <button type="button" onClick={() => setSuspender(usuario)} className="rounded-full border border-rose-400/30 px-3 py-1.5 text-xs font-bold text-rose-300">Suspender</button>}{usuario.estado === "suspendido" && <button type="button" onClick={() => setAccion({ usuario, tipo: "reactivar_usuario" })} className="rounded-full border border-emerald-400/30 px-3 py-1.5 text-xs font-bold text-emerald-300">Levantar suspensión</button>}{usuario.estado !== "eliminado" && <button type="button" onClick={() => setAccion({ usuario, tipo: "eliminar_usuario" })} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-ink-300">Eliminar</button>}</div></td></tr>)}</tbody></table></div>}
    {suspender && <SuspensionModal cuenta={suspender} confirmar={confirmarSuspension} cerrar={() => setSuspender(null)} />}
    {accion && <MotivoModal titulo={accion.tipo === "reactivar_usuario" ? "Levantar suspensión" : "Eliminar cuenta"} confirmar={confirmarAccion} cerrar={() => setAccion(null)} />}
  </section>;
}

function MotivoModal({ titulo, confirmar, cerrar }: Readonly<{ titulo: string; confirmar: (motivo: string) => Promise<void>; cerrar: () => void }>) {
  const [procesando, setProcesando] = useState(false); const [error, setError] = useState<string | null>(null);
  async function enviar(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const motivo = String(new FormData(e.currentTarget).get("motivo") ?? "").trim(); if (!motivo) return setError("Ingresá un motivo."); setProcesando(true); try { await confirmar(motivo); cerrar(); } catch (p) { setError(p instanceof ApiError ? p.message : "No se pudo aplicar la acción."); } finally { setProcesando(false); } }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4"><form role="dialog" aria-modal="true" onSubmit={enviar} className="w-full max-w-md rounded-3xl border border-white/10 bg-night-950 p-6"><h2 className="font-display text-xl font-bold">{titulo}</h2><label className="mt-5 grid gap-2 text-sm text-ink-300">Motivo<textarea autoFocus name="motivo" required rows={3} className="rounded-xl border border-night-600 bg-night-900 p-3" /></label>{error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={cerrar} className="rounded-full px-4 py-2 text-sm font-bold text-ink-400">Cancelar</button><button type="submit" disabled={procesando} className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{procesando ? "Procesando…" : "Confirmar"}</button></div></form></div>;
}

function fechaUruguay(fecha: string) { return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Montevideo" }).format(new Date(fecha)); }
