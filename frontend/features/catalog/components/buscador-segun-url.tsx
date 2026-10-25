"use client";

import { useSearchParams } from "next/navigation";

import { BuscadorCatalogo } from "@/features/catalog/components/buscador-catalogo";
import { useNavegacionCatalogo } from "@/features/catalog/components/navegacion-catalogo";
import { hrefCatalogo, leerFiltros } from "@/features/catalog/lib/filtros";

/** El buscador vive en el layout, que no recibe los searchParams, así que los lee de la URL. */
export function BuscadorSegunUrl() {
  const searchParams = useSearchParams();
  const navegacion = useNavegacionCatalogo();

  function buscar(evento: React.FormEvent<HTMLFormElement>) {
    if (!navegacion) return;
    evento.preventDefault();
    const campos = Object.fromEntries(new FormData(evento.currentTarget)) as Record<string, string>;
    navegacion.navegar(hrefCatalogo(leerFiltros(campos)), false);
  }

  return (
    <BuscadorCatalogo filtros={leerFiltros(Object.fromEntries(searchParams))} onSubmit={buscar} />
  );
}
