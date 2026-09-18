import type { ReactNode } from "react";

type EmptyStateProps = {
  Icon: (props: { className?: string }) => ReactNode;
  titulo: string;
  descripcion: string;
  /** Botón o enlace opcional, p. ej. "Escribir mi primera reseña". */
  accion?: ReactNode;
};

export function EmptyState({
  Icon,
  titulo,
  descripcion,
  accion,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-500">
        <Icon className="size-6" />
      </span>
      <h3 className="font-display text-base font-bold text-ink-100">
        {titulo}
      </h3>
      <p className="max-w-sm text-sm text-ink-400 text-pretty">{descripcion}</p>
      {accion}
    </div>
  );
}
