"use client";

import {
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ShieldWarningIcon,
  TrashIcon,
  UserMinusIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import type {
  ReporteAdmin,
  ReporteDetalle,
} from "@/features/admin/types";
import { ApiError, apiFetch } from "@/lib/api";

export type FiltrosReportes = {
  tipo: string;
  estado: string;
  motivo: string;
  buscar: string;
  orden: string;
  desde: string;
  hasta: string;
  cantidad_minima: string;
};

type AccionCaso = {
  valor: string;
  etiqueta: string;
  tono: "neutro" | "advertencia" | "peligro" | "positivo";
  rutaUsuario?: boolean;
};

const ETIQUETAS_MOTIVO: Record<string, string> = {
  spam: "Spam",
  acoso: "Acoso",
  odio: "Odio",
  contenido_inapropiado: "Contenido inapropiado",
  suplantacion: "Suplantación",
  informacion_falsa: "Información falsa",
  otro: "Otro",
};

const ESTADOS = {
  pendiente: {
    etiqueta: "Pendiente",
    clase: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
  en_revision: {
    etiqueta: "En revisión",
    clase: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  },
  resuelto: {
    etiqueta: "Resuelto",
    clase: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  },
  descartado: {
    etiqueta: "Descartado",
    clase: "border-white/10 bg-white/5 text-ink-300",
  },
} as const;

async function mutar<T>(ruta: string, options: RequestInit): Promise<T> {
  const { csrf_token } = await apiFetch<{ csrf_token: string }>("/auth/csrf", {
    cache: "no-store",
  });
  return apiFetch<T>(ruta, {
    ...options,
    headers: { "X-CSRF-Token": csrf_token, ...options.headers },
  });
}

export function ReportesSeccion({
  filtros,
  setFiltros,
  reportes,
  total,
  pagina,
  setPagina,
  recargar,
}: Readonly<{
  filtros: FiltrosReportes;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosReportes>>;
  reportes: ReporteAdmin[];
  total: number;
  pagina: number;
  setPagina: React.Dispatch<React.SetStateAction<number>>;
  recargar: () => Promise<void>;
}>) {
  const [casoAbierto, setCasoAbierto] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ReporteDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const activadorRef = useRef<HTMLElement | null>(null);

  const cargarDetalle = useCallback(async (reporteId: string) => {
    setCargandoDetalle(true);
    setErrorDetalle(null);
    try {
      const nuevoDetalle = await apiFetch<ReporteDetalle>(
        `/admin/reportes/${reporteId}/detalle`,
        { cache: "no-store" }
      );
      setDetalle(nuevoDetalle);
    } catch (problema) {
      setErrorDetalle(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos cargar el detalle del caso."
      );
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  function abrirCaso(reporteId: string, activador: HTMLElement) {
    activadorRef.current = activador;
    setDetalle(null);
    setCasoAbierto(reporteId);
    void cargarDetalle(reporteId);
  }

  const cerrarCaso = useCallback(() => {
    setCasoAbierto(null);
    setDetalle(null);
    setErrorDetalle(null);
  }, []);

  async function actualizarCaso() {
    await recargar();
    if (casoAbierto) await cargarDetalle(casoAbierto);
  }

  const esVacioPendientes = filtros.estado === "pendiente" && reportes.length === 0;

  return (
    <section className="mt-6">
      <FiltrosRapidos filtros={filtros} setFiltros={setFiltros} />

      <div className="mt-4 grid gap-3 rounded-2xl border border-white/5 bg-night-900/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Buscar reportes</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
          <input
            aria-label="Buscar reportes"
            value={filtros.buscar}
            onChange={(evento) =>
              setFiltros((actuales) => ({ ...actuales, buscar: evento.target.value }))
            }
            placeholder="Buscar usuario o texto"
            className="w-full rounded-xl border border-night-600 bg-night-950 py-2 pr-3 pl-9 text-sm"
          />
        </label>
        <Filtro
          label="Tipo"
          value={filtros.tipo}
          onChange={(tipo) => setFiltros((actuales) => ({ ...actuales, tipo }))}
          opciones={[["", "Todos los tipos"], ["comentario", "Comentario"], ["usuario", "Usuario"]]}
        />
        <Filtro
          label="Estado"
          value={filtros.estado}
          onChange={(estado) => setFiltros((actuales) => ({ ...actuales, estado }))}
          opciones={[["", "Todos los estados"], ["pendiente", "Pendiente"], ["en_revision", "En revisión"], ["resuelto", "Resuelto"], ["descartado", "Descartado"]]}
        />
        <Filtro
          label="Motivo"
          value={filtros.motivo}
          onChange={(motivo) => setFiltros((actuales) => ({ ...actuales, motivo }))}
          opciones={[["", "Todos los motivos"], ...Object.entries(ETIQUETAS_MOTIVO)]}
        />
        <Filtro
          label="Orden"
          value={filtros.orden}
          onChange={(orden) => setFiltros((actuales) => ({ ...actuales, orden }))}
          opciones={[["recientes", "Más recientes"], ["antiguos", "Más antiguos"], ["mas_reportados", "Más reportados"]]}
        />
        <CampoFecha
          label="Desde"
          value={filtros.desde}
          onChange={(desde) => setFiltros((actuales) => ({ ...actuales, desde }))}
        />
        <CampoFecha
          label="Hasta"
          value={filtros.hasta}
          onChange={(hasta) => setFiltros((actuales) => ({ ...actuales, hasta }))}
        />
        <label className="grid gap-1 text-xs font-semibold text-ink-400">
          Cantidad mínima
          <input
            type="number"
            min="1"
            value={filtros.cantidad_minima}
            onChange={(evento) =>
              setFiltros((actuales) => ({
                ...actuales,
                cantidad_minima: evento.target.value,
              }))
            }
            placeholder="Ej. 3"
            className="rounded-xl border border-night-600 bg-night-950 px-3 py-2 text-sm text-ink-100"
          />
        </label>
      </div>

      {reportes.length === 0 ? (
        <EstadoVacio
          pendientes={esVacioPendientes}
          verTodos={() => setFiltros((actuales) => ({ ...actuales, estado: "" }))}
        />
      ) : (
        <ListaReportes reportes={reportes} abrirCaso={abrirCaso} />
      )}

      {total > 20 && (
        <Paginacion total={total} pagina={pagina} setPagina={setPagina} />
      )}

      {casoAbierto && (
        <PanelCaso
          detalle={detalle}
          cargando={cargandoDetalle}
          error={errorDetalle}
          cerrar={cerrarCaso}
          reintentar={() => void cargarDetalle(casoAbierto)}
          actualizado={actualizarCaso}
          activadorRef={activadorRef}
        />
      )}
    </section>
  );
}

function FiltrosRapidos({
  filtros,
  setFiltros,
}: Readonly<{
  filtros: FiltrosReportes;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosReportes>>;
}>) {
  const opciones = [
    ["pendiente", "Pendientes"],
    ["en_revision", "En revisión"],
    ["", "Todos"],
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div aria-label="Vista de reportes" className="inline-flex rounded-full border border-white/10 bg-night-900 p-1">
        {opciones.map(([valor, etiqueta]) => {
          const activo = filtros.estado === valor;
          return (
            <button
              key={etiqueta}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltros((actuales) => ({ ...actuales, estado: valor }))}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                activo
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-ink-400 hover:text-ink-100"
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-ink-500">El filtro se conserva al revisar un caso.</p>
    </div>
  );
}

function ListaReportes({
  reportes,
  abrirCaso,
}: Readonly<{
  reportes: ReporteAdmin[];
  abrirCaso: (id: string, activador: HTMLElement) => void;
}>) {
  return (
    <>
      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/5 md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-night-900/90 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="w-[36%] px-4 py-3">Contenido denunciado</th>
              <th className="w-[14%] px-4 py-3">Motivo</th>
              <th className="w-[11%] px-4 py-3 text-center">Reportes</th>
              <th className="w-[14%] px-4 py-3">Estado</th>
              <th className="w-[15%] px-4 py-3">Fecha</th>
              <th className="w-[10%] px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-night-950/30">
            {reportes.map((reporte) => {
              const snapshot = leerSnapshot(reporte);
              return (
                <tr key={reporte.id} className="transition-colors hover:bg-white/[0.025]">
                  <td className="px-4 py-3.5 align-top">
                    <p className="truncate font-semibold text-ink-100">{vistaPrevia(snapshot, reporte)}</p>
                    <p className="mt-1 truncate text-xs text-ink-500">{usuarioAsociado(snapshot, reporte)}</p>
                  </td>
                  <td className="px-4 py-3.5 align-top text-ink-300">{ETIQUETAS_MOTIVO[reporte.motivo] ?? reporte.motivo}</td>
                  <td className="px-4 py-3.5 text-center align-top font-semibold tabular-nums text-ink-200">{reporte.cantidad_reportes_objetivo}</td>
                  <td className="px-4 py-3.5 align-top"><EtiquetaEstado estado={reporte.estado} /></td>
                  <td className="px-4 py-3.5 align-top text-xs text-ink-400"><time dateTime={reporte.fecha_creacion}>{fechaBreve(reporte.fecha_creacion)}</time></td>
                  <td className="px-4 py-3.5 text-right align-top">
                    <BotonVerCaso reporte={reporte} abrirCaso={abrirCaso} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {reportes.map((reporte) => {
          const snapshot = leerSnapshot(reporte);
          return (
            <article key={reporte.id} className="rounded-2xl border border-white/5 bg-night-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-ink-100">{vistaPrevia(snapshot, reporte)}</p>
                  <p className="mt-1 truncate text-xs text-ink-500">{usuarioAsociado(snapshot, reporte)}</p>
                </div>
                <EtiquetaEstado estado={reporte.estado} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                <span>{ETIQUETAS_MOTIVO[reporte.motivo] ?? reporte.motivo}</span>
                <span>{reporte.cantidad_reportes_objetivo} reporte(s)</span>
                <time dateTime={reporte.fecha_creacion}>{fechaBreve(reporte.fecha_creacion)}</time>
              </div>
              <div className="mt-4 flex justify-end">
                <BotonVerCaso reporte={reporte} abrirCaso={abrirCaso} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function BotonVerCaso({ reporte, abrirCaso }: Readonly<{ reporte: ReporteAdmin; abrirCaso: (id: string, activador: HTMLElement) => void }>) {
  return (
    <button
      type="button"
      onClick={(evento) => abrirCaso(reporte.id, evento.currentTarget)}
      className="inline-flex items-center gap-1.5 rounded-full border border-glow-400/25 px-3 py-1.5 text-xs font-bold text-glow-300 transition-colors hover:bg-glow-400/10"
    >
      Ver caso <ArrowRightIcon weight="bold" />
    </button>
  );
}

function PanelCaso({
  detalle,
  cargando,
  error,
  cerrar,
  reintentar,
  actualizado,
  activadorRef,
}: Readonly<{
  detalle: ReporteDetalle | null;
  cargando: boolean;
  error: string | null;
  cerrar: () => void;
  reintentar: () => void;
  actualizado: () => Promise<void>;
  activadorRef: React.RefObject<HTMLElement | null>;
}>) {
  const panelRef = useRef<HTMLElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    const activador = activadorRef.current;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    function gestionarTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        cerrar();
        return;
      }
      if (evento.key !== "Tab" || !panelRef.current) return;
      const enfocables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", gestionarTeclado);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", gestionarTeclado);
      activador?.focus();
    };
  }, [activadorRef, cerrar]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[2px]" role="presentation">
      <button type="button" aria-label="Cerrar detalle" onClick={cerrar} className="absolute inset-0 cursor-default" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-caso"
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10 bg-night-950 shadow-2xl sm:max-w-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-glow-400">Moderación</p>
            <h2 id="titulo-caso" className="mt-1 font-display text-xl font-extrabold">Detalle del caso</h2>
          </div>
          <button ref={cerrarRef} type="button" onClick={cerrar} aria-label="Cerrar caso" className="grid size-10 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100">
            <XIcon className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {cargando && <DetalleEsqueleto />}
          {error && !cargando && (
            <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200">
              <p>{error}</p>
              <button type="button" onClick={reintentar} className="mt-4 rounded-full border border-rose-300/30 px-4 py-2 font-bold">Reintentar</button>
            </div>
          )}
          {detalle && !cargando && <ContenidoCaso detalle={detalle} actualizado={actualizado} />}
        </div>
      </aside>
    </div>
  );
}

function ContenidoCaso({ detalle, actualizado }: Readonly<{ detalle: ReporteDetalle; actualizado: () => Promise<void> }>) {
  const snapshot = leerSnapshot(detalle);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionElegida, setAccionElegida] = useState<AccionCaso | null>(null);

  async function tomarCaso() {
    setProcesando(true);
    setError(null);
    try {
      await mutar(`/admin/reportes/${detalle.id}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "en_revision", resolucion: null, nota_interna: null }),
      });
      await actualizado();
    } catch (problema) {
      setError(mensajeError(problema));
    } finally {
      setProcesando(false);
    }
  }

  async function ejecutarAccion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!accionElegida) return;
    const campos = new FormData(evento.currentTarget);
    const motivo = String(campos.get("motivo") ?? "").trim();
    if (!window.confirm(`¿Confirmás la acción “${accionElegida.etiqueta}”?`)) return;

    setProcesando(true);
    setError(null);
    try {
      if (accionElegida.valor === "descartar_reporte") {
        await mutar(`/admin/reportes/${detalle.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            estado: "descartado",
            resolucion: motivo,
            nota_interna: campos.get("nota") || null,
          }),
        });
      } else {
        const objetivoUsuario = snapshot.autor_id ?? detalle.objetivo_id;
        const ruta = accionElegida.rutaUsuario
          ? `/admin/usuarios/${objetivoUsuario}/accion`
          : `/admin/reportes/${detalle.id}/accion`;
        await mutar(ruta, {
          method: "POST",
          body: JSON.stringify({
            accion: accionElegida.valor,
            motivo,
            nota_interna: campos.get("nota") || null,
            horas_suspension: campos.get("horas")
              ? Number(campos.get("horas"))
              : null,
            ocultar_contenido: campos.get("ocultar") === "on",
          }),
        });
      }
      setAccionElegida(null);
      await actualizado();
    } catch (problema) {
      setError(mensajeError(problema));
    } finally {
      setProcesando(false);
    }
  }

  const acciones = accionesDisponibles(detalle, snapshot);
  const casoActivo = detalle.estado === "pendiente" || detalle.estado === "en_revision";

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaEstado estado={detalle.estado} />
          <span className="rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-glow-300">{detalle.tipo === "comentario" ? "Comentario" : "Usuario"}</span>
          <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-200">{ETIQUETAS_MOTIVO[detalle.motivo] ?? detalle.motivo}</span>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Creado {fechaCompleta(detalle.fecha_creacion)} · Actualizado {fechaCompleta(detalle.fecha_actualizacion)}
        </p>
      </section>

      <section aria-labelledby="contenido-denunciado">
        <h3 id="contenido-denunciado" className="text-xs font-bold uppercase tracking-wider text-ink-500">Contenido denunciado</h3>
        <div className="mt-2 rounded-2xl border border-white/5 bg-night-900/70 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-200">{contenidoCompleto(snapshot, detalle)}</p>
          <p className="mt-3 text-xs text-ink-500">{usuarioAsociado(snapshot, detalle)}</p>
          {snapshot.contenido_tipo && snapshot.contenido_tmdb_id && (
            <a href={`/content/${snapshot.contenido_tipo}/${snapshot.contenido_tmdb_id}`} className="mt-3 inline-flex text-xs font-bold text-glow-400 hover:text-glow-300">Abrir contexto original</a>
          )}
        </div>
      </section>

      {detalle.descripcion && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">Descripción del reporte</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">{detalle.descripcion}</p>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">Denunciantes</h3>
          <span className="text-xs font-semibold text-ink-400">{detalle.denunciantes.length}</span>
        </div>
        <div className="mt-2 divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-900/40">
          {detalle.denunciantes.map((denunciante) => (
            <div key={`${denunciante.id}-${denunciante.fecha}`} className="p-3.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <strong className="text-ink-200">@{denunciante.usuario}</strong>
                <time className="text-xs text-ink-500" dateTime={denunciante.fecha}>{fechaBreve(denunciante.fecha)}</time>
              </div>
              <p className="mt-1 text-xs text-ink-400">{ETIQUETAS_MOTIVO[denunciante.motivo] ?? denunciante.motivo}{denunciante.descripcion ? ` · ${denunciante.descripcion}` : ""}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">Historial de moderación</h3>
        {detalle.historial.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-ink-500">Todavía no hay acciones administrativas en este caso.</p>
        ) : (
          <ol className="mt-3 space-y-3 border-l border-white/10 pl-4">
            {detalle.historial.map((registro) => (
              <li key={registro.id} className="relative text-sm before:absolute before:top-1.5 before:-left-[1.29rem] before:size-2 before:rounded-full before:bg-glow-400">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="text-ink-200">{etiquetaAccion(registro.accion)}</strong>
                  <time className="text-xs text-ink-500" dateTime={registro.fecha}>{fechaBreve(registro.fecha)}</time>
                </div>
                <p className="mt-1 text-xs text-ink-400">@{registro.administrador_usuario} · {registro.motivo}</p>
                {registro.nota_interna && <p className="mt-1 text-xs text-ink-500">Nota: {registro.nota_interna}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {casoActivo && (
        <section className="border-t border-white/10 pt-5">
          <h3 className="font-display text-base font-bold text-ink-100">Acciones de moderación</h3>
          <p className="mt-1 text-xs text-ink-500">Las acciones requieren confirmación y quedan registradas.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {detalle.estado === "pendiente" && (
              <button type="button" disabled={procesando} onClick={() => void tomarCaso()} className="rounded-full border border-sky-400/30 px-4 py-2 text-sm font-bold text-sky-300 hover:bg-sky-400/10 disabled:opacity-50">Tomar caso</button>
            )}
            {acciones.map((accion) => (
              <button key={accion.valor} type="button" disabled={procesando} onClick={() => setAccionElegida(accion)} className={claseAccion(accion.tono, accionElegida?.valor === accion.valor)}>
                {iconoAccion(accion.valor)} {accion.etiqueta}
              </button>
            ))}
          </div>

          {accionElegida && (
            <form onSubmit={ejecutarAccion} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-night-900/70 p-4">
              <div>
                <p className="font-bold text-ink-100">{accionElegida.etiqueta}</p>
                <p className="mt-1 text-xs text-ink-500">Indicá el motivo que quedará en el historial.</p>
              </div>
              <textarea name="motivo" required minLength={3} rows={3} placeholder="Motivo de la decisión" className="resize-none rounded-xl border border-night-600 bg-night-950 px-3 py-2 text-sm" />
              <input name="nota" placeholder="Nota interna (opcional)" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2 text-sm" />
              {accionElegida.valor === "suspender_usuario" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-semibold text-ink-400">Duración en horas<input name="horas" type="number" min="1" max="8760" placeholder="Vacío = permanente" className="rounded-xl border border-night-600 bg-night-950 px-3 py-2 text-sm" /></label>
                  <label className="flex items-center gap-2 self-end rounded-xl border border-white/5 px-3 py-2 text-xs text-ink-400"><input name="ocultar" type="checkbox" defaultChecked /> Ocultar su contenido</label>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAccionElegida(null)} className="rounded-full px-4 py-2 text-sm font-bold text-ink-400 hover:text-ink-100">Cancelar</button>
                <button disabled={procesando} className="rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{procesando ? "Aplicando…" : "Continuar y confirmar"}</button>
              </div>
            </form>
          )}
          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        </section>
      )}

      {!casoActivo && detalle.resolucion && (
        <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Resolución</h3>
          <p className="mt-2 text-sm text-ink-200">{detalle.resolucion}</p>
        </section>
      )}
    </div>
  );
}

function accionesDisponibles(detalle: ReporteDetalle, snapshot: Record<string, string>): AccionCaso[] {
  const acciones: AccionCaso[] = [{ valor: "descartar_reporte", etiqueta: "Descartar reporte", tono: "neutro" }];
  if (detalle.tipo === "comentario") {
    if (detalle.estado_contenido === "visible") {
      acciones.push(
        { valor: "ocultar_comentario", etiqueta: "Ocultar temporalmente", tono: "advertencia" },
        { valor: "eliminar_comentario", etiqueta: "Retirar contenido", tono: "peligro" }
      );
    } else if (detalle.estado_contenido) {
      acciones.push({ valor: "restaurar_comentario", etiqueta: "Restaurar contenido", tono: "positivo" });
    }
    if (snapshot.autor_id && detalle.estado_objetivo_usuario === "activo") {
      acciones.push({ valor: "suspender_usuario", etiqueta: "Suspender usuario", tono: "peligro", rutaUsuario: true });
    } else if (snapshot.autor_id && detalle.estado_objetivo_usuario === "suspendido") {
      acciones.push({ valor: "reactivar_usuario", etiqueta: "Reactivar usuario", tono: "positivo", rutaUsuario: true });
    }
  } else if (detalle.estado_objetivo_usuario === "activo") {
    acciones.push(
      { valor: "suspender_usuario", etiqueta: "Suspender usuario", tono: "peligro" },
      { valor: "eliminar_usuario", etiqueta: "Eliminar cuenta", tono: "peligro" }
    );
  } else if (detalle.estado_objetivo_usuario === "suspendido") {
    acciones.push(
      { valor: "reactivar_usuario", etiqueta: "Reactivar usuario", tono: "positivo" },
      { valor: "eliminar_usuario", etiqueta: "Eliminar cuenta", tono: "peligro" }
    );
  }
  return acciones;
}

function EstadoVacio({ pendientes, verTodos }: Readonly<{ pendientes: boolean; verTodos: () => void }>) {
  return (
    <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-white/10 bg-night-900/30 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><CheckCircleIcon className="size-6" weight="fill" /></span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink-100">{pendientes ? "Estás al día. No hay reportes pendientes" : "No hay reportes para estos filtros"}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-500">{pendientes ? "Podés revisar el historial completo o esperar nuevos reportes." : "Probá modificando la búsqueda o los filtros seleccionados."}</p>
      {pendientes && <button type="button" onClick={verTodos} className="mt-5 rounded-full border border-glow-400/30 px-5 py-2 text-sm font-bold text-glow-300 hover:bg-glow-400/10">Ver todos los reportes</button>}
    </div>
  );
}

function DetalleEsqueleto() {
  return <div aria-label="Cargando detalle" aria-busy="true" className="space-y-5">{["w-44", "w-full", "w-4/5", "w-full"].map((ancho, indice) => <div key={`${ancho}-${indice}`} className={`h-20 animate-pulse rounded-2xl bg-white/5 ${ancho}`} />)}</div>;
}

function EtiquetaEstado({ estado }: Readonly<{ estado: ReporteAdmin["estado"] }>) {
  const datos = ESTADOS[estado];
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${datos.clase}`}>{datos.etiqueta}</span>;
}

function Filtro({ label, value, onChange, opciones }: Readonly<{ label: string; value: string; onChange: (valor: string) => void; opciones: string[][] }>) {
  return <label className="grid gap-1 text-xs font-semibold text-ink-400">{label}<select aria-label={label} value={value} onChange={(evento) => onChange(evento.target.value)} className="w-full rounded-xl border border-night-600 bg-night-950 px-3 py-2 text-sm text-ink-100">{opciones.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}</select></label>;
}

function CampoFecha({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (valor: string) => void }>) {
  return <label className="grid gap-1 text-xs font-semibold text-ink-400">{label}<input type="date" value={value} onChange={(evento) => onChange(evento.target.value)} className="rounded-xl border border-night-600 bg-night-950 px-3 py-2 text-sm text-ink-100" /></label>;
}

function Paginacion({ total, pagina, setPagina }: Readonly<{ total: number; pagina: number; setPagina: React.Dispatch<React.SetStateAction<number>> }>) {
  const paginas = Math.ceil(total / 20);
  return <nav aria-label="Paginación de reportes" className="mt-6 flex items-center justify-center gap-4"><button type="button" disabled={pagina === 1} onClick={() => setPagina((valor) => valor - 1)} className="rounded-full border border-white/10 px-4 py-2 text-sm disabled:opacity-40">Anterior</button><span className="text-sm text-ink-400">Página {pagina} de {paginas}</span><button type="button" disabled={pagina >= paginas} onClick={() => setPagina((valor) => valor + 1)} className="rounded-full border border-white/10 px-4 py-2 text-sm disabled:opacity-40">Siguiente</button></nav>;
}

function leerSnapshot(reporte: ReporteAdmin): Record<string, string> {
  try {
    return JSON.parse(reporte.contenido_snapshot) as Record<string, string>;
  } catch {
    return { texto: reporte.contenido_snapshot };
  }
}

function vistaPrevia(snapshot: Record<string, string>, reporte: ReporteAdmin): string {
  const contenido = contenidoCompleto(snapshot, reporte);
  return contenido.length > 105 ? `${contenido.slice(0, 102)}…` : contenido;
}

function contenidoCompleto(snapshot: Record<string, string>, reporte: ReporteAdmin): string {
  if (snapshot.texto) return snapshot.texto;
  const usuario = snapshot.nombre_usuario ?? reporte.objetivo_usuario ?? "desconocido";
  const nombre = [snapshot.nombre, snapshot.apellido].filter(Boolean).join(" ");
  return nombre ? `${nombre} (@${usuario})` : `Perfil @${usuario}`;
}

function usuarioAsociado(snapshot: Record<string, string>, reporte: ReporteAdmin): string {
  const usuario = snapshot.autor_usuario ?? snapshot.nombre_usuario ?? reporte.objetivo_usuario;
  return usuario ? `@${usuario}` : reporte.tipo === "comentario" ? "Autor no disponible" : "Usuario no disponible";
}

function fechaBreve(fecha: string): string {
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(fecha));
}

function fechaCompleta(fecha: string): string {
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(fecha));
}

function etiquetaAccion(accion: string): string {
  return accion.replaceAll("_", " ").replace(/^./, (letra) => letra.toUpperCase());
}

function mensajeError(problema: unknown): string {
  return problema instanceof ApiError ? problema.message : "No se pudo aplicar la acción.";
}

function claseAccion(tono: AccionCaso["tono"], activa: boolean): string {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50";
  const clases = {
    neutro: "border-white/15 text-ink-300 hover:bg-white/5",
    advertencia: "border-amber-400/30 text-amber-200 hover:bg-amber-400/10",
    peligro: "border-rose-400/30 text-rose-300 hover:bg-rose-400/10",
    positivo: "border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10",
  };
  return `${base} ${clases[tono]} ${activa ? "bg-white/10" : ""}`;
}

function iconoAccion(accion: string) {
  if (accion === "descartar_reporte") return <XIcon />;
  if (accion.includes("suspender") || accion.includes("eliminar_usuario")) return <UserMinusIcon />;
  if (accion.includes("eliminar_comentario")) return <TrashIcon />;
  if (accion.includes("ocultar")) return <EyeIcon />;
  if (accion.includes("restaurar") || accion.includes("reactivar")) return <CheckCircleIcon />;
  return <ShieldWarningIcon />;
}
