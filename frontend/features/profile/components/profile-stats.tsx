"use client";

import { UserCircleIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";

import {
  obtenerListaSeguimientos,
  type ListaSeguimientos,
} from "@/features/profile/data/perfiles";
import { numeroCorto } from "@/features/profile/lib/fechas";
import type {
  EstadisticasPerfil,
  UsuarioSeguimiento,
} from "@/features/profile/types";
import { ApiError } from "@/lib/api";

type ProfileStatsProps = {
  usuarioId: string;
  estadisticas: EstadisticasPerfil;
};

const ETIQUETAS: Array<[keyof EstadisticasPerfil, string]> = [
  ["resenas", "Reseñas"],
  ["vistas", "Vistas"],
  ["seguidores", "Seguidores"],
  ["siguiendo", "Siguiendo"],
];

const LISTAS: ListaSeguimientos[] = ["seguidores", "seguidos"];

export function ProfileStats({ usuarioId, estadisticas }: ProfileStatsProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [listaActiva, setListaActiva] =
    useState<ListaSeguimientos>("seguidores");
  const [usuarios, setUsuarios] = useState<
    Partial<Record<ListaSeguimientos, UsuarioSeguimiento[]>>
  >({});
  const [cargando, setCargando] = useState<
    Partial<Record<ListaSeguimientos, boolean>>
  >({});
  const [errores, setErrores] = useState<
    Partial<Record<ListaSeguimientos, string>>
  >({});

  async function cargarLista(lista: ListaSeguimientos) {
    if (usuarios[lista] || cargando[lista]) return;

    setCargando((actual) => ({ ...actual, [lista]: true }));
    setErrores((actuales) => ({ ...actuales, [lista]: undefined }));
    try {
      const resultado = await obtenerListaSeguimientos(usuarioId, lista);
      setUsuarios((actuales) => ({ ...actuales, [lista]: resultado }));
    } catch (fallo) {
      setErrores((actuales) => ({
        ...actuales,
        [lista]:
          fallo instanceof ApiError
            ? fallo.message
            : "No se pudo cargar la lista.",
      }));
    } finally {
      setCargando((actual) => ({ ...actual, [lista]: false }));
    }
  }

  function abrir(lista: ListaSeguimientos) {
    setListaActiva(lista);
    dialogo.current?.showModal();
    void cargarLista(lista);
  }

  function cambiarLista(lista: ListaSeguimientos) {
    setListaActiva(lista);
    void cargarLista(lista);
  }

  const error = errores[listaActiva];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ETIQUETAS.map(([clave, etiqueta]) => {
          const esLista = clave === "seguidores" || clave === "siguiendo";
          const contenido = (
            <>
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-500">
                {etiqueta}
              </span>
              <span className="font-display text-xl font-extrabold text-ink-100">
                {numeroCorto(estadisticas[clave])}
              </span>
            </>
          );

          if (esLista) {
            const lista = clave === "siguiendo" ? "seguidos" : "seguidores";
            return (
              <div key={clave}>
                <button
                  type="button"
                  onClick={() => abrir(lista)}
                  aria-label={`Ver ${etiqueta.toLocaleLowerCase("es")}`}
                  className="flex w-full flex-col items-center gap-1 rounded-2xl border border-night-700 bg-night-900/60 px-4 py-4 transition-colors hover:border-frame/60 hover:bg-night-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                >
                  {contenido}
                </button>
              </div>
            );
          }

          return (
            <div
              key={clave}
              className="flex flex-col items-center gap-1 rounded-2xl border border-night-700 bg-night-900/60 px-4 py-4"
            >
              {contenido}
            </div>
          );
        })}
      </div>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-conexiones"
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl border border-night-600 bg-night-850 p-0 text-ink-100 shadow-2xl shadow-black/60 backdrop:bg-night-950/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[min(38rem,calc(100vh-2rem))] flex-col">
          <div className="flex items-center justify-between gap-4 px-6 pt-6">
            <h2
              id="titulo-conexiones"
              className="font-display text-xl font-extrabold tracking-tight"
            >
              Conexiones
            </h2>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
            >
              <XIcon weight="bold" className="size-4" />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Conexiones del perfil"
            className="mt-4 grid grid-cols-2 border-b border-night-700 px-6"
          >
            {LISTAS.map((lista) => {
              const seleccionada = listaActiva === lista;
              const cantidad =
                lista === "seguidores"
                  ? estadisticas.seguidores
                  : estadisticas.siguiendo;
              return (
                <button
                  key={lista}
                  type="button"
                  role="tab"
                  aria-selected={seleccionada}
                  onClick={() => cambiarLista(lista)}
                  className={`border-b-2 px-3 pb-3 text-sm font-semibold capitalize transition-colors ${
                    seleccionada
                      ? "border-brand-400 text-ink-100"
                      : "border-transparent text-ink-500 hover:text-ink-300"
                  }`}
                >
                  {lista} <span className="text-xs">{cantidad}</span>
                </button>
              );
            })}
          </div>

          <div className="min-h-56 overflow-y-auto p-4 sm:p-6">
            {cargando[listaActiva] && !usuarios[listaActiva] && (
              <p
                role="status"
                className="py-16 text-center text-sm text-ink-400"
              >
                Cargando…
              </p>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void cargarLista(listaActiva)}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-ink-200 hover:border-white/40"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!error && usuarios[listaActiva]?.length === 0 && (
              <div className="grid place-items-center gap-3 py-12 text-center text-ink-400">
                <UserCircleIcon className="size-10 text-ink-500" />
                <p className="text-sm">
                  {listaActiva === "seguidores"
                    ? "Este perfil todavía no tiene seguidores."
                    : "Este perfil todavía no sigue a nadie."}
                </p>
              </div>
            )}

            {!error && (usuarios[listaActiva]?.length ?? 0) > 0 && (
              <ul className="flex flex-col gap-2">
                {usuarios[listaActiva]?.map((usuario) => (
                  <li key={usuario.id}>
                    <Link
                      href={`/profile/${encodeURIComponent(usuario.nombreUsuario)}`}
                      onClick={() => dialogo.current?.close()}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                    >
                      <AvatarLista usuario={usuario} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-100">
                          {usuario.nombre} {usuario.apellido}
                        </span>
                        <span className="block truncate text-xs text-glow-400">
                          @{usuario.nombreUsuario}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

function AvatarLista({ usuario }: { usuario: UsuarioSeguimiento }) {
  const iniciales = `${usuario.nombre.at(0) ?? ""}${
    usuario.apellido.at(0) ?? ""
  }`.toUpperCase();

  return (
    <span
      aria-hidden
      className="grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-500 to-glow-400 bg-cover bg-center font-display text-sm font-extrabold text-white"
      style={
        usuario.fotoUrl
          ? { backgroundImage: `url(${JSON.stringify(usuario.fotoUrl)})` }
          : undefined
      }
    >
      {!usuario.fotoUrl && iniciales}
    </span>
  );
}
