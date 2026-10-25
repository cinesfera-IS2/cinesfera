import { ResultadosCatalogo, leerFiltros } from "@/features/catalog";

export default async function CatalogoPage({
  searchParams,
}: PageProps<"/catalogo">) {
  const filtros = leerFiltros(await searchParams);

  return <ResultadosCatalogo filtros={filtros} />;
}
