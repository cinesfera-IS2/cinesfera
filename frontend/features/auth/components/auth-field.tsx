import type { InputHTMLAttributes, ReactNode } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  /** Enlace o texto corto al lado de la etiqueta, p. ej. "¿Olvidaste tu contraseña?". */
  action?: ReactNode;
  /** Ícono fijo dentro del input, p. ej. el "@" de nombre de usuario. */
  icon?: ReactNode;
  /** Control dentro del input, pegado a la derecha, p. ej. el ojo de la contraseña. */
  trailing?: ReactNode;
};

export function AuthField({
  label,
  action,
  icon,
  trailing,
  name,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={name}
          className="text-xs font-semibold uppercase tracking-wider text-ink-400"
        >
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-500">
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          required
          className={`w-full rounded-lg border border-night-600 bg-night-900 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-brand-400 ${
            icon ? "pl-9" : "pl-3.5"
          } ${trailing ? "pr-11" : "pr-3.5"}`}
          {...inputProps}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </span>
        )}
      </div>
    </div>
  );
}
