import type { PerfilPublico, ResenaPerfil } from "@/features/profile/types";

/**
 * Datos de ejemplo para maquetar la pantalla.
 *
 * Para enchufar el backend falta un endpoint que resuelva por nombre de
 * usuario: `GET /usuarios/{id}/perfil` solo acepta el UUID.
 */

const PERFILES: PerfilPublico[] = [
  {
    id: "0f7a1f5e-6f4a-4f3f-9b1c-8a2d5e7c0a11",
    nombreUsuario: "juanmorena",
    nombre: "Juan",
    apellido: "Morena",
    email: "juan.morena@correo.com",
    rol: "usuario",
    fechaRegistro: "2026-02-14",
    bio: "Cazador de thrillers lentos y bandas sonoras que no puedo sacarme de la cabeza. Si la película dura más de tres horas, mejor.",
    ubicacion: "Montevideo, Uruguay",
    generosFavoritos: ["Thriller", "Sci-Fi", "Drama"],
    estadisticas: {
      resenas: 3,
      vistas: 184,
      seguidores: 212,
      siguiendo: 97,
    },
  },
  {
    id: "3c2b9d84-1f77-4a1e-9d0c-5b6e4f2a8c33",
    nombreUsuario: "sofiarey",
    nombre: "Sofía",
    apellido: "Rey",
    email: "sofia.rey@correo.com",
    rol: "admin",
    fechaRegistro: "2025-11-03",
    bio: "Programo un ciclo de cine independiente los jueves. Acá dejo lo que voy viendo entre función y función.",
    ubicacion: "Buenos Aires, Argentina",
    generosFavoritos: ["Documental", "Animación"],
    estadisticas: {
      resenas: 2,
      vistas: 421,
      seguidores: 1340,
      siguiendo: 188,
    },
  },
  {
    id: "7d5e1c02-8b3a-42c6-8f19-0ac7e9d14b55",
    nombreUsuario: "lucasbergara",
    nombre: "Lucas",
    apellido: "Bergara",
    email: "lucas.bergara@correo.com",
    rol: "usuario",
    fechaRegistro: "2026-09-02",
    ubicacion: "Salto, Uruguay",
    generosFavoritos: ["Acción"],
    estadisticas: {
      resenas: 0,
      vistas: 6,
      seguidores: 4,
      siguiendo: 31,
    },
  },
];

const RESENAS: Record<string, ResenaPerfil[]> = {
  juanmorena: [
    {
      id: "r-ecos-del-silencio",
      titulo: "Ecos del Silencio",
      anio: 2025,
      puntaje: 4.5,
      fecha: "2026-09-04",
      comentario:
        "Se toma su tiempo para llegar a donde quiere, y cuando llega te das cuenta de que el silencio venía avisando desde la primera escena. El trabajo de sonido es la verdadera protagonista.",
      posterGradient: "from-sky-500/30 via-night-850 to-night-950",
      meGusta: 38,
    },
    {
      id: "r-odisea-estelar",
      titulo: "Odisea Estelar",
      anio: 2024,
      puntaje: 5,
      fecha: "2026-08-21",
      comentario:
        "La vi tres veces y todavía encuentro detalles nuevos en el tercer acto. Ciencia ficción de la que se preocupa por las personas antes que por las naves.",
      posterGradient: "from-violet-600/35 via-night-850 to-night-950",
      meGusta: 126,
    },
    {
      id: "r-codigo-nocturno",
      titulo: "Código Nocturno",
      anio: 2023,
      puntaje: 3,
      fecha: "2026-07-30",
      comentario:
        "Arranca impecable y se desinfla en el último tramo. Igual, la fotografía de las escenas en la ciudad vacía justifica la entrada.",
      posterGradient: "from-cyan-500/25 via-night-850 to-night-950",
      meGusta: 12,
    },
  ],
  sofiarey: [
    {
      id: "r-el-reino-de-los-susurros",
      titulo: "El Reino de los Susurros",
      anio: 2026,
      puntaje: 4,
      fecha: "2026-09-11",
      comentario:
        "Fantasía hecha a mano, con maquetas y muñecos que se notan y eso la hace mejor. La proyectamos en el ciclo y la sala aplaudió.",
      posterGradient: "from-teal-500/30 via-night-850 to-night-950",
      meGusta: 204,
    },
    {
      id: "r-ultimo-vagon",
      titulo: "Último Vagón",
      anio: 2025,
      puntaje: 4.5,
      fecha: "2026-08-02",
      comentario:
        "Un drama de cámara dentro de un tren que nunca se siente encerrado. El guion confía en el espectador y se agradece.",
      posterGradient: "from-rose-500/30 via-night-850 to-night-950",
      meGusta: 91,
    },
  ],
};

export async function obtenerPerfil(
  nombreUsuario: string
): Promise<PerfilPublico | null> {
  return PERFILES.find((perfil) => perfil.nombreUsuario === nombreUsuario) ?? null;
}

export async function obtenerResenas(
  nombreUsuario: string
): Promise<ResenaPerfil[]> {
  return RESENAS[nombreUsuario] ?? [];
}
