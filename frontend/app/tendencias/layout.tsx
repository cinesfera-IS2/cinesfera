import type { Metadata } from "next";

import { ListaLayout } from "@/features/landing";

export const metadata: Metadata = {
  title: "Tendencias de la semana — Cinesfera",
  description: "Lo que más se está viendo esta semana, entre películas y series. ¿Ya lo viste? Contá qué te pareció.",
};

export default function TendenciasLayout({ children }: LayoutProps<"/tendencias">) {
  return (
    <ListaLayout titulo="Tendencias de la semana" descripcion="Lo que más se está viendo esta semana, entre películas y series. ¿Ya lo viste? Contá qué te pareció.">
      {children}
    </ListaLayout>
  );
}
