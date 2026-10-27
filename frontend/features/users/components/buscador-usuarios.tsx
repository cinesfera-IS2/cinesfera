"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/api";

type Usuario = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  foto_url: string | null;
};
type Resultados = { usuarios: Usuario[]; hay_mas: boolean };
const LIMITE = 20;
const BOTON = "rounded-full bg-brand-500 px-5 py-3 font-semibold text-white hover:bg-brand-400 disabled:opacity-50";

export function BuscadorUsuarios() {
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [offset, setOffset] = useState(0);
  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const peticion = useRef<AbortController | null>(null);

  useEffect(() => () => peticion.current?.abort(), []);

  async function buscar(consulta: string, inicio = 0) {
    peticion.current?.abort();
    const controlador = new AbortController();
    peticion.current = controlador;
    setBusqueda(consulta);
    setOffset(inicio);
    setResultados(null);
    setError(null);
    setSinSesion(false);
    setCargando(true);
    try {
      const parametros = new URLSearchParams({ q: consulta, limite: String(LIMITE), offset: String(inicio) });
      const datos = await apiFetch<Resultados>(`/usuarios/buscar?${parametros}`, {
        credentials: "include",
        signal: controlador.signal,
      });
      if (!controlador.signal.aborted) setResultados(datos);
    } catch (fallo) {
      if (!controlador.signal.aborted) {
        setSinSesion(fallo instanceof ApiError && fallo.status === 401);
        setError("No se pudo completar la búsqueda. Volvé a intentarlo.");
      }
    } finally {
      if (!controlador.signal.aborted) setCargando(false);
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const consulta = texto.trim();
    if (consulta) void buscar(consulta);
  }

  return (
    <section aria-label="Buscador de usuarios">
      <form onSubmit={enviar} role="search" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor="buscar-usuario" className="mb-2 block text-sm font-medium">Nombre o nombre de usuario</label>
          <input id="buscar-usuario" type="search" value={texto} maxLength={150}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Por ejemplo, María o mariacine"
            className="w-full rounded-xl border border-white/15 bg-night-900 px-4 py-3 text-ink-100 focus-visible:outline-2 focus-visible:outline-brand-400" />
        </div>
        <button type="submit" disabled={!texto.trim()} className={BOTON}>Buscar</button>
      </form>

      <div className="mt-8" aria-live="polite" aria-busy={cargando}>
        {cargando && <p role="status" className="text-ink-400">Buscando usuarios…</p>}
        {error && (
          <div role="alert" className="rounded-xl border border-white/15 bg-night-900 p-5">
            {sinSesion ? (
              <p>Iniciá sesión para buscar usuarios. <Link href="/login?volver=%2Fusuarios" className="text-brand-400 underline">Acceder</Link></p>
            ) : (
              <><p>{error}</p><button className={`${BOTON} mt-4`} onClick={() => void buscar(busqueda, offset)}>Reintentar</button></>
            )}
          </div>
        )}
        {!busqueda && <p className="text-ink-400">Escribí un nombre para encontrar personas.</p>}
        {resultados && (
          <>
            {resultados.usuarios.length === 0 ? (
              <p className="text-ink-400">No se encontraron usuarios para “{busqueda}”.</p>
            ) : (
              <>
              <p className="mb-4 text-sm text-ink-400">Resultados para “{busqueda}” · Página {offset / LIMITE + 1}</p>
              <ul className="space-y-3" aria-label="Resultados de usuarios">
                {resultados.usuarios.map((usuario) => (
                  <li key={usuario.id}>
                    <Link href={`/profile/${encodeURIComponent(usuario.nombre_usuario)}`}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-night-900 p-4 transition-colors hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-brand-400">
                      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-500 font-bold text-white">
                        {usuario.foto_url ? (
                          // Las fotos de perfil pueden venir de distintos proveedores.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={usuario.foto_url} alt={`Foto de ${usuario.nombre} ${usuario.apellido}`} className="size-full object-cover" />
                        ) : <span aria-hidden="true">{usuario.nombre.at(0)}{usuario.apellido.at(0)}</span>}
                      </span>
                      <span className="min-w-0"><span className="block truncate font-semibold">{usuario.nombre} {usuario.apellido}</span><span className="block truncate text-sm text-ink-400">@{usuario.nombre_usuario}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
              </>
            )}
            {(offset > 0 || resultados.hay_mas) && (
              <nav aria-label="Páginas de usuarios" className="mt-6 flex items-center justify-between gap-3">
                <button className={BOTON} disabled={offset === 0} onClick={() => void buscar(busqueda, offset - LIMITE)}>Anterior</button>
                <span className="text-sm text-ink-400">Página {offset / LIMITE + 1}</span>
                <button className={BOTON} disabled={!resultados.hay_mas} onClick={() => void buscar(busqueda, offset + LIMITE)}>Siguiente</button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
