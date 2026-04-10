import { Section } from "@/components/Section";
import { report } from "@/lib/data";
import { ChevronRight } from "lucide-react";

export function Findings() {
  return (
    <Section id="findings" title="Key Findings" subtitle="Summary">
      <p className="mb-8 max-w-2xl text-gray-600">
        Five insights emerge from Norway's political advertising data on
        Snapchat — a dataset that is fully public, yet has never been analyzed
        at this depth.
      </p>

      <div className="space-y-4">
        {report.findings.map((f, i) => (
          <div
            key={f.id}
            className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {f.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-brand-900 p-8 text-center text-white">
        <p className="mx-auto mb-4 max-w-lg text-lg font-semibold text-brand-100 md:text-xl">
          This is what a working digital democracy looks like.
        </p>
        <h3 className="text-xl font-bold">
          Want to explore this data yourself?
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-300">
          Ravineo provides transparency tools for digital media. This report
          was built entirely from publicly available Snapchat data — no
          proprietary APIs, no estimates, no guesswork.
        </p>
        <a
          href="https://www.snap.com/en-US/political-ads"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          View Snapchat Political Ads Library
          <ChevronRight className="size-4" />
        </a>
      </div>
    </Section>
  );
}
