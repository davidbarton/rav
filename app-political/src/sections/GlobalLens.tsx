import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtUsd, countryName } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function GlobalLens() {
  const data = report.global_comparison
    .slice(0, 10)
    .map((c) => ({
      country: countryName(c.country),
      per_capita: c.per_capita_usd,
      spend_usd: c.spend_usd,
      isNorway: c.country === "norway",
    }))
    .sort((a, b) => b.per_capita - a.per_capita);

  return (
    <Section
      id="global"
      title="The Global Lens"
      subtitle="World Comparison"
    >
      <p className="mb-6 max-w-2xl text-gray-600">
        When you normalize political ad spend by population, Norway stands alone.
        The United States dominates in absolute dollars ($76.6M), but per citizen,
        Norway invests more than twice as much.
      </p>

      <div className="mt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Political ad spend per citizen (USD)
        </h3>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 4 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                tick={{ fontSize: 11, fill: "#7a7a7a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="country"
                width={120}
                tick={{ fontSize: 12, fill: "#171c1b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Per citizen"]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e8e8e6",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="per_capita" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isNorway ? "#217866" : "#d8d8d4"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-600">
              <th className="px-4 py-2.5">Country</th>
              <th className="px-4 py-2.5 text-right">Spend (USD)</th>
              <th className="px-4 py-2.5 text-right">Per capita</th>
              <th className="px-4 py-2.5 text-right">Impr/citizen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((c) => (
              <tr
                key={c.country}
                className={c.isNorway ? "bg-brand-50" : "hover:bg-gray-25"}
              >
                <td className={`px-4 py-2.5 ${c.isNorway ? "font-semibold text-brand-700" : ""}`}>
                  {c.country}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {fmtUsd(c.spend_usd)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  ${c.per_capita.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {report.global_comparison.find(
                    (g) => countryName(g.country) === c.country,
                  )?.impressions_per_citizen ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InsightCallout>
        <strong>The Snapchat factor:</strong> This isn't about total political
        advertising — it's specifically about Snapchat. Norwegian parties have
        identified Snapchat as their primary digital channel for reaching young
        voters, investing at rates no other country matches. Whether this
        reflects Snapchat's market penetration in Norway or a uniquely
        digital-first political strategy is the real question.
      </InsightCallout>
    </Section>
  );
}
