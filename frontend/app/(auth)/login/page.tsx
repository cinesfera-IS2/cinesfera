import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthLayout, LoginForm } from "@/features/auth";
import { obtenerSesion } from "@/features/auth/session";

export default async function LoginPage() {
  if (await obtenerSesion()) {
    redirect("/catalogo");
  }

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
      <LoginForm />
    </AuthLayout>
  );
}
