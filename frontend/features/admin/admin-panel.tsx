"use client";

import {
  ClockCounterClockwiseIcon,
  FlagIcon,
  ShieldCheckIcon,
  UsersIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

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
import { UsuariosSeccion, type FiltroUsuarios } from "@/features/admin/usuarios-seccion";
import { AdministradoresSeccion } from "@/features/admin/administradores-seccion";

type Pestana = "reportes" | "usuarios" | "administradores" | "auditoria";

export function AdminPanel({ sesion }: Readonly<{ sesion: UsuarioSesion }>) {
  const [pestana, setPestana] = useState<Pestana>("reportes");
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [reportes, setReportes] = useState<Pagina<ReporteAdmin> | null>(null);
  const [usuarios, setUsuarios] = useState<Pagina<UsuarioAdmin> | null>(null);
  const [administradores, setAdministradores] = useState<Pagina<UsuarioAdmin> | null>(null);
  const [auditoria, setAuditoria] = useState<Pagina<Auditoria> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosReportes>({
    tipo: "", estado: "pendiente", motivo: "", buscar: "", orden: "recientes",
    desde: "", hasta: "", cantidad_minima: "",
  });
  const [paginaReportes, setPaginaReportes] = useState(1);
  const [filtroUsuarios, setFiltroUsuarios] = useState<FiltroUsuarios>("todos");

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError(null);
    try {
      const query = new URLSearchParams(
        Object.entries(filtros).filter(([, valor]) => valor)
      );
      query.set("pagina", String(paginaReportes));
      const [nuevoResumen, nuevosReportes, nuevosUsuarios, nuevaAuditoria, nuevosAdministradores] = await Promise.all([
        apiFetch<ResumenAdmin>("/admin/resumen", { cache: "no-store" }),
        apiFetch<Pagina<ReporteAdmin>>(`/admin/reportes?${query}`, { cache: "no-store" }),
        apiFetch<Pagina<UsuarioAdmin>>(`/admin/usuarios?por_pagina=50&estado=${filtroUsuarios}`, { cache: "no-store" }),
        apiFetch<Pagina<Auditoria>>("/admin/auditoria?por_pagina=50", { cache: "no-store" }),
        sesion.es_admin_principal ? apiFetch<Pagina<UsuarioAdmin>>("/admin/administradores?por_pagina=50", { cache: "no-store" }) : Promise.resolve(null),
      ]);
      setResumen(nuevoResumen);
      setReportes(nuevosReportes);
      setUsuarios(nuevosUsuarios);
      setAuditoria(nuevaAuditoria);
      setAdministradores(nuevosAdministradores);
    } catch (problema) {
      setError(problema instanceof ApiError ? problema.message : "No pudimos cargar el panel.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [filtros, paginaReportes, filtroUsuarios, sesion.es_admin_principal]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(temporizador);
  }, [cargar]);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Panel de administración</h1>
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
          <button type="button" aria-pressed={pestana === "usuarios" && filtroUsuarios === "suspendidos"} onClick={() => { setFiltroUsuarios("suspendidos"); setPestana("usuarios"); }} className={`rounded-2xl border bg-night-900/70 p-4 text-left transition-colors hover:bg-night-800/70 ${pestana === "usuarios" && filtroUsuarios === "suspendidos" ? "border-glow-400/45 ring-1 ring-glow-400/20" : "border-white/5"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Usuarios suspendidos</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-rose-300">{resumen.usuarios_suspendidos}</p>
          </button>
        </section>
      )}

      <nav aria-label="Secciones del panel" className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        <Tab activa={pestana === "reportes"} onClick={() => setPestana("reportes")} icono={<FlagIcon />}>Reportes</Tab>
        <Tab activa={pestana === "usuarios"} onClick={() => setPestana("usuarios")} icono={<UsersIcon />}>Usuarios</Tab>
        {Boolean(sesion.es_admin_principal) && <Tab activa={pestana === "administradores"} onClick={() => setPestana("administradores")} icono={<ShieldCheckIcon />}>Administradores</Tab>}
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
        <UsuariosSeccion usuarios={usuarios?.items ?? []} filtro={filtroUsuarios} setFiltro={setFiltroUsuarios} recargar={() => cargar(true)} />
      )}
      {!cargando && pestana === "administradores" && sesion.es_admin_principal && <AdministradoresSeccion administradores={administradores?.items ?? []} recargar={() => cargar(true)} />}
      {!cargando && pestana === "auditoria" && <AuditoriaSeccion registros={auditoria?.items ?? []} />}
    </div>
  );
}

function Tab({ activa, onClick, icono, children }: Readonly<{ activa: boolean; onClick: () => void; icono: React.ReactNode; children: React.ReactNode }>) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${activa ? "bg-brand-500 text-white" : "text-ink-400 hover:bg-white/5 hover:text-ink-100"}`}><span className="size-4">{icono}</span>{children}</button>;
}

function AuditoriaSeccion({ registros }: Readonly<{ registros: Auditoria[] }>) {
  return <section className="mt-6"><div className="grid gap-3">{registros.map((registro) => <article key={registro.id} className="rounded-xl border border-white/5 bg-night-900/60 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-ink-100">{registro.accion.replaceAll("_", " ")}</p><time className="text-xs text-ink-500">{new Date(registro.fecha).toLocaleString("es-UY", { timeZone: "America/Montevideo" })}</time></div><p className="mt-1 text-sm text-ink-400">@{registro.administrador_usuario} · {registro.tipo_objetivo} {registro.objetivo_id}</p><p className="mt-2 text-sm text-ink-300">{registro.motivo}</p>{registro.suspension_inicio && <p className="mt-2 text-xs text-ink-400">Inicio: {new Date(registro.suspension_inicio).toLocaleString("es-UY", { timeZone: "America/Montevideo" })} · Fin: {registro.suspension_fin ? new Date(registro.suspension_fin).toLocaleString("es-UY", { timeZone: "America/Montevideo" }) : "Indefinida"}</p>}{(registro.estado_anterior || registro.estado_nuevo) && <p className="mt-2 text-xs text-ink-500">{registro.estado_anterior ?? "—"} → {registro.estado_nuevo ?? "—"}</p>}</article>)}</div></section>;
}
