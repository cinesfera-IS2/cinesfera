import { StarIcon } from "@phosphor-icons/react/dist/ssr";

import { TitleCardFrame } from "@/features/landing/components/title-card-frame";
import type { TrendingTitle } from "@/features/landing/types";

type TrendingCardProps = {
  item: TrendingTitle;
};

export function TrendingCard({ item }: TrendingCardProps) {
  return (
    <TitleCardFrame
      title={item.title}
      poster={item.poster}
      posterGradient={item.posterGradient}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    >
      <p className="flex items-center gap-1.5 text-sm text-ink-400">
        <StarIcon weight="fill" className="size-4 text-glow-400" />
        <span className="font-bold text-glow-400">{item.rating.toFixed(1)}</span>
        <span aria-hidden>·</span>
        {item.year}
      </p>
      <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-500">
        {item.kind}
      </span>
    </TitleCardFrame>
  );
}
