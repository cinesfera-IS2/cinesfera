"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useRef, useState } from "react";

import { FeaturedPosterCard } from "@/features/landing/components/featured-poster-card";
import type { FeaturedTitle } from "@/features/landing/types";

type FeaturedCarouselProps = {
  items: FeaturedTitle[];
};

/**
 * Carrusel con scroll horizontal donde la ficha más cercana al centro se ve
 * grande y nítida, y las de los costados se achican y oscurecen — un efecto
 * puramente 2D (escala + brillo), sin perspectiva ni rotación 3D. No es
 * circular: al llegar a una punta y tocar la flecha, salta directo a la otra.
 */
export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [spacer, setSpacer] = useState(0);
  const [emphasis, setEmphasis] = useState<number[]>(() => items.map(() => 0));
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    const halfWidth = trackRect.width / 2 || 1;

    setEmphasis(
      cardRefs.current.map((card) => {
        if (!card) return 0;
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.min(Math.abs(cardCenter - center) / halfWidth, 1);
        return 1 - distance;
      }),
    );

    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft >= track.scrollWidth - track.clientWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const computeSpacer = () => {
      const firstCard = cardRefs.current[0];
      if (!firstCard) return;
      setSpacer(Math.max((track.clientWidth - firstCard.offsetWidth) / 2, 0));
    };

    computeSpacer();
    updateFromScroll();

    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateFromScroll);
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", computeSpacer);

    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", computeSpacer);
    };
  }, [updateFromScroll]);

  const handleWheel = (event: React.WheelEvent<HTMLUListElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
  };

  const goToStart = () => {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const goToEnd = () => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: "smooth" });
  };

  const scrollByCard = (direction: 1 | -1) => {
    if (direction === 1 && atEnd) {
      goToStart();
      return;
    }
    if (direction === -1 && atStart) {
      goToEnd();
      return;
    }

    const track = trackRef.current;
    const first = cardRefs.current[0];
    const second = cardRefs.current[1];
    if (!track) return;

    const step =
      first && second
        ? second.getBoundingClientRect().left - first.getBoundingClientRect().left
        : track.clientWidth * 0.8;

    track.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ver ficha anterior"
        onClick={() => scrollByCard(-1)}
        className="absolute left-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-night-900/85 text-ink-100 backdrop-blur transition-colors hover:border-white/25 hover:bg-night-900 sm:left-2"
      >
        <CaretLeftIcon weight="bold" className="size-5" />
      </button>

      <ul
        ref={trackRef}
        onWheel={handleWheel}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4"
        style={{ scrollPaddingLeft: spacer, scrollPaddingRight: spacer }}
      >
        <li aria-hidden className="shrink-0" style={{ width: spacer }} />

        {items.map((item, index) => {
          const t = emphasis[index] ?? 0;
          const scale = 0.78 + t * 0.22;
          const brightness = 0.5 + t * 0.5;

          return (
            <li
              key={item.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="w-72 shrink-0 snap-center sm:w-80"
              style={{
                transform: `scale(${scale})`,
                filter: `brightness(${brightness})`,
                opacity: 0.55 + t * 0.45,
              }}
            >
              <FeaturedPosterCard item={item} />
            </li>
          );
        })}

        <li aria-hidden className="shrink-0" style={{ width: spacer }} />
      </ul>

      <button
        type="button"
        aria-label="Ver ficha siguiente"
        onClick={() => scrollByCard(1)}
        className="absolute right-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-night-900/85 text-ink-100 backdrop-blur transition-colors hover:border-white/25 hover:bg-night-900 sm:right-2"
      >
        <CaretRightIcon weight="bold" className="size-5" />
      </button>
    </div>
  );
}
