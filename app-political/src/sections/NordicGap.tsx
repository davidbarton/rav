import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtUsd, fmtNum, countryName } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const NORDIC_COLORS: Record<string, string> = {
  Norway: "#217866",
  Sweden: "#365791",
  Denmark: "#cd483f",
};

export function NordicGap() {
  const nordicData = report.nordic_comparison.map((c) => ({
    country: countryName(c.country),
    spend_usd: c.spend_usd,
    per_capita: c.per_capita_usd,
    ads: c.ads,
    impressions_per_citizen: c.impressions_per_citizen,
    advertisers: c.unique_advertisers ?? 0,
  }));

  return (
    <Section id="nordic" title="The Nordic Gap" subtitle="Regional Comparison">
      <p className="mb-6 max-w-2xl text-gray-600">
        Same region. Same demographics. Same platform availability. Yet Norway's
        political ad ecosystem on Snapchat dwarfs its Nordic neighbors by an
        order of magnitude. This isn't a market effect — it's a strategic
        choice.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {nordicData.map((c) => (
          <div
            key={c.country}
            className="rounded-xl border border-gray-200 bg-white p-5"
            style={{ borderLeftColor: NORDIC_COLORS[c.country], borderLeftWidth: "4px" }}
          >
            <p className="mb-1 text-lg font-bold">{c.country}</p>
            <p className="text-2xl font-bold tabular-nums">{fmtUsd(c.spend_usd)}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              <span>Per capita</span>
              <span className="text-right font-medium text-gray-900">${c.per_capita.toFixed(2)}</span>
              <span>Total ads</span>
              <span className="text-right font-medium text-gray-900">{c.ads.toLocaleString()}</span>
              <span>Impr/citizen</span>
              <span className="text-right font-medium text-gray-900">{c.impressions_per_citizen}</span>
              <span>Advertisers</span>
              <span className="text-right font-medium text-gray-900">{c.advertisers}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Total spend (USD)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nordicData}>
                <XAxis
                  dataKey="country"
                  tick={{ fontSize: 12, fill: "#171c1b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => fmtUsd(v)}
                  tick={{ fontSize: 11, fill: "#7a7a7a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [fmtUsd(v), "USD Spend"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #e8e8e6",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="spend_usd" radius={[4, 4, 0, 0]}>
                  {nordicData.map((c, i) => (
                    <Cell key={i} fill={NORDIC_COLORS[c.country] ?? "#d8d8d4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Per-capita spend (USD)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nordicData}>
                <XAxis
                  dataKey="country"
                  tick={{ fontSize: 12, fill: "#171c1b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${v}`}
                  tick={{ fontSize: 11, fill: "#7a7a7a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Per capita"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #e8e8e6",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="per_capita" radius={[4, 4, 0, 0]}>
                  {nordicData.map((c, i) => (
                    <Cell key={i} fill={NORDIC_COLORS[c.country] ?? "#d8d8d4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <InsightCallout>
        <strong>The gap in context:</strong> Norway has 5.4M people. Sweden has
        10.5M. Yet Norway runs 6× more political ads and spends over 15× more
        per citizen. Swedish and Danish parties have barely adopted Snapchat for
        political advertising — making Norway's engagement a true outlier, not
        a regional norm.
      </InsightCallout>
    </Section>
  );
}
