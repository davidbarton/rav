import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtCpm, countryName } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

export function PriceOfAttention() {
  const norwayCpm =
    report.by_currency.find((c) => c.currency === "NOK")?.cpm_usd ?? 3.26;

  const cpmByCountryDeduped = (() => {
    const best = new Map<string, (typeof report.cpm_by_country)[number]>();
    for (const row of report.cpm_by_country) {
      const existing = best.get(row.country);
      if (!existing || row.ads > existing.ads) {
        best.set(row.country, row);
      }
    }
    return [...best.values()];
  })();

  const cpmData = cpmByCountryDeduped
    .filter((c) => c.cpm_usd > 0.5)
    .sort((a, b) => b.cpm_usd - a.cpm_usd)
    .slice(0, 12)
    .map((c) => ({
      country: countryName(c.country),
      cpm: c.cpm_usd,
      currency: c.currency,
      isNorway: c.country === "norway",
      isUS: c.country === "united states",
    }));

  return (
    <Section id="cpm" title="The Price of Attention" subtitle="Cost Per Impression">
      <p className="mb-6 max-w-2xl text-gray-600">
        Here's the counterintuitive finding: Norwegian political impressions are
        actually <strong>cheaper</strong> than American ones. At{" "}
        {fmtCpm(norwayCpm)} CPM, Norway pays less per thousand impressions than
        the US ($5.72). Norway's per-capita leadership comes from
        <em> volume</em>, not premium pricing.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Norway CPM (NOK ads, USD)</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">
            {fmtCpm(norwayCpm)}
          </p>
          <p className="mt-1 text-xs text-gray-600">NOK 34.93 → USD</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">US CPM (USD)</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">$5.72</p>
          <p className="mt-1 text-xs text-gray-600">1.7× more expensive</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Impressions per citizen</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">162 vs 40</p>
          <p className="mt-1 text-xs text-gray-600">Norway vs US (4× higher)</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          CPM by country (USD-normalized, dominant currency)
        </h3>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cpmData}
              margin={{ top: 0, right: 16, bottom: 0, left: 4 }}
            >
              <XAxis
                dataKey="country"
                tick={{ fontSize: 11, fill: "#7a7a7a" }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(v: number) => `$${v}`}
                tick={{ fontSize: 11, fill: "#7a7a7a" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [fmtCpm(value), "CPM (USD)"]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e8e8e6",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine y={5.72} stroke="#cd483f" strokeDasharray="4 4" label={{ value: "US $5.72", position: "right", fontSize: 10, fill: "#cd483f" }} />
              <Bar dataKey="cpm" radius={[4, 4, 0, 0]}>
                {cpmData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.isNorway
                        ? "#217866"
                        : entry.isUS
                          ? "#cd483f"
                          : "#d8d8d4"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <InsightCallout>
        <strong>The volume hypothesis:</strong> Norwegian parties can afford to
        saturate Snapchat because each impression is cheap. At a blended CPM
        of ~$3.06, reaching every citizen ~162 times costs about $2.67M — a
        fraction of what traditional TV campaigns cost. Snapchat becomes the
        rational channel for reaching Norway's young electorate.
      </InsightCallout>
    </Section>
  );
}
