import { ArrowRight, Target, MapPin, Gauge, Sparkles } from "lucide-react";
import { Section } from "../components/Section";
import { report } from "../lib/data";

const ICONS: Record<string, typeof Target> = {
  "ar-gap": Target,
  "france-paradox": MapPin,
  efficiency: Gauge,
  "content-opportunity": Sparkles,
};

export function Takeaways() {
  return (
    <Section id="takeaways" subtitle="Action Items" title="What should you do next?">
      <div className="grid gap-4 md:grid-cols-2">
        {report.takeaways.map((t) => {
          const Icon = ICONS[t.id] ?? Target;
          return (
            <div
              key={t.id}
              className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-md"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="size-5 text-brand-700" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {t.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {t.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-brand-900 px-8 py-10 text-center text-white">
        <h3 className="text-2xl font-bold">
          This is what Ravineo sees.
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-brand-100">
          Competitive intelligence, creative benchmarking, and market gaps —
          automatically, across every brand, every country, every day.
        </p>
        <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-gray-50">
          Want this for your brand?
          <ArrowRight className="size-4" />
        </button>
      </div>
    </Section>
  );
}
