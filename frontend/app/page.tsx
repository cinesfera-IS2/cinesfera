import {
  FeaturedSection,
  HeroSection,
  LandingFooter,
  LandingHeader,
  TrendingSection,
  ValuePropsSection,
} from "@/features/landing";

export default function Home() {
  return (
    <>
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <ValuePropsSection />
        <FeaturedSection />
        <TrendingSection />
      </main>
      <LandingFooter />
    </>
  );
}
