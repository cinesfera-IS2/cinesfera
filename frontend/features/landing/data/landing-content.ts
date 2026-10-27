import type { NavLink, ValueProp } from "@/features/landing/types";

export const NAV_LINKS: NavLink[] = [
  { label: "Tendencias", href: "/tendencias" },
  { label: "Comunidad", href: "/comunidad" },
  { label: "Soporte", href: "/soporte" },
];

export const EMAIL_SOPORTE = "soporte@cinesfera.com";

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
      { label: "Privacidad" },
      { label: "Términos" },
      { label: "Cookies" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { label: "Perfiles", href: "/comunidad" },
      { label: "Soporte", href: "/soporte" },
      { label: "Foros" },
      { label: "Eventos" },
      { label: "Creadores" },
    ],
  },
];
