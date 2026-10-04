export { AuthLayout } from "@/features/auth/components/auth-layout";
export { AuthField } from "@/features/auth/components/auth-field";
export { LoginForm } from "@/features/auth/components/login-form";
export { RegisterForm } from "@/features/auth/components/register-form";
export { LogoutButton } from "@/features/auth/components/logout-button";

// `obtenerSesion` no va en este índice: usa `next/headers`, que solo existe en
// el servidor, y el índice también lo importan componentes de cliente.
// Se importa directo desde "@/features/auth/session".
