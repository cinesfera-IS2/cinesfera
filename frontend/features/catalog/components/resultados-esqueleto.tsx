import { GRILLA_OBRAS } from "@/features/catalog/components/resultados-catalogo";
import { OBRAS_POR_PAGINA } from "@/features/catalog/data/catalogo";

export function ResultadosEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando catálogo">
      <div className="mb-6 h-5 w-48 animate-pulse rounded bg-night-800" />
      <ul className={GRILLA_OBRAS}>
        {Array.from({ length: OBRAS_POR_PAGINA }, (_, indice) => (
          <li key={indice} className="animate-pulse">
            <div className="aspect-2/3 rounded-lg bg-night-800" />
            <div className="mt-2.5 h-4 w-3/4 rounded bg-night-800" />
            <div className="mt-1.5 h-3 w-1/2 rounded bg-night-800/70" />
          </li>
        ))}
      </ul>
    </div>
  );
}
