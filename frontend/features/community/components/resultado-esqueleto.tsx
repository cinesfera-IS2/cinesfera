export function ResultadoEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Buscando perfil">
      <div className="mb-6 flex h-8 items-center">
        <div className="h-5 w-48 animate-pulse rounded-md bg-night-800" />
      </div>
      <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-white/5 bg-night-900/60 p-4 sm:gap-5 sm:p-5">
        <div className="size-14 shrink-0 rounded-full bg-night-800 sm:size-16" />
        <div className="flex-1">
          <div className="h-4 w-40 rounded bg-night-800" />
          <div className="mt-2 h-3 w-24 rounded bg-night-800/70" />
          <div className="mt-3 h-3 w-56 max-w-full rounded bg-night-800/70" />
        </div>
      </div>
    </div>
  );
}
