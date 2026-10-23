import type { InputHTMLAttributes, ReactNode } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  /** Ícono fijo dentro del input, p. ej. el "@" de nombre de usuario. */
  icon?: ReactNode;
  /** Control dentro del input, pegado a la derecha, p. ej. el ojo de la contraseña. */
  trailing?: ReactNode;
  /** Ayuda permanente debajo del campo; el error la reemplaza mientras exista. */
  hint?: string;
  error?: string;
};

export function AuthField({
  label,
  icon,
  trailing,
  hint,
  error,
  name,
  ...inputProps
}: AuthFieldProps) {
  const idDescripcion = `${name}-descripcion`;
  const descripcion = error || hint;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-ink-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-500">
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcion ? idDescripcion : undefined}
          className={`h-12 w-full rounded-lg border bg-night-900 text-[0.9375rem] text-ink-100 transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-ink-500 focus:ring-4 disabled:opacity-60 ${
            error
              ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/15"
              : "border-night-600 hover:border-ink-500/60 focus:border-glow-400 focus:ring-glow-400/15"
          } ${icon ? "pl-10" : "pl-4"} ${trailing ? "pr-12" : "pr-4"}`}
          {...inputProps}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </span>
        )}
      </div>
      {descripcion && (
        <p
          id={idDescripcion}
          className={`text-xs text-pretty ${error ? "text-rose-300" : "text-ink-400"}`}
        >
          {descripcion}
        </p>
      )}
    </div>
  );
}
