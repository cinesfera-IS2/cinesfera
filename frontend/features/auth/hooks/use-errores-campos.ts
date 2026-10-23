"use client";

import { useState, type FocusEvent, type FormEvent } from "react";

/** Traduce la validación nativa del input a un mensaje que diga cómo arreglarlo. */
export function mensajeDeError(input: HTMLInputElement): string | undefined {
  const { validity } = input;

  if (validity.valid) return undefined;
  if (validity.valueMissing) return "Completá este campo.";
  if (validity.typeMismatch && input.type === "email") {
    return "Revisá el correo: tiene que ser algo como nombre@dominio.com.";
  }
  if (validity.tooShort) return `Tiene que tener al menos ${input.minLength} caracteres.`;
  if (validity.tooLong) return `Puede tener hasta ${input.maxLength} caracteres.`;
  if (validity.patternMismatch && input.title) return input.title;
  return input.validationMessage;
}

/**
 * Errores por campo con la validación del navegador pero sin sus globos: se
 * muestran al salir del campo, se van apenas se corrigen y, al enviar, el foco
 * salta al primero que falle.
 */
export function useErroresCampos() {
  const [errores, setErrores] = useState<Record<string, string | undefined>>({});

  function validar(input: HTMLInputElement) {
    setErrores((anteriores) => ({ ...anteriores, [input.name]: mensajeDeError(input) }));
  }

  /** Devuelve si el formulario está listo para enviarse. */
  function validarFormulario(formulario: HTMLFormElement): boolean {
    const nuevos: Record<string, string | undefined> = {};
    let primero: HTMLInputElement | undefined;

    for (const elemento of Array.from(formulario.elements)) {
      if (!(elemento instanceof HTMLInputElement) || !elemento.name) continue;
      const mensaje = mensajeDeError(elemento);
      nuevos[elemento.name] = mensaje;
      if (mensaje) primero ??= elemento;
    }

    setErrores(nuevos);
    primero?.focus();
    return !primero;
  }

  function propsCampo(name: string) {
    return {
      error: errores[name],
      onBlur: (evento: FocusEvent<HTMLInputElement>) => validar(evento.currentTarget),
      // Mientras haya un error a la vista se revisa con cada tecla, para que
      // desaparezca en cuanto queda bien; antes no se molesta a nadie.
      onInput: (evento: FormEvent<HTMLInputElement>) => {
        if (errores[name]) validar(evento.currentTarget);
      },
    };
  }

  return { propsCampo, validarFormulario };
}
