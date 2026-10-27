import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthLayout, LoginForm } from "@/features/auth";
import { DESTINO_POR_DEFECTO, destinoTrasAcceder, hrefAcceso } from "@/features/auth/lib/destino";
import { obtenerSesion } from "@/features/auth/session";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const destino = destinoTrasAcceder((await searchParams).volver);

  if (await obtenerSesion()) {
    redirect(destino);
  }

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      description={
        destino === DESTINO_POR_DEFECTO
          ? "Ingresá para ver tus reseñas y seguir a tus amigos."
          : "Entrá para seguir donde estabas."
      }
      destino={destino}
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link
            href={hrefAcceso("/register", destino)}
            className="font-semibold text-glow-400 transition-colors hover:text-glow-300"
          >
            Registrate gratis
          </Link>
        </>
      }
    >
      <LoginForm destino={destino} />
    </AuthLayout>
  );
}
