import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPanel } from "@/features/admin";
import { obtenerSesion } from "@/features/auth/session";
import { LandingHeader } from "@/features/landing";

export const metadata: Metadata = {
  title: "Administración — Cinesfera",
  description: "Panel privado de moderación de Cinesfera.",
};

export default async function AdminPage() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (sesion.rol !== "admin") redirect("/catalogo");

  return (
    <>
      <LandingHeader />
      <main className="min-h-[calc(100vh-var(--alto-cabecera))] flex-1 bg-night-950">
        <AdminPanel sesion={sesion} />
      </main>
    </>
  );
}
