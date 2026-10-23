import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthLayout, RegisterForm } from "@/features/auth";
import { DESTINO_POR_DEFECTO, destinoTrasAcceder, hrefAcceso } from "@/features/auth/lib/destino";
import { obtenerSesion } from "@/features/auth/session";

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const destino = destinoTrasAcceder((await searchParams).volver);

  if (await obtenerSesion()) {
    redirect(destino);
  }

  return (
    <AuthLayout
      title="Creá tu cuenta"
      description={
        destino === DESTINO_POR_DEFECTO
          ? "Sumate a la comunidad y empezá a armar tu diario de cine."
          : "Sumate a la comunidad y seguí donde estabas."
      }
      destino={destino}
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link
            href={hrefAcceso("/login", destino)}
            className="font-semibold text-glow-400 transition-colors hover:text-glow-300"
          >
            Iniciá sesión
          </Link>
        </>
      }
    >
      <RegisterForm destino={destino} />
    </AuthLayout>
  );
}
