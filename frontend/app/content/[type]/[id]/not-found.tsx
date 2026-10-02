import Link from "next/link";


export default function ContentNotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-glow-300 uppercase">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Contenido no encontrado
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          La película o serie que buscás no existe en el catálogo.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-bold hover:bg-white/5"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
