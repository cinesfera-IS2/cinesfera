const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Las fechas se arman con esta tabla y no con `Intl` porque `Intl` puede dar
 * resultados distintos en el servidor y en el navegador según los datos de
 * locale disponibles, y esa diferencia rompe la hidratación.
 */
function partes(fechaIso: string): [number, number, number] {
  const [anio, mes, dia] = fechaIso.slice(0, 10).split("-").map(Number);

  return [anio, mes, dia];
}

/** "marzo de 2026" */
export function mesYAnio(fechaIso: string): string {
  const [anio, mes] = partes(fechaIso);

  return `${MESES[mes - 1]} de ${anio}`;
}

/** "4 de septiembre de 2026" */
export function fechaLarga(fechaIso: string): string {
  const [anio, mes, dia] = partes(fechaIso);

  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** Miles con punto: 1340 -> "1.340". */
export function numeroCorto(valor: number): string {
  return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
