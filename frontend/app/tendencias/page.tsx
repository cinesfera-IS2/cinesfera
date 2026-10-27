import { ListaNoDisponible, ListaObras, leerFiltros, obrasEnTendencia } from "@/features/catalog";

export default async function TendenciasPage({ searchParams }: PageProps<"/tendencias">) {
  const { pagina } = leerFiltros(await searchParams);

  const lista = await obrasEnTendencia(pagina).catch(() => null);

  return lista ? <ListaObras pagina={lista} ruta="/tendencias" /> : <ListaNoDisponible />;
}
