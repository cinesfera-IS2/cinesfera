import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AvatarCuenta } from "./avatar-cuenta";

vi.mock("next/image", () => ({
  default: ({ src }: { src: string }) => <span data-testid="foto" data-src={src} />,
}));

const USUARIO = {
  id: "u1",
  nombre: "ana",
  apellido: "torres",
  nombre_usuario: "anatorres",
  email: "ana@example.com",
  foto_url: null,
};

describe("AvatarCuenta", () => {
  afterEach(cleanup);

  it("sin foto muestra las iniciales en mayúsculas", () => {
    render(<AvatarCuenta usuario={USUARIO} />);

    expect(screen.getByText("AT")).toBeTruthy();
  });

  it("con foto la muestra en lugar de las iniciales", () => {
    render(
      <AvatarCuenta usuario={{ ...USUARIO, foto_url: "https://fotos.example/ana.jpg" }} tamano="md" />
    );

    expect(screen.getByTestId("foto").dataset.src).toBe("https://fotos.example/ana.jpg");
    expect(screen.queryByText("AT")).toBeNull();
  });
});
