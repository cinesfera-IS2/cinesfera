import { VALUE_PROPS } from "@/features/landing/data/landing-content";

export function ValuePropsSection() {
  return (
    <section className="px-6 pb-20">
      <ul className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_PROPS.map((prop) => (
          <li
            key={prop.id}
            className="rounded-2xl border border-night-600 bg-night-850/60 px-6 py-5"
          >
            <h3 className="font-display text-base font-bold text-ink-100">
              {prop.title}
            </h3>
            <p className="mt-1.5 text-sm text-ink-400">{prop.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
