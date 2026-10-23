import { ListIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { EnlaceAcceder } from "@/features/auth/components/enlace-acceder";
import type { UsuarioSesion } from "@/features/auth/session";
import { AvatarCuenta } from "@/features/landing/components/avatar-cuenta";
import { Desplegable } from "@/features/landing/components/desplegable";
import {
  AccionesCuenta,
  CuentaResumen,
  ITEM_DESPLEGABLE,
} from "@/features/landing/components/menu-cuenta";
import { NAV_LINKS } from "@/features/landing/data/landing-content";

type MenuMovilProps = {
  usuario: UsuarioSesion | null;
};

/**
 * En móvil no entran los links ni la cuenta en la barra: todo queda en este
 * panel, que se despliega a lo ancho debajo de la cabecera.
 */
export function MenuMovil({ usuario }: MenuMovilProps) {
  return (
    <Desplegable
      etiqueta="Menú"
      className="md:hidden"
      botonClassName="group grid size-11 place-items-center rounded-full text-ink-100 transition-[background-color,transform] duration-150 ease-out hover:bg-white/5 active:scale-[0.94] aria-expanded:bg-white/5"
      boton={
        usuario ? (
          <AvatarCuenta usuario={usuario} />
        ) : (
          <>
            <ListIcon weight="bold" className="size-5 group-aria-expanded:hidden" />
            <XIcon weight="bold" className="hidden size-5 group-aria-expanded:block" />
          </>
        )
      }
      panelClassName="absolute inset-x-0 top-full origin-top border-b border-white/10 bg-night-900 px-4 pt-3 pb-5 shadow-[0_24px_40px_-24px_rgb(0_0_0/0.8)]"
    >
      <nav aria-label="Principal">
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`${ITEM_DESPLEGABLE} text-base`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-3 border-t border-white/5 pt-3">
        {usuario ? (
          <>
            <CuentaResumen usuario={usuario} />
            <AccionesCuenta usuario={usuario} />
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <EnlaceAcceder
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-ink-100 transition-[background-color,transform] duration-150 ease-out hover:bg-white/5 active:scale-[0.97]"
            >
              Acceder
            </EnlaceAcceder>
            <EnlaceAcceder
              ruta="/register"
              className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-400 active:scale-[0.97]"
            >
              Crear cuenta gratis
            </EnlaceAcceder>
          </div>
        )}
      </div>
    </Desplegable>
  );
}
