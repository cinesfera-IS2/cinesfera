"use client";

import {
  ClockCounterClockwiseIcon,
  FlagIcon,
  ShieldCheckIcon,
  UsersIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { UsuarioSesion } from "@/features/auth/session";
import type {
  Auditoria,
  Pagina,
  ReporteAdmin,
  ResumenAdmin,
  UsuarioAdmin,
} from "@/features/admin/types";
import {
  ReportesSeccion,
  type FiltrosReportes,
} from "@/features/admin/reportes-seccion";
import { ApiError, apiFetch } from "@/lib/api";

type Pestana = "reportes" | "usuarios" | "auditoria";

async function mutar<T>(ruta: string, options: RequestInit): Promise<T> {
  const { csrf_token } = await apiFetch<{ csrf_token: string }>("/auth/csrf", {
    cache: "no-store",
  });
  return apiFetch<T>(ruta, {
    ...options,
    headers: { "X-CSRF-Token": csrf_token, ...options.headers },
  });
}

export function AdminPanel({ sesion }: Readonly<{ sesion: UsuarioSesion }>) {
  const [pestana, setPestana] = useState<Pestana>("reportes");
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [reportes, setReportes] = useState<Pagina<ReporteAdmin> | null>(null);
  const [usuarios, setUsuarios] = useState<Pagina<UsuarioAdmin> | null>(null);
  const [auditoria, setAuditoria] = useState<Pagina<Auditoria> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosReportes>({
    tipo: "", estado: "pendiente", motivo: "", buscar: "", orden: "recientes",
    desde: "", hasta: "", cantidad_minima: "",
  });
  const [paginaReportes, setPaginaReportes] = useState(1);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError(null);
    try {
      const query = new URLSearchParams(
        Object.entries(filtros).filter(([, valor]) => valor)
      );
      query.set("pagina", String(paginaReportes));
      const [nuevoResumen, nuevosReportes, nuevosUsuarios, nuevaAuditoria] = await Promise.all([
        apiFetch<ResumenAdmin>("/admin/resumen", { cache: "no-store" }),
        apiFetch<Pagina<ReporteAdmin>>(`/admin/reportes?${query}`, { cache: "no-store" }),
        apiFetch<Pagina<UsuarioAdmin>>("/admin/usuarios?por_pagina=50", { cache: "no-store" }),
        apiFetch<Pagina<Auditoria>>("/admin/auditoria?por_pagina=50", { cache: "no-store" }),
      ]);
      setResumen(nuevoResumen);
      setReportes(nuevosReportes);
      setUsuarios(nuevosUsuarios);
      setAuditoria(nuevaAuditoria);
    } catch (problema) {
      setError(problema instanceof ApiError ? problema.message : "No pudimos cargar el panel.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [filtros, paginaReportes]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(temporizador);
  }, [cargar]);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-glow-400">Moderación</p>
          <h1 className="font-display text-3xl font-extrabold">Panel de administración</h1>
          <p className="mt-2 text-sm text-ink-400">Revisá cada caso antes de aplicar cambios visibles.</p>
        </div>
        {Boolean(sesion.es_admin_principal) && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-200">
            <ShieldCheckIcon weight="fill" /> Administrador principal
          </span>
        )}
      </div>

      {resumen && (
        <section aria-label="Resumen" className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Pendientes", resumen.pendientes, "text-amber-300", "pendiente"],
            ["En revisión", resumen.en_revision, "text-sky-300", "en_revision"],
            ["Resueltos", resumen.resueltos, "text-emerald-300", "resuelto"],
            ["Descartados", resumen.descartados, "text-ink-300", "descartado"],
          ].map(([etiqueta, valor, color, estado]) => (
            <button
              type="button"
              key={String(etiqueta)}
              aria-pressed={pestana === "reportes" && filtros.estado === estado}
              onClick={() => {
                setPestana("reportes");
                setPaginaReportes(1);
                setFiltros((actuales) => ({ ...actuales, estado: String(estado) }));
              }}
              className={`rounded-2xl border bg-night-900/70 p-4 text-left transition-colors hover:bg-night-800/70 ${
                pestana === "reportes" && filtros.estado === estado
                  ? "border-glow-400/45 ring-1 ring-glow-400/20"
                  : "border-white/5"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{etiqueta}</p>
              <p className={`mt-1 font-display text-2xl font-extrabold ${color}`}>{valor}</p>
            </button>
          ))}
          <button type="button" onClick={() => setPestana("usuarios")} className="rounded-2xl border border-white/5 bg-night-900/70 p-4 text-left transition-colors hover:bg-night-800/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Suspendidos</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-rose-300">{resumen.usuarios_suspendidos}</p>
          </button>
        </section>
      )}

      <nav aria-label="Secciones del panel" className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        <Tab activa={pestana === "reportes"} onClick={() => setPestana("reportes")} icono={<FlagIcon />}>Reportes</Tab>
        <Tab activa={pestana === "usuarios"} onClick={() => setPestana("usuarios")} icono={<UsersIcon />}>Usuarios</Tab>
        <Tab activa={pestana === "auditoria"} onClick={() => setPestana("auditoria")} icono={<ClockCounterClockwiseIcon />}>Auditoría</Tab>
      </nav>

      {error && <p role="alert" className="mt-6 flex gap-2 rounded-xl bg-rose-500/10 p-4 text-rose-200"><WarningCircleIcon className="size-5" />{error}</p>}
      {cargando && <p className="py-16 text-center text-ink-400">Cargando panel…</p>}

      {!cargando && pestana === "reportes" && (
        <ReportesSeccion
          filtros={filtros}
          setFiltros={(actualizador) => {
            setPaginaReportes(1);
            setFiltros(actualizador);
          }}
          reportes={reportes?.items ?? []}
          total={reportes?.total ?? 0}
          pagina={paginaReportes}
          setPagina={setPaginaReportes}
          recargar={() => cargar(true)}
        />
      )}
      {!cargando && pestana === "usuarios" && (
        <UsuariosSeccion usuarios={usuarios?.items ?? []} principal={Boolean(sesion.es_admin_principal)} recargar={cargar} />
      )}
      {!cargando && pestana === "auditoria" && <AuditoriaSeccion registros={auditoria?.items ?? []} />}
    </div>
  );
}

function Tab({ activa, onClick, icono, children }: Readonly<{ activa: boolean; onClick: () => void; icono: React.ReactNode; children: React.ReactNode }>) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${activa ? "bg-brand-500 text-white" : "text-ink-400 hover:bg-white/5 hover:text-ink-100"}`}><span className="size-4">{icono}</span>{children}</button>;
}

function UsuariosSeccion({ usuarios, principal, recargar }: Readonly<{ usuarios: UsuarioAdmin[]; principal: boolean; recargar: () => Promise<void> }>) {
  return <section className="mt-6">
    {principal && <NuevoAdmin recargar={recargar} />}
    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/5"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-night-900 text-xs uppercase text-ink-500"><tr><th className="p-4">Usuario</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4">Reportes</th><th className="p-4">Suspensión</th><th className="p-4">Acciones</th></tr></thead><tbody>{usuarios.map((usuario) => <tr key={usuario.id} className="border-t border-white/5"><td className="p-4"><strong>{usuario.nombre} {usuario.apellido}</strong><br/><span className="text-ink-400">@{usuario.nombre_usuario} · {usuario.email}</span></td><td className="p-4">{usuario.es_admin_principal ? "Admin principal" : usuario.rol}</td><td className="p-4">{usuario.estado}</td><td className="p-4">{usuario.cantidad_reportes}</td><td className="p-4 text-xs text-ink-400">{usuario.suspension_hasta ? new Date(usuario.suspension_hasta).toLocaleString("es-UY") : usuario.motivo_suspension ?? "—"}</td><td className="p-4"><UsuarioAcciones usuario={usuario} principal={principal} recargar={recargar} /></td></tr>)}</tbody></table></div>
  </section>;
}

function UsuarioAcciones({ usuario, principal, recargar }: Readonly<{ usuario: UsuarioAdmin; principal: boolean; recargar: () => Promise<void> }>) {
  const [error, setError] = useState<string | null>(null);
  async function accion(accionElegida: string) {
    const motivo = window.prompt("Motivo de la acción (quedará en auditoría):");
    if (!motivo?.trim()) return;
    try {
      await mutar(`/admin/usuarios/${usuario.id}/accion`, {
        method: "POST",
        body: JSON.stringify({ accion: accionElegida, motivo: motivo.trim(), ocultar_contenido: true }),
      });
      await recargar();
    } catch (problema) {
      setError(problema instanceof ApiError ? problema.message : "No se pudo aplicar la acción.");
    }
  }
  async function revocar() {
    if (!window.confirm(`¿Quitar el rol de administrador a @${usuario.nombre_usuario}?`)) return;
    try {
      await mutar(`/admin/administradores/${usuario.id}`, { method: "DELETE" });
      await recargar();
    } catch (problema) {
      setError(problema instanceof ApiError ? problema.message : "No se pudo revocar el rol.");
    }
  }
  if (usuario.es_admin_principal) return <span className="text-xs text-ink-500">Protegido</span>;
  return <div className="flex max-w-xs flex-wrap gap-2">
    {usuario.rol === "admin" ? principal && <button type="button" onClick={() => void revocar()} className="rounded-full border border-amber-400/30 px-3 py-1.5 text-xs font-bold text-amber-200">Quitar rol</button> : <>
      {usuario.estado === "activo" && <button type="button" onClick={() => void accion("suspender_usuario")} className="rounded-full border border-rose-400/30 px-3 py-1.5 text-xs font-bold text-rose-300">Suspender</button>}
      {usuario.estado === "suspendido" && <button type="button" onClick={() => void accion("reactivar_usuario")} className="rounded-full border border-emerald-400/30 px-3 py-1.5 text-xs font-bold text-emerald-300">Reactivar</button>}
      {usuario.estado !== "eliminado" && <button type="button" onClick={() => void accion("eliminar_usuario")} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-ink-300">Eliminar</button>}
    </>}
    {error && <span role="alert" className="w-full text-xs text-rose-300">{error}</span>}
  </div>;
}

function NuevoAdmin({ recargar }: Readonly<{ recargar: () => Promise<void> }>) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  async function crear(evento: FormEvent<HTMLFormElement>) { evento.preventDefault(); const form = evento.currentTarget; const datos = Object.fromEntries(new FormData(form)); try { await mutar("/admin/administradores", { method: "POST", body: JSON.stringify(datos) }); form.reset(); setMensaje("Administrador creado correctamente."); await recargar(); } catch (e) { setMensaje(e instanceof ApiError ? e.message : "No se pudo crear."); } }
  return <details className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5"><summary className="font-display font-bold text-amber-100">Crear otro administrador</summary><form onSubmit={crear} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><input name="nombre" required placeholder="Nombre" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2"/><input name="apellido" required placeholder="Apellido" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2"/><input name="nombre_usuario" required placeholder="usuario.admin" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2"/><input name="email" required type="email" placeholder="email" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2"/><input name="password" required type="password" minLength={12} placeholder="Contraseña (12+)" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2"/><button className="rounded-full bg-amber-400 px-5 py-2 font-bold text-night-950">Crear administrador</button></form>{mensaje && <p className="mt-3 text-sm text-ink-300">{mensaje}</p>}</details>;
}

function AuditoriaSeccion({ registros }: Readonly<{ registros: Auditoria[] }>) {
  return <section className="mt-6"><div className="grid gap-3">{registros.map((registro) => <article key={registro.id} className="rounded-xl border border-white/5 bg-night-900/60 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-ink-100">{registro.accion.replaceAll("_", " ")}</p><time className="text-xs text-ink-500">{new Date(registro.fecha).toLocaleString("es-UY")}</time></div><p className="mt-1 text-sm text-ink-400">@{registro.administrador_usuario} · {registro.tipo_objetivo} {registro.objetivo_id}</p><p className="mt-2 text-sm text-ink-300">{registro.motivo}</p>{(registro.estado_anterior || registro.estado_nuevo) && <p className="mt-2 text-xs text-ink-500">{registro.estado_anterior ?? "—"} → {registro.estado_nuevo ?? "—"}</p>}</article>)}</div></section>;
}
