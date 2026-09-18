import Image from "next/image";

type ProfileAvatarProps = {
  nombre: string;
  apellido: string;
  fotoUrl?: string;
};

/**
 * Foto de perfil con las iniciales de respaldo. Cuando se habilite subir
 * fotos hay que declarar el host de `foto_url` en `images.remotePatterns`
 * (next.config.ts) o `next/image` las va a rechazar.
 */
export function ProfileAvatar({
  nombre,
  apellido,
  fotoUrl,
}: ProfileAvatarProps) {
  const iniciales = `${nombre.at(0) ?? ""}${apellido.at(0) ?? ""}`.toUpperCase();

  return (
    <span className="relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-night-950 bg-linear-to-br from-brand-500 to-glow-400 font-display text-3xl font-extrabold text-white shadow-xl shadow-black/40 sm:size-32 sm:text-4xl">
      {fotoUrl ? (
        <Image
          src={fotoUrl}
          alt={`Foto de ${nombre} ${apellido}`}
          fill
          sizes="128px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden>{iniciales}</span>
      )}
    </span>
  );
}
