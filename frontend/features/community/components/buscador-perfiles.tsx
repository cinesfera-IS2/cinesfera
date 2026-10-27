"use client";

import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

import { useNavegacionCatalogo } from "@/features/catalog/components/navegacion-catalogo";
import { hrefComunidad, normalizarConsulta } from "@/features/community/lib/consulta";

export function BuscadorPerfiles() {
  const consulta = normalizarConsulta(useSearchParams().get("q") ?? undefined);
  const navegacion = useNavegacionCatalogo();

  function buscar(evento: React.FormEvent<HTMLFormElement>) {
    if (!navegacion) return;
    evento.preventDefault();
    const q = new FormData(evento.currentTarget).get("q");
    navegacion.navegar(hrefComunidad(typeof q === "string" ? q : ""), false);
  }

  return (
    // La key remonta el campo al volver atrás, para que no quede escrita una búsqueda vieja.
    <Form
      key={consulta}
      action="/comunidad"
      scroll={false}
      onSubmit={buscar}
      role="search"
      autoComplete="off"
    >
      <label className="relative block">
        <span className="sr-only">Buscar perfiles</span>
        <MagnifyingGlassIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-400"
        />
        <input
          type="search"
          name="q"
          defaultValue={consulta}
          // Un formulario de un solo campo que menciona "usuario" Chrome lo toma por
          // un login y ofrece los correos guardados aunque diga autoComplete="off".
          // Por eso el campo no nombra al usuario y se marca para los gestores de contraseñas.
          placeholder="Buscá un perfil, p. ej. @anatorres"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          autoCapitalize="none"
          spellCheck={false}
          className="h-11 w-full rounded-lg border border-night-600 bg-night-900 pr-12 pl-11 text-sm text-ink-100 transition-colors placeholder:text-ink-400 hover:border-ink-500 focus:border-brand-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-brand-500 text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-400 active:scale-[0.94]"
        >
          <ArrowRightIcon weight="bold" className="size-4" />
        </button>
      </label>
    </Form>
  );
}
