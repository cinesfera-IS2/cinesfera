import { FeaturedPosterCard } from "@/features/landing/components/featured-poster-card";
import { SectionEyebrow } from "@/features/landing/components/section-eyebrow";
import { FEATURED_TITLES } from "@/features/landing/data/landing-content";

export function FeaturedSection() {
  return (
    <section id="explorar" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionEyebrow>Joyas de la cartelera</SectionEyebrow>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_TITLES.map((item) => (
            <li key={item.id}>
              <FeaturedPosterCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
