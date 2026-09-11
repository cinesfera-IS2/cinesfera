import Link from "next/link";

import { AuthField, AuthLayout } from "@/features/auth";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      description="Ingresá para ver tus reseñas y seguir a tus amigos."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-glow-400 transition-colors hover:text-glow-300"
          >
            Registrate gratis
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4">
        <AuthField
          label="Correo electrónico"
          name="email"
          type="email"
          placeholder="tú@correo.com"
          autoComplete="email"
        />

        <AuthField
          label="Contraseña"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          action={
            <Link
              href="#recuperar-contrasena"
              className="text-xs font-semibold text-glow-400 transition-colors hover:text-glow-300"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />

        <button
          type="submit"
          className="mt-1 rounded-lg bg-brand-500 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
        >
          Iniciar sesión
        </button>
      </form>
    </AuthLayout>
  );
}
