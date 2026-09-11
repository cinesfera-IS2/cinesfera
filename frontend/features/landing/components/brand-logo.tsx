import { ApertureIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type BrandLogoProps = {
  /** `sm` se usa en el pie de página, `md` en la cabecera. */
  size?: "sm" | "md";
};

export function BrandLogo({ size = "md" }: BrandLogoProps) {
  const isSmall = size === "sm";

  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30 ${
          isSmall ? "size-7" : "size-9"
        }`}
      >
        <ApertureIcon weight="bold" className={isSmall ? "size-4" : "size-5"} />
      </span>
      <span
        className={`font-display font-extrabold tracking-tight ${
          isSmall ? "text-lg" : "text-2xl"
        }`}
      >
        Cinesfera
      </span>
    </Link>
  );
}
