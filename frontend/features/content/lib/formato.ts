import type { ContenidoDetalle } from "@/features/content/types";

/** 139 -> "2 h 19 min", 120 -> "2 h", 45 -> "45 min". */
export function duracionLegible(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

export function temporadasLegibles(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? "temporada" : "temporadas"}`;
}

/** El título original solo aporta cuando no coincide con el traducido. */
export function tituloOriginalDistinto(
  contenido: Pick<ContenidoDetalle, "titulo" | "titulo_original">
): string | null {
  const original = contenido.titulo_original?.trim();

  if (!original) return null;
  return original.toLocaleLowerCase("es") ===
    contenido.titulo.trim().toLocaleLowerCase("es")
    ? null
    : original;
}
