"use client";

import {
  CameraIcon,
  CheckIcon,
  InfoIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { AuthField } from "@/features/auth";
import { recortarFotoPerfil } from "@/features/profile/lib/recortar-foto";
import type { PerfilPublico } from "@/features/profile/types";
import { ApiError, apiFetch } from "@/lib/api";

type ProfileEditDialogProps = {
  perfil: PerfilPublico;
};

type Genero = {
  id: number;
  nombre: string;
};

const LIMITE_GENEROS = 5;
const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

export function ProfileEditDialog({ perfil }: ProfileEditDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const dialogoRecorte = useRef<HTMLDialogElement>(null);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const arrastre = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | undefined>(undefined);
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();
  const [cargandoGeneros, setCargandoGeneros] = useState(false);
  const [generosDisponibles, setGenerosDisponibles] = useState<Genero[]>();
  const [generosSeleccionados, setGenerosSeleccionados] = useState<string[]>(
    perfil.generosFavoritos
  );
  const [foto, setFoto] = useState<File>();
  const [vistaPrevia, setVistaPrevia] = useState<string>();
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [fotoPendiente, setFotoPendiente] = useState<File>();
  const [vistaPreviaRecorte, setVistaPreviaRecorte] = useState<string>();
  const [posicionRecorte, setPosicionRecorte] = useState({ x: 50, y: 50 });
  const [recortando, setRecortando] = useState(false);
  const [errorRecorte, setErrorRecorte] = useState<string>();

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia]
  );

  useEffect(
    () => () => {
      if (vistaPreviaRecorte) URL.revokeObjectURL(vistaPreviaRecorte);
    },
    [vistaPreviaRecorte]
  );

  async function abrir() {
    setError(undefined);
    setGenerosSeleccionados(perfil.generosFavoritos);
    setFoto(undefined);
    setVistaPrevia(undefined);
    setQuitarFoto(false);
    setFotoPendiente(undefined);
    setVistaPreviaRecorte(undefined);
    if (entradaFoto.current) entradaFoto.current.value = "";
    dialogo.current?.showModal();

    if (generosDisponibles) return;

    setCargandoGeneros(true);
    try {
      setGenerosDisponibles(
        await apiFetch<Genero[]>("/contenidos/generos", { cache: "no-store" })
      );
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudieron cargar los géneros disponibles"
      );
    } finally {
      setCargandoGeneros(false);
    }
  }

  function seleccionarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const seleccionada = evento.target.files?.[0];
    if (!seleccionada) return;
    if (!TIPOS_FOTO.includes(seleccionada.type)) {
      setError("La imagen debe ser JPEG, PNG o WebP");
      evento.target.value = "";
      return;
    }
    if (seleccionada.size > TAMANO_MAXIMO_FOTO) {
      setError("La imagen no puede superar los 5 MB");
      evento.target.value = "";
      return;
    }
    setError(undefined);
    setErrorRecorte(undefined);
    setFotoPendiente(seleccionada);
    setVistaPreviaRecorte(URL.createObjectURL(seleccionada));
    setPosicionRecorte({ x: 50, y: 50 });
    queueMicrotask(() => dialogoRecorte.current?.showModal());
  }

  function iniciarArrastre(evento: ReactPointerEvent<HTMLDivElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arrastre.current = {
      pointerId: evento.pointerId,
      clientX: evento.clientX,
      clientY: evento.clientY,
      ...posicionRecorte,
    };
  }

  function moverRecorte(evento: ReactPointerEvent<HTMLDivElement>) {
    const inicio = arrastre.current;
    if (!inicio || inicio.pointerId !== evento.pointerId) return;
    const area = evento.currentTarget.getBoundingClientRect();
    if (!area.width || !area.height) return;
    setPosicionRecorte({
      x: limitar(inicio.x - ((evento.clientX - inicio.clientX) / area.width) * 100),
      y: limitar(inicio.y - ((evento.clientY - inicio.clientY) / area.height) * 100),
    });
  }

  function terminarArrastre() {
    arrastre.current = undefined;
  }

  function cancelarRecorte() {
    dialogoRecorte.current?.close();
    setFotoPendiente(undefined);
    setVistaPreviaRecorte(undefined);
    setErrorRecorte(undefined);
    if (entradaFoto.current) entradaFoto.current.value = "";
  }

  async function confirmarRecorte() {
    if (!fotoPendiente) return;
    setRecortando(true);
    setErrorRecorte(undefined);
    try {
      const fotoRecortada = await recortarFotoPerfil(
        fotoPendiente,
        posicionRecorte
      );
      setFoto(fotoRecortada);
      setVistaPrevia(URL.createObjectURL(fotoRecortada));
      setQuitarFoto(false);
      dialogoRecorte.current?.close();
      setFotoPendiente(undefined);
      setVistaPreviaRecorte(undefined);
      if (entradaFoto.current) entradaFoto.current.value = "";
    } catch (fallo) {
      setErrorRecorte(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo recortar la foto seleccionada"
      );
    } finally {
      setRecortando(false);
    }
  }

  function eliminarSeleccion() {
    setFoto(undefined);
    setVistaPrevia(undefined);
    setQuitarFoto(Boolean(perfil.fotoUrl));
    if (entradaFoto.current) entradaFoto.current.value = "";
  }

  function alternarGenero(nombre: string) {
    setGenerosSeleccionados((actuales) => {
      if (actuales.includes(nombre)) {
        return actuales.filter((genero) => genero !== nombre);
      }
      if (actuales.length >= LIMITE_GENEROS) return actuales;
      return [...actuales, nombre];
    });
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    const texto = (nombre: string) => String(campos.get(nombre) ?? "").trim();
    const cambios: Record<string, string | string[] | null> = {};

    const nombre = texto("nombre");
    const apellido = texto("apellido");
    const nombreUsuario = texto("nombre_usuario").toLowerCase();
    const bio = texto("bio");
    const ubicacion = texto("ubicacion");
    const generosFavoritos = generosSeleccionados;

    if (nombre !== perfil.nombre) cambios.nombre = nombre;
    if (apellido !== perfil.apellido) cambios.apellido = apellido;
    if (nombreUsuario !== perfil.nombreUsuario) {
      cambios.nombre_usuario = nombreUsuario;
    }
    if (bio !== (perfil.bio ?? "")) cambios.bio = bio || null;
    if (ubicacion !== (perfil.ubicacion ?? "")) {
      cambios.ubicacion = ubicacion || null;
    }
    if (generosFavoritos.join("|") !== perfil.generosFavoritos.join("|")) {
      cambios.generos_favoritos = generosFavoritos;
    }

    if (Object.keys(cambios).length === 0 && !foto && !quitarFoto) {
      dialogo.current?.close();
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>(
        "/auth/csrf",
        { cache: "no-store" }
      );
      let actualizado: { nombre_usuario: string } = {
        nombre_usuario: perfil.nombreUsuario,
      };
      if (Object.keys(cambios).length > 0) {
        actualizado = await apiFetch<{ nombre_usuario: string }>(
          `/usuarios/${perfil.id}/perfil`,
          {
            method: "PATCH",
            headers: { "X-CSRF-Token": csrf_token },
            body: JSON.stringify(cambios),
          }
        );
      }
      if (foto) {
        const formularioFoto = new FormData();
        formularioFoto.append("archivo", foto);
        actualizado = await apiFetch<{ nombre_usuario: string }>(
          `/usuarios/${perfil.id}/foto-perfil`,
          {
            method: "PUT",
            headers: { "X-CSRF-Token": csrf_token },
            body: formularioFoto,
          }
        );
      } else if (quitarFoto) {
        actualizado = await apiFetch<{ nombre_usuario: string }>(
          `/usuarios/${perfil.id}/foto-perfil`,
          {
            method: "DELETE",
            headers: { "X-CSRF-Token": csrf_token },
          }
        );
      }

      dialogo.current?.close();
      if (actualizado.nombre_usuario !== perfil.nombreUsuario) {
        router.replace(
          `/profile/${encodeURIComponent(actualizado.nombre_usuario)}`
        );
      } else {
        router.refresh();
      }
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudieron guardar los cambios"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-100 transition-colors hover:border-white/40 hover:bg-white/5"
      >
        <PencilSimpleIcon weight="bold" className="size-4" />
        Editar perfil
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-editar-perfil"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-night-600 bg-night-850 p-0 text-ink-100 shadow-2xl shadow-black/60 backdrop:bg-night-950/80 backdrop:backdrop-blur-sm"
      >
        <form
          onSubmit={guardar}
          className="flex flex-col gap-5 p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="titulo-editar-perfil"
                className="font-display text-xl font-extrabold tracking-tight"
              >
                Editar perfil
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Los cambios se ven en tu perfil público.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
            >
              <XIcon weight="bold" className="size-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              label="Nombre"
              name="nombre"
              defaultValue={perfil.nombre}
              maxLength={50}
            />
            <AuthField
              label="Apellido"
              name="apellido"
              defaultValue={perfil.apellido}
              maxLength={50}
            />
          </div>

          <AuthField
            label="Nombre de usuario"
            name="nombre_usuario"
            defaultValue={perfil.nombreUsuario}
            maxLength={30}
            pattern="[a-z0-9._]+"
            icon={<span className="text-sm">@</span>}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Foto de perfil
            </span>
            <div className="flex items-center gap-4 rounded-xl border border-night-600 bg-night-900 p-3">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-brand-500 to-glow-400 font-display text-xl font-bold text-white">
                {vistaPrevia || (perfil.fotoUrl && !quitarFoto) ? (
                  // La vista previa es local y la foto guardada puede venir del backend.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vistaPrevia ?? perfil.fotoUrl}
                    alt="Vista previa de la foto de perfil"
                    className="size-full object-cover"
                  />
                ) : (
                  `${perfil.nombre.at(0) ?? ""}${perfil.apellido.at(0) ?? ""}`.toUpperCase()
                )}
              </span>
              <div className="flex flex-1 flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-ink-200 hover:border-white/40">
                  <CameraIcon className="size-4" />
                  {perfil.fotoUrl || foto ? "Cambiar foto" : "Subir foto"}
                  <input
                    ref={entradaFoto}
                    type="file"
                    name="foto"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={seleccionarFoto}
                    className="sr-only"
                  />
                </label>
                {(perfil.fotoUrl || foto) && !quitarFoto && (
                  <button
                    type="button"
                    onClick={eliminarSeleccion}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                  >
                    <TrashIcon className="size-4" /> Quitar
                  </button>
                )}
              </div>
            </div>
            <span className="text-xs text-ink-500">
              JPEG, PNG o WebP. Máximo 5 MB. Para mejor calidad, usá una imagen
              de al menos 512 × 512 píxeles.
            </span>
          </div>

          <AuthField
            label="Ubicación"
            name="ubicacion"
            required={false}
            maxLength={100}
            defaultValue={perfil.ubicacion ?? ""}
            placeholder="Montevideo, Uruguay"
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bio"
              className="text-xs font-semibold uppercase tracking-wider text-ink-400"
            >
              Sobre vos
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={280}
              defaultValue={perfil.bio ?? ""}
              placeholder="Contá qué tipo de cine te gusta."
              className="w-full resize-none rounded-lg border border-night-600 bg-night-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-brand-400"
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Géneros favoritos
            </legend>
            <span
              aria-live="polite"
              className="-mt-6 self-end text-xs font-semibold text-ink-500"
            >
              {generosSeleccionados.length} de {LIMITE_GENEROS} seleccionados
            </span>

            {cargandoGeneros && (
              <p className="text-sm text-ink-400">Cargando géneros…</p>
            )}

            {generosDisponibles && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {generosDisponibles.map((genero) => {
                  const seleccionado = generosSeleccionados.includes(
                    genero.nombre
                  );
                  const deshabilitado =
                    !seleccionado &&
                    generosSeleccionados.length >= LIMITE_GENEROS;

                  return (
                    <button
                      key={genero.id}
                      type="button"
                      aria-pressed={seleccionado}
                      disabled={deshabilitado}
                      onClick={() => alternarGenero(genero.nombre)}
                      className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        seleccionado
                          ? "border-brand-400 bg-brand-500/20 text-ink-100"
                          : "border-night-600 bg-night-900 text-ink-300 hover:border-white/30 hover:bg-white/5"
                      } disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      <span>{genero.nombre}</span>
                      {seleccionado && (
                        <CheckIcon
                          weight="bold"
                          aria-hidden="true"
                          className="size-4 shrink-0 text-glow-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-ink-500">
              Elegí hasta cinco opciones.
            </p>
          </fieldset>

          <p className="flex items-start gap-2 rounded-lg border border-night-600 bg-night-900/60 px-3 py-2.5 text-xs text-ink-400">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-glow-400" />
            El correo y la contraseña se administran desde la configuración de
            la cuenta.
            <Link
              href="/configuracion/cuenta"
              onClick={() => dialogo.current?.close()}
              className="shrink-0 font-semibold text-glow-400 hover:text-glow-300"
            >
              Ir a configuración
            </Link>
          </p>

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-300 transition-colors hover:border-white/40 hover:text-ink-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              aria-busy={guardando}
              className="rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogoRecorte}
        aria-labelledby="titulo-recortar-foto"
        onCancel={(evento) => {
          evento.preventDefault();
          cancelarRecorte();
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-night-600 bg-night-850 p-0 text-ink-100 shadow-2xl shadow-black/70 backdrop:bg-night-950/85 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="titulo-recortar-foto"
                className="font-display text-xl font-extrabold tracking-tight"
              >
                Ajustar foto
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Arrastrá la imagen para elegir qué se verá en tu perfil.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelarRecorte}
              aria-label="Cancelar recorte"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
            >
              <XIcon weight="bold" className="size-4" />
            </button>
          </div>

          <div
            role="img"
            aria-label="Área de recorte de la foto"
            onPointerDown={iniciarArrastre}
            onPointerMove={moverRecorte}
            onPointerUp={terminarArrastre}
            onPointerCancel={terminarArrastre}
            className="relative mx-auto aspect-square w-full max-w-90 cursor-grab touch-none select-none overflow-hidden bg-night-950 active:cursor-grabbing"
          >
            {vistaPreviaRecorte && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vistaPreviaRecorte}
                alt=""
                draggable={false}
                className="pointer-events-none size-full object-cover"
                style={{
                  objectPosition: `${posicionRecorte.x}% ${posicionRecorte.y}%`,
                }}
              />
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(3,7,18,0.72)] ring-2 ring-white"
            />
          </div>

          {errorRecorte && (
            <p role="alert" className="text-sm text-red-300">
              {errorRecorte}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cancelarRecorte}
              disabled={recortando}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-300 transition-colors hover:border-white/40 hover:text-ink-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarRecorte}
              disabled={recortando}
              aria-busy={recortando}
              className="rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
            >
              {recortando ? "Recortando…" : "Usar este recorte"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function limitar(valor: number) {
  return Math.min(100, Math.max(0, valor));
}
