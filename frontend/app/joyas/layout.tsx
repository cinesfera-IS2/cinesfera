import type { Metadata } from "next";

import { ListaLayout } from "@/features/landing";

export const metadata: Metadata = {
  title: "Joyas de la cartelera — Cinesfera",
  description: "Las películas más conocidas: las que todos vieron y de las que todos tienen algo para decir. Elegí una y dejá tu reseña.",
};

export default function JoyasLayout({ children }: LayoutProps<"/joyas">) {
  return (
    <ListaLayout titulo="Joyas de la cartelera" descripcion="Las películas más conocidas: las que todos vieron y de las que todos tienen algo para decir. Elegí una y dejá tu reseña.">
      {children}
    </ListaLayout>
  );
}
