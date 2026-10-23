"use client";

import {
  UserMinusIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { hrefAcceso } from "@/features/auth/lib/destino";
import { ApiError, apiFetch } from "@/lib/api";

type EstadoSeguimiento = {
  siguiendo: boolean;
  te_sigue: boolean;
  son_amigos: boolean;
};

type SeguimientoCreado = {
  son_amigos: boolean;
};

type FollowButtonProps = {
  usuarioId: string;
  haySesion: boolean;
};

export function FollowButton({ usuarioId, haySesion }: FollowButtonProps) {
  const router = useRouter();
  const confirmacion = useRef<HTMLDialogElement>(null);
  const [estado, setEstado] = useState<EstadoSeguimiento>({
    siguiendo: false,
    te_sigue: false,
    son_amigos: false,
  });
  const [cargando, setCargando] = useState(haySesion);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!haySesion) return;

    let activo = true;
    apiFetch<EstadoSeguimiento>(`/usuarios/${usuarioId}/seguimiento`, {
      cache: "no-store",
    })
      .then((respuesta) => {
        if (activo) setEstado(respuesta);
      })
      .catch((fallo) => {
        if (activo) {
          setError(
            fallo instanceof ApiError
              ? fallo.message
              : "No se pudo consultar el seguimiento"
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [haySesion, usuarioId]);

  async function alternarSeguimiento() {
    if (!haySesion) {
      router.push(hrefAcceso("/login", location.pathname + location.search));
      return;
    }

    setCargando(true);
    setError(undefined);
    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>(
        "/auth/csrf",
        { cache: "no-store" }
      );
      const metodo = estado.siguiendo ? "DELETE" : "POST";
      const respuesta = await apiFetch<SeguimientoCreado | null>(
        `/usuarios/${usuarioId}/seguir`,
        {
          method: metodo,
          headers: { "X-CSRF-Token": csrf_token },
        }
      );

      setEstado((anterior) => ({
        ...anterior,
        siguiendo: !anterior.siguiendo,
        son_amigos:
          metodo === "POST" ? Boolean(respuesta?.son_amigos) : false,
      }));
      router.refresh();
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudo actualizar el seguimiento"
      );
    } finally {
      setCargando(false);
    }
  }

  function manejarClick() {
    if (estado.son_amigos) {
      confirmacion.current?.showModal();
      return;
    }

    void alternarSeguimiento();
  }

  function confirmarDejarDeSeguir() {
    confirmacion.current?.close();
    void alternarSeguimiento();
  }

  const etiqueta = estado.son_amigos
    ? "Amigos"
    : estado.siguiendo
      ? "Siguiendo"
      : "Seguir";
  const Icono = estado.son_amigos
    ? UsersThreeIcon
    : estado.siguiendo
      ? UserMinusIcon
      : UserPlusIcon;

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={cargando}
        aria-busy={cargando}
        aria-haspopup={estado.son_amigos ? "dialog" : undefined}
        aria-controls={estado.son_amigos ? "confirmar-dejar-amigo" : undefined}
        onClick={manejarClick}
        className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
      >
        <Icono weight="bold" className="size-4" />
        {cargando ? "Cargando…" : etiqueta}
      </button>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-300">
          {error}
        </p>
      )}

      <dialog
        ref={confirmacion}
        id="confirmar-dejar-amigo"
        aria-labelledby="titulo-dejar-amigo"
        aria-describedby="descripcion-dejar-amigo"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-night-600 bg-night-850 p-6 text-ink-100 shadow-2xl shadow-black/60 backdrop:bg-night-950/80 backdrop:backdrop-blur-sm"
      >
        <h2
          id="titulo-dejar-amigo"
          className="font-display text-xl font-extrabold tracking-tight"
        >
          ¿Dejar de seguir a este amigo?
        </h2>
        <p
          id="descripcion-dejar-amigo"
          className="mt-3 text-sm leading-relaxed text-ink-300"
        >
          Si dejás de seguirlo, dejarán de ser amigos. La otra persona todavía
          podrá seguirte.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => confirmacion.current?.close()}
            className="rounded-full border border-night-500 px-5 py-2 text-sm font-bold text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarDejarDeSeguir}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500"
          >
            Dejar de seguir
          </button>
        </div>
      </dialog>
    </div>
  );
}
