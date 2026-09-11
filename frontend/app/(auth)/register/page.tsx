import { AtIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AuthField, AuthLayout } from "@/features/auth";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Creá tu cuenta"
      description="Sumate a la comunidad y empezá a armar tu diario de cine."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-glow-400 transition-colors hover:text-glow-300"
          >
            Iniciá sesión
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="Nombre"
            name="firstName"
            placeholder="Ana"
            autoComplete="given-name"
          />

          <AuthField
            label="Apellido"
            name="lastName"
            placeholder="Torres"
            autoComplete="family-name"
          />
        </div>

        <AuthField
          label="Nombre de usuario"
          name="username"
          placeholder="anatorres"
          autoComplete="username"
          icon={<AtIcon weight="bold" className="size-4" />}
        />

        <AuthField
          label="Correo electrónico"
          name="email"
          type="email"
          placeholder="tú@correo.com"
          autoComplete="email"
        />

        <AuthField
          label="Contraseña"
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          minLength={8}
        />

        <button
          type="submit"
          className="mt-1 rounded-lg bg-brand-500 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
        >
          Crear cuenta
        </button>

        <p className="text-center text-xs text-ink-500 text-pretty">
          Al continuar aceptás los{" "}
          <Link href="#terminos" className="text-glow-400 hover:text-glow-300">
            Términos
          </Link>{" "}
          y la{" "}
          <Link href="#privacidad" className="text-glow-400 hover:text-glow-300">
            Privacidad
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
