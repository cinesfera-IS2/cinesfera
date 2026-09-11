import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cinesfera — Descubre, puntúa y comparte cine",
  description:
    "La red social de cine y series definitiva. Registrá lo que ves, leé reseñas honestas de la comunidad y descubrí tu próxima película favorita.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-night-950 text-ink-100">
        {children}
      </body>
    </html>
  );
}
