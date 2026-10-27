import type { NavLink, ValueProp } from "@/features/landing/types";

export const NAV_LINKS: NavLink[] = [
  { label: "Buscar usuarios", href: "/usuarios" },
  { label: "Tendencias", href: "/tendencias" },
  { label: "Comunidad", href: "#comunidad" },
  { label: "Soporte", href: "#soporte" },
];

export const VALUE_PROPS: ValueProp[] = [
  {
    id: "seguimiento",
    title: "Seguimiento total",
    description: "Registrá todo lo que ves y armá tu historial de cine.",
  },
  {
    id: "resenas",
    title: "Reseñas honestas",
    description: "Leé y compartí opiniones reales de la comunidad.",
  },
  {
    id: "recomendaciones",
    title: "Recomendaciones",
    description: "Descubrí títulos afines a tu gusto cada semana.",
  },
];

export const FOOTER_SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "#privacidad" },
      { label: "Términos", href: "#terminos" },
      { label: "Cookies", href: "#cookies" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Foros", href: "#foros" },
      { label: "Eventos", href: "#eventos" },
      { label: "Creadores", href: "#creadores" },
    ],
  },
];
