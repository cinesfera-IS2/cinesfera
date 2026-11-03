"use client";

import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import type { TipoContenido } from "@/features/content/types";
import { ApiError, apiFetch } from "@/lib/api";

type DeleteContentReviewProps = {
  tipo: TipoContenido;
  tmdbId: number;
  resenaId: string;
  onEliminada: () => void;
};

export function DeleteContentReview({
  tipo,
  tmdbId,
  resenaId,
  onEliminada,
}: Readonly<DeleteContentReviewProps>) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    if (!window.confirm("¿Querés eliminar esta reseña? Esta acción no se puede deshacer.")) {
      return;
    }

    setEliminando(true);
    setError(null);

    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>("/auth/csrf", {
        cache: "no-store",
      });
      await apiFetch(`/contenidos/${tipo}/${tmdbId}/resenas/${resenaId}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrf_token },
      });
      onEliminada();
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos eliminar la reseña. Probá nuevamente."
      );
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={eliminar}
        disabled={eliminando}
        className="-mx-2.5 -my-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold text-rose-300 transition-[color,background-color,transform] duration-150 ease-out hover:bg-rose-400/10 hover:text-rose-200 active:scale-[0.97] disabled:opacity-50"
      >
        <TrashIcon className="size-4" />
        {eliminando ? "Eliminando..." : "Eliminar reseña"}
      </button>
      {error && (
        <span role="alert" className="inline-flex items-center gap-1 text-xs text-rose-300">
          <WarningCircleIcon className="size-4" />
          {error}
        </span>
      )}
    </div>
  );
}
