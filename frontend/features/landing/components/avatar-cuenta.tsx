import Image from "next/image";

import type { UsuarioSesion } from "@/features/auth/session";

type AvatarCuentaProps = {
  usuario: UsuarioSesion;
  /** `sm` va en el botón de la cabecera, `md` dentro del menú. */
  tamano?: "sm" | "md";
};

/** Es decorativo: el nombre siempre aparece al lado o en la etiqueta del botón. */
export function AvatarCuenta({ usuario, tamano = "sm" }: AvatarCuentaProps) {
  const iniciales = `${usuario.nombre.at(0) ?? ""}${usuario.apellido.at(0) ?? ""}`.toUpperCase();
  const esChico = tamano === "sm";

  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-brand-500 to-glow-400 font-display font-extrabold text-white ring-1 ring-white/15 ${
        esChico ? "size-8 text-xs" : "size-10 text-sm"
      }`}
    >
      {usuario.foto_url ? (
        <Image
          src={usuario.foto_url}
          alt=""
          fill
          sizes={esChico ? "32px" : "40px"}
          className="object-cover"
        />
      ) : (
        iniciales
      )}
    </span>
  );
}
