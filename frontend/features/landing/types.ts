/** Beneficio corto que se muestra bajo el hero. */
export type ValueProp = {
  id: string;
  title: string;
  description: string;
};

export type NavLink = {
  label: string;
  /** Sin `href` el destino todavía no existe: se muestra como "próximamente", no como enlace. */
  href?: string;
};
