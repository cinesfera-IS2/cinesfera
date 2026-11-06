"use client";

import { BellIcon, CheckIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Desplegable } from "@/features/landing/components/desplegable";
import { ApiError, apiFetch } from "@/lib/api";

type ActorNotificacion = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  foto_url: string | null;
};

type Notificacion = {
  id: string;
  tipo: "nuevo_seguidor";
  leida: boolean;
  fecha: string;
  actor: ActorNotificacion;
};

type Bandeja = {
  items: Notificacion[];
  no_leidas: number;
};

const INTERVALO_ACTUALIZACION = 60_000;

export function NotificationsMenu() {
  const router = useRouter();
  const [bandeja, setBandeja] = useState<Bandeja>({
    items: [],
    no_leidas: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string>();

  const cargar = useCallback(async (mostrarCarga = false) => {
    if (mostrarCarga) setCargando(true);
    try {
      const resultado = await apiFetch<Bandeja>("/notificaciones", {
        cache: "no-store",
      });
      setBandeja(resultado);
      setError(undefined);
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudieron cargar las notificaciones."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const cargaInicial = window.setTimeout(() => void cargar(), 0);
    const intervalo = window.setInterval(
      () => void cargar(),
      INTERVALO_ACTUALIZACION
    );
    return () => {
      window.clearTimeout(cargaInicial);
      window.clearInterval(intervalo);
    };
  }, [cargar]);

  async function mutar(ruta: string) {
    const { csrf_token } = await apiFetch<{ csrf_token: string }>(
      "/auth/csrf",
      { cache: "no-store" }
    );
    await apiFetch<null>(ruta, {
      method: "PATCH",
      headers: { "X-CSRF-Token": csrf_token },
    });
  }

  async function abrirNotificacion(notificacion: Notificacion) {
    if (!notificacion.leida) {
      setBandeja((actual) => ({
        no_leidas: Math.max(0, actual.no_leidas - 1),
        items: actual.items.map((item) =>
          item.id === notificacion.id ? { ...item, leida: true } : item
        ),
      }));
      try {
        await mutar(`/notificaciones/${notificacion.id}/leer`);
      } catch {
        await cargar();
      }
    }
    router.push(
      `/profile/${encodeURIComponent(notificacion.actor.nombre_usuario)}`
    );
  }

  async function marcarTodas() {
    const anterior = bandeja;
    setBandeja((actual) => ({
      no_leidas: 0,
      items: actual.items.map((item) => ({ ...item, leida: true })),
    }));
    try {
      await mutar("/notificaciones/leer-todas");
    } catch (fallo) {
      setBandeja(anterior);
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudieron marcar las notificaciones."
      );
    }
  }

  const cantidadVisible =
    bandeja.no_leidas > 99 ? "99+" : String(bandeja.no_leidas);

  return (
    <Desplegable
      etiqueta={`Notificaciones, ${bandeja.no_leidas} sin leer`}
      className="relative"
      botonClassName="relative grid size-10 place-items-center rounded-full text-ink-300 transition-colors hover:bg-white/5 hover:text-ink-100 aria-expanded:bg-white/5 aria-expanded:text-ink-100"
      boton={
        <>
          <BellIcon weight="bold" className="size-5" />
          {bandeja.no_leidas > 0 && (
            <span className="absolute top-0 right-0 grid min-w-4.5 place-items-center rounded-full bg-brand-500 px-1 text-[0.625rem] leading-[1.125rem] font-bold text-white">
              {cantidadVisible}
            </span>
          )}
        </>
      }
      panelClassName="absolute top-[calc(100%+0.5rem)] right-0 w-[min(24rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-white/10 bg-night-900 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.7)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div>
          <p className="font-display text-sm font-bold text-ink-100">
            Notificaciones
          </p>
          <p className="text-xs text-ink-500">
            {bandeja.no_leidas === 1
              ? "1 sin leer"
              : `${bandeja.no_leidas} sin leer`}
          </p>
        </div>
        {bandeja.no_leidas > 0 && (
          <button
            type="button"
            onClick={() => void marcarTodas()}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-glow-300 hover:bg-white/5"
          >
            <CheckIcon weight="bold" className="size-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      <div className="max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto p-1.5">
        {cargando && bandeja.items.length === 0 && (
          <p role="status" className="px-4 py-10 text-center text-sm text-ink-400">
            Cargando…
          </p>
        )}
        {error && bandeja.items.length === 0 && !cargando && (
          <div className="px-4 py-8 text-center">
            <p role="alert" className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => void cargar(true)}
              className="mt-3 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-ink-200"
            >
              Reintentar
            </button>
          </div>
        )}
        {!cargando && !error && bandeja.items.length === 0 && (
          <div className="grid place-items-center gap-2 px-4 py-10 text-center text-ink-400">
            <BellIcon className="size-8 text-ink-500" />
            <p className="text-sm">Todavía no tenés notificaciones.</p>
          </div>
        )}
        {bandeja.items.map((notificacion) => (
          <button
            key={notificacion.id}
            type="button"
            onClick={() => void abrirNotificacion(notificacion)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5 ${
              notificacion.leida ? "opacity-70" : "bg-brand-500/8"
            }`}
          >
            <AvatarNotificacion actor={notificacion.actor} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-ink-200">
                <strong className="font-semibold text-ink-100">
                  {notificacion.actor.nombre} {notificacion.actor.apellido}
                </strong>{" "}
                comenzó a seguirte.
              </span>
              <span className="mt-0.5 block text-xs text-ink-500">
                @{notificacion.actor.nombre_usuario} · {formatearFecha(notificacion.fecha)}
              </span>
            </span>
            {!notificacion.leida && (
              <span
                aria-label="Sin leer"
                className="size-2 shrink-0 rounded-full bg-brand-400"
              />
            )}
          </button>
        ))}
      </div>
    </Desplegable>
  );
}

function AvatarNotificacion({ actor }: { actor: ActorNotificacion }) {
  const iniciales = `${actor.nombre.at(0) ?? ""}${
    actor.apellido.at(0) ?? ""
  }`.toUpperCase();

  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-500 to-glow-400 bg-cover bg-center text-xs font-bold text-white"
      style={
        actor.foto_url
          ? { backgroundImage: `url(${JSON.stringify(actor.foto_url)})` }
          : undefined
      }
    >
      {actor.foto_url ? null : iniciales || <UserCircleIcon className="size-5" />}
    </span>
  );
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
  }).format(new Date(fecha));
}
