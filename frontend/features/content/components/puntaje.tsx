import type { ReactNode } from "react";

type PuntajeProps = {
  fuente: string;
  /** El número ya formateado, o lo que se muestre en su lugar. */
  valor: ReactNode;
  escala?: number;
  detalle?: string;
  destacado?: boolean;
};

/** Un par fuente/valor dentro del `<dl>` de puntajes de la cabecera. */
export function Puntaje({
  fuente,
  valor,
  escala,
  detalle,
  destacado = false,
}: Readonly<PuntajeProps>) {
  return (
    <div className="flex min-w-24 flex-col gap-1">
      <dt className="text-xs font-semibold text-ink-400">{fuente}</dt>
      <dd className="flex h-10 items-baseline gap-1">
        <span
          className={`font-display text-4xl leading-none font-extrabold tabular-nums ${
            destacado ? "text-glow-300" : "text-ink-100"
          }`}
        >
          {valor}
        </span>
        {escala && (
          <span className="text-sm font-semibold text-ink-400">/{escala}</span>
        )}
      </dd>
      {detalle && <dd className="text-xs text-ink-400">{detalle}</dd>}
    </div>
  );
}
