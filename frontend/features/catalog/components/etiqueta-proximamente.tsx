type EtiquetaProximamenteProps = {
  className?: string;
};

export function EtiquetaProximamente({ className = "" }: Readonly<EtiquetaProximamenteProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-night-950/85 px-2.5 py-1 text-[0.6875rem] leading-none font-bold tracking-wide text-glow-300 uppercase ring-1 ring-glow-400/40 backdrop-blur-sm ${className}`}
    >
      Próximamente
    </span>
  );
}
