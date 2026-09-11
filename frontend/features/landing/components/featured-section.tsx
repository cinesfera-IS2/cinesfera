import { FeaturedCarousel } from "@/features/landing/components/featured-carousel";
import { SectionEyebrow } from "@/features/landing/components/section-eyebrow";
import { FEATURED_TITLES } from "@/features/landing/data/landing-content";

export function FeaturedSection() {
  return (
    <section id="explorar" className="px-6 pb-20 pt-6 lg:pt-0">
      <div className="mx-auto max-w-7xl">
        <SectionEyebrow>Joyas de la cartelera</SectionEyebrow>

        <div className="mt-12">
          <FeaturedCarousel items={FEATURED_TITLES} />
        </div>
      </div>
    </section>
  );
}
