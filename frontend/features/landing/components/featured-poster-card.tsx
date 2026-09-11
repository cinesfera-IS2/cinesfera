import { StarIcon } from "@phosphor-icons/react/dist/ssr";

import { TitleCardFrame } from "@/features/landing/components/title-card-frame";
import type { FeaturedTitle } from "@/features/landing/types";

type FeaturedPosterCardProps = {
  item: FeaturedTitle;
};

export function FeaturedPosterCard({ item }: FeaturedPosterCardProps) {
  return (
    <TitleCardFrame
      title={item.title}
      poster={item.poster}
      posterGradient={item.posterGradient}
      sizes="(max-width: 640px) 50vw, 240px"
    >
      <p className="flex items-center gap-1.5 text-sm font-bold text-glow-400">
        <StarIcon weight="fill" className="size-4" />
        {item.rating.toFixed(1)}
      </p>
      <span className="rounded-md bg-night-700 px-2.5 py-1 text-xs text-ink-400">
        {item.genre}
      </span>
    </TitleCardFrame>
  );
}
