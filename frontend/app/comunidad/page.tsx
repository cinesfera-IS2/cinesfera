import { ResultadoBusqueda, normalizarConsulta } from "@/features/community";

export default async function ComunidadPage({ searchParams }: PageProps<"/comunidad">) {
  const { q } = await searchParams;

  return <ResultadoBusqueda consulta={normalizarConsulta(q)} />;
}
