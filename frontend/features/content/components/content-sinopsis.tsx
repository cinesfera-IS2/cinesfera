type ContentSinopsisProps = {
  sinopsis: string;
};

export function ContentSinopsis({ sinopsis }: ContentSinopsisProps) {
  return (
    <section aria-labelledby="titulo-sinopsis">
      <h2 id="titulo-sinopsis" className="font-display text-xl font-bold">
        Sinopsis
      </h2>
      <p className="mt-3 max-w-[65ch] text-lg leading-relaxed text-pretty text-ink-300">
        {sinopsis || "La sinopsis todavía no está disponible."}
      </p>
    </section>
  );
}
