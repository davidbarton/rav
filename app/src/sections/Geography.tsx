import { useRef, useEffect, useState } from "react";
import { Section } from "../components/Section";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum, fmtPct, countryName } from "../lib/utils";

export function Geography() {
  const { dior, missing_countries, competitors } = report.geography;
  const diorTotal = dior.reduce((s, r) => s + r.impressions, 0);

  const france = dior.find((r) => r.country === "fr");
  const francePct = france
    ? Math.round((france.impressions / diorTotal) * 100)
    : 0;

  const barsRef = useRef<HTMLDivElement>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBarsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Section
      id="geography"
      subtitle="Geographic Reach"
      title="Where are you — and where aren't you?"
    >
      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Dior markets */}
        <div ref={barsRef}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Dior's Markets
          </h3>
          <div className="space-y-2">
            {dior.map((g, i) => {
              const pct = (g.impressions / diorTotal) * 100;
              return (
                <div key={g.country} className="group flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">
                    {countryName(g.country)}
                  </span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{
                        width: barsVisible ? `${Math.max(pct, 0.5)}%` : "0%",
                        transition: `width 800ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 80}ms`,
                      }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-gray-600">
                    {fmtNum(g.impressions)}
                  </span>
                </div>
              );
            })}
          </div>

          {missing_countries.length > 0 && (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-800">
                {missing_countries.length === 1
                  ? "Market with active competitor presence"
                  : `${missing_countries.length} markets with active competitor presence`}
              </p>
              <p className="mt-1 text-sm text-orange-700">
                {missing_countries.map(countryName).join(", ")}
                {" "}— where competitors run deliberate campaigns but Dior is absent.
              </p>
            </div>
          )}
        </div>

        {/* Gap analysis */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Markets Where Competitors Are Active
          </h3>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="w-1/2 pb-2 font-medium">Brand</th>
                  <th className="pb-2 font-medium">Countries</th>
                  <th className="pb-2 font-medium">Top Market</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { brand: "Dior", countries: dior.map((d) => d.country), top_country: dior[0]?.country ?? "" },
                  ...competitors,
                ]
                  .sort((a, b) => b.countries.length - a.countries.length)
                  .map((c) => {
                    const isUs = c.brand === "Dior";
                    return (
                      <tr key={c.brand} className={`border-b border-gray-100 ${isUs ? "bg-brand-50 font-semibold" : ""}`}>
                        <td className="py-1.5">{c.brand}</td>
                        <td className="py-1.5">{c.countries.length}</td>
                        <td className="py-1.5">{c.top_country ? countryName(c.top_country) : "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InsightCallout>
        Dior is a French house, yet only {francePct}% of impressions come
        from France. Belgium ({Math.round((dior[0]?.impressions ?? 0) / diorTotal * 100)}%)
        and Germany lead.
        {missing_countries.length === 1 && (
          <> Notably, competitors are actively targeting{" "}
          <strong>{countryName(missing_countries[0])}</strong> — a market Dior hasn't entered.</>
        )}
        {missing_countries.length > 1 && (
          <> Competitors are deliberately active in{" "}
          <strong>{missing_countries.length} markets</strong> where Dior has no presence:{" "}
          {missing_countries.map(countryName).join(", ")}.</>
        )}
      </InsightCallout>
    </Section>
  );
}
