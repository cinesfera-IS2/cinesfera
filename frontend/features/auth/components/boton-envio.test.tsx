import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BotonEnvio } from "./boton-envio";

const TEXTOS = { texto: "Iniciar sesión", textoEnviando: "Ingresando...", textoListo: "Listo, entrando..." };
const AVISO = /está tardando más de lo normal/i;

describe("BotonEnvio", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("mientras envía queda ocupado y deshabilitado", () => {
    render(<BotonEnvio estado="enviando" {...TEXTOS} />);

    const boton = screen.getByRole<HTMLButtonElement>("button", { name: "Ingresando..." });
    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute("aria-busy")).toBe("true");
  });

  it("si la espera se alarga avisa que sigue en curso", () => {
    render(<BotonEnvio estado="enviando" {...TEXTOS} />);
    expect(screen.queryByText(AVISO)).toBeNull();

    act(() => vi.advanceTimersByTime(4000));

    expect(screen.getByText(AVISO)).toBeTruthy();
  });

  it("al terminar el envío se va el aviso", () => {
    const { rerender } = render(<BotonEnvio estado="enviando" {...TEXTOS} />);
    act(() => vi.advanceTimersByTime(4000));

    rerender(<BotonEnvio estado="inactivo" {...TEXTOS} />);

    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Iniciar sesión" }).disabled).toBe(false);
  });
});
