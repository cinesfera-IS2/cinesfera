"use client";

import {
  UserMinusIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      router.push("/login");
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
        onClick={alternarSeguimiento}
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
    </div>
  );
}
