import type {
  FeaturedTitle,
  NavLink,
  TrendingTitle,
  ValueProp,
} from "@/features/landing/types";

export const NAV_LINKS: NavLink[] = [
  { label: "Explorar", href: "#explorar" },
  { label: "Tendencias", href: "#tendencias" },
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

export const FEATURED_TITLES: FeaturedTitle[] = [
  {
    id: "odisea-estelar",
    title: "Odisea Estelar",
    rating: 4.7,
    genre: "Sci-Fi",
    posterGradient: "from-violet-600/35 via-night-850 to-night-950",
  },
  {
    id: "sombras-de-la-ciudad",
    title: "Sombras de la Ciudad",
    rating: 4.2,
    genre: "Suspense",
    posterGradient: "from-slate-400/25 via-night-850 to-night-950",
  },
  {
    id: "el-reino-de-los-susurros",
    title: "El Reino de los Susurros",
    rating: 4.9,
    genre: "Fantasía",
    posterGradient: "from-teal-500/30 via-night-850 to-night-950",
  },
  {
    id: "red-de-venganza",
    title: "Red de Venganza",
    rating: 4.5,
    genre: "Acción",
    posterGradient: "from-fuchsia-600/35 via-night-850 to-night-950",
  },
];

export const TRENDING_TITLES: TrendingTitle[] = [
  {
    id: "cumbre-silenciosa",
    title: "Cumbre Silenciosa",
    rating: 4.6,
    year: 2026,
    kind: "Película",
    posterGradient: "from-sky-500/30 via-night-850 to-night-950",
  },
  {
    id: "anomalia",
    title: "Anomalía",
    rating: 4.4,
    year: 2025,
    kind: "Serie",
    posterGradient: "from-emerald-500/30 via-night-850 to-night-950",
  },
  {
    id: "ruta-de-arena",
    title: "Ruta de Arena",
    rating: 4.8,
    year: 2026,
    kind: "Película",
    posterGradient: "from-orange-500/30 via-night-850 to-night-950",
  },
  {
    id: "midnight-notes",
    title: "Midnight Notes",
    rating: 4.7,
    year: 2026,
    kind: "Serie",
    posterGradient: "from-indigo-500/35 via-night-850 to-night-950",
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
