type SectionEyebrowProps = {
  children: React.ReactNode;
};

/** Título pequeño en cian flanqueado por dos filetes, como en los mockups. */
export function SectionEyebrow({ children }: SectionEyebrowProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-px w-8 bg-glow-400 sm:w-12" />
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-glow-400">
        {children}
      </h2>
      <span className="h-px w-8 bg-glow-400 sm:w-12" />
    </div>
  );
}
