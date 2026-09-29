/**
 * Reglas de la contraseña, en un solo lugar para que el formulario y el medidor
 * de seguridad no puedan contradecirse.
 *
 * Solo el largo mínimo es una restricción de verdad: es lo único que valida
 * `UsuarioRegistro` en el backend. Los demás criterios son recomendaciones que
 * mueven la barra pero no impiden registrarse, así que el formulario nunca
 * rechaza una contraseña que la API sí aceptaría.
 */

export const LARGO_MINIMO = 8;
export const LARGO_MAXIMO = 128;

export type CriterioPassword = {
  etiqueta: string;
  /** Los obligatorios son los que exige el backend. */
  obligatorio: boolean;
  cumple: boolean;
};

export type EvaluacionPassword = {
  criterios: CriterioPassword[];
  /** Cuántos criterios se cumplen, de 0 a 4. */
  nivel: number;
  /** "Débil", "Fuerte"... Vacío si no hay nada escrito. */
  etiqueta: string;
  /** Se cumplen todos los criterios obligatorios. */
  valida: boolean;
};

const ETIQUETAS = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];

export function evaluarPassword(password: string): EvaluacionPassword {
  const criterios: CriterioPassword[] = [
    {
      etiqueta: `Al menos ${LARGO_MINIMO} caracteres`,
      obligatorio: true,
      cumple: password.length >= LARGO_MINIMO,
    },
    {
      etiqueta: "Mayúsculas y minúsculas",
      obligatorio: false,
      cumple: /[a-záéíóúüñ]/.test(password) && /[A-ZÁÉÍÓÚÜÑ]/.test(password),
    },
    {
      etiqueta: "Al menos un número",
      obligatorio: false,
      cumple: /\d/.test(password),
    },
    {
      etiqueta: "Al menos un símbolo",
      obligatorio: false,
      cumple: /[^\p{L}\p{N}]/u.test(password),
    },
  ];

  const nivel = criterios.filter((criterio) => criterio.cumple).length;

  return {
    criterios,
    nivel,
    etiqueta: password.length === 0 ? "" : ETIQUETAS[nivel],
    valida: criterios.every(
      (criterio) => !criterio.obligatorio || criterio.cumple
    ),
  };
}
