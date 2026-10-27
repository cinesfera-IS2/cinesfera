import { ListaNoDisponible, ListaObras, leerFiltros, obrasDestacadas } from "@/features/catalog";

export default async function JoyasPage({ searchParams }: PageProps<"/joyas">) {
  const { pagina } = leerFiltros(await searchParams);

  const lista = await obrasDestacadas(pagina).catch(() => null);

  return lista ? <ListaObras pagina={lista} ruta="/joyas" /> : <ListaNoDisponible />;
}
