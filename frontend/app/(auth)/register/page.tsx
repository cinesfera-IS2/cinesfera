import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthLayout, RegisterForm } from "@/features/auth";
import { obtenerSesion } from "@/features/auth/session";

export default async function RegisterPage() {
  if (await obtenerSesion()) {
    redirect("/catalogo");
  }

  return (
    <AuthLayout
      title="Creá tu cuenta"
      description="Sumate a la comunidad y empezá a armar tu diario de cine."
      ancho="lg"
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-glow-400 transition-colors hover:text-glow-300"
          >
            Iniciá sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
