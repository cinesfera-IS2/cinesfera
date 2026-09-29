import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { esMiPerfil } from "@/features/auth";
import { LandingFooter, LandingHeader } from "@/features/landing";
import {
  ProfileDetails,
  ProfileHero,
  ProfileSections,
  obtenerPerfilPublico,
} from "@/features/profile";

export async function generateMetadata({
  params,
}: PageProps<"/profile/[username]">): Promise<Metadata> {
  const { username } = await params;
  const datos = await obtenerPerfilPublico(username);

  if (!datos) {
    return { title: "Perfil no encontrado — Cinesfera" };
  }

  const { perfil } = datos;
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;

  return {
    title: `${nombreCompleto} (@${perfil.nombreUsuario}) — Cinesfera`,
    description:
      perfil.bio ?? `Mirá las reseñas de ${nombreCompleto} en Cinesfera.`,
  };
}

export default async function ProfilePage({
  params,
}: PageProps<"/profile/[username]">) {
  const { username } = await params;
  const datos = await obtenerPerfilPublico(username);

  if (!datos) {
    notFound();
  }

  const { perfil, resenas } = datos;
  const esPropio = await esMiPerfil(perfil.nombreUsuario);

  return (
    <>
      <LandingHeader />

      <main className="flex-1">
        <ProfileHero perfil={perfil} esPropio={esPropio} />

        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[19rem_1fr] lg:items-start">
          <ProfileDetails perfil={perfil} esPropio={esPropio} />
          <ProfileSections
            resenas={resenas}
            nombre={perfil.nombre}
            esPropio={esPropio}
          />
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
