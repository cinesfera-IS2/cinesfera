import { redirect } from "next/navigation";

import { obtenerSesion } from "@/features/auth/session";
import { LandingFooter, LandingHeader } from "@/features/landing";
import { AccountSettings } from "@/features/profile/components/account-settings";

export default async function ConfiguracionCuentaPage() {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect("/login");
  }

  return (
    <>
      <LandingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-glow-400">
            Solo vos
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink-100">
            Configuración de la cuenta
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">
            Administrá tus datos privados y la seguridad de tu acceso.
          </p>
        </div>
        <AccountSettings usuarioId={sesion.id} email={sesion.email} />
      </main>
      <LandingFooter />
    </>
  );
}
