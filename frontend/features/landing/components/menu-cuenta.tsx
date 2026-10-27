import { CaretDownIcon, ShieldCheckIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { LogoutButton } from "@/features/auth/components/logout-button";
import type { UsuarioSesion } from "@/features/auth/session";
import { AvatarCuenta } from "@/features/landing/components/avatar-cuenta";
import { Desplegable } from "@/features/landing/components/desplegable";

export const ITEM_DESPLEGABLE =
  "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink-300 transition-colors hover:bg-white/5 hover:text-ink-100";

type MenuCuentaProps = {
  usuario: UsuarioSesion;
};

/** Menú de la cuenta en escritorio. En móvil lo mismo vive dentro de MenuMovil. */
export function MenuCuenta({ usuario }: Readonly<MenuCuentaProps>) {
  return (
    <Desplegable
      etiqueta={`Cuenta de ${usuario.nombre}`}
      className="relative hidden md:block"
      botonClassName="group inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pr-3 pl-1 text-sm font-semibold text-ink-100 transition-[background-color,border-color,transform] duration-150 ease-out hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.97] aria-expanded:border-white/20 aria-expanded:bg-white/[0.06]"
      boton={
        <>
          <AvatarCuenta usuario={usuario} />
          <span className="max-w-32 truncate">{usuario.nombre}</span>
          <CaretDownIcon
            weight="bold"
            className="size-3.5 text-ink-400 transition-transform duration-200 ease-out group-aria-expanded:rotate-180"
          />
        </>
      }
      panelClassName="absolute top-[calc(100%+0.5rem)] right-0 w-64 origin-top-right rounded-xl border border-white/10 bg-night-900 p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.7)]"
    >
      <CuentaResumen usuario={usuario} />
      <AccionesCuenta usuario={usuario} />
    </Desplegable>
  );
}

export function CuentaResumen({ usuario }: Readonly<MenuCuentaProps>) {
  return (
    <div className="flex items-center gap-3 px-3 pt-2 pb-3">
      <AvatarCuenta usuario={usuario} tamano="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-100">
          {usuario.nombre} {usuario.apellido}
        </p>
        <p className="truncate text-xs text-ink-400">@{usuario.nombre_usuario}</p>
      </div>
    </div>
  );
}

export function AccionesCuenta({ usuario }: Readonly<MenuCuentaProps>) {
  return (
    <>
      <div aria-hidden className="mx-1.5 mb-1.5 h-px bg-white/5" />
      <Link href={`/profile/${usuario.nombre_usuario}`} className={ITEM_DESPLEGABLE}>
        <UserIcon weight="bold" className="size-4" />
        Mi perfil
      </Link>
      {usuario.rol === "admin" && (
        <Link href="/admin" className={ITEM_DESPLEGABLE}>
          <ShieldCheckIcon weight="fill" className="size-4" />
          Administración
        </Link>
      )}
      <LogoutButton className={ITEM_DESPLEGABLE} />
    </>
  );
}
