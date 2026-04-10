import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Section } from "../components/Section";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum, fmtPct, fmtEur } from "../lib/utils";

const BRAND = report.brand;
const BRAND_COLOR = "#248069";
const OTHER_COLOR = "#d8d8d4";

export function Position() {
  const { brands, dior_rank } = report.position;

  const data = brands.map((b) => ({
    name: b.brand,
    impressions: b.impressions,
    share: b.share_pct,
    ads: b.ads,
    perAd: b.per_ad_avg,
  }));

  const dior = brands.find((b) => b.brand === BRAND)!;
  const leader = brands[0];
  const gucci = brands.find((b) => b.brand === "Gucci");

  return (
    <Section
      id="position"
      subtitle="Your Position"
      title="Are you being outspent?"
    >
      <p className="mb-6 max-w-prose text-gray-600">
        Dior ranks <strong>#{dior_rank}</strong> of {brands.length} luxury
        brands by total EU impressions. {leader.brand} leads with{" "}
        {fmtNum(leader.impressions)} impressions from {leader.ads} ads.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <ResponsiveContainer width="100%" height={Math.max(360, brands.length * 36)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 100, right: 20, top: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={fmtNum}
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 13, fill: "#171c1b" }}
              width={90}
            />
            <Tooltip
              formatter={(v: unknown) => [fmtNum(v as number), "Impressions"]}
              contentStyle={{
                borderRadius: 10,
                border: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
            />
            <Bar dataKey="impressions" radius={[0, 6, 6, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === BRAND ? BRAND_COLOR : OTHER_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600">
              <th className="py-2 pr-4 font-medium">Brand</th>
              <th className="py-2 pr-4 text-right font-medium">Ads</th>
              <th className="py-2 pr-4 text-right font-medium">Countries</th>
              <th className="py-2 pr-4 text-right font-medium">Impressions</th>
              <th className="py-2 pr-4 text-right font-medium">Share</th>
              <th className="py-2 pr-4 text-right font-medium">Per-Ad Avg</th>
              <th className="py-2 text-right font-medium">Est. Spend</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr
                key={b.brand}
                className={`border-b border-gray-100 transition-colors ${b.brand === BRAND ? "bg-brand-50 font-semibold" : "hover:bg-gray-50"}`}
              >
                <td className="py-2 pr-4">{b.brand}</td>
                <td className="py-2 pr-4 text-right">{b.ads}</td>
                <td className="py-2 pr-4 text-right">{b.countries}</td>
                <td className="py-2 pr-4 text-right">
                  {fmtNum(b.impressions)}
                </td>
                <td className="py-2 pr-4 text-right">{fmtPct(b.share_pct)}</td>
                <td className="py-2 pr-4 text-right">{fmtNum(b.per_ad_avg)}</td>
                <td className="py-2 text-right text-xs text-gray-600">
                  {fmtEur(b.est_spend_low)}–{fmtEur(b.est_spend_high)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InsightCallout>
        Dior runs {dior.ads} ads across {dior.countries} countries for{" "}
        {fmtNum(dior.impressions)} impressions ({fmtNum(dior.per_ad_avg)}/ad).
        {gucci &&
          ` Gucci achieves ${fmtNum(gucci.impressions)} from just ${gucci.ads} ads — ${fmtNum(gucci.per_ad_avg)} per ad, ${Math.round(gucci.per_ad_avg / dior.per_ad_avg)}× Dior's efficiency.`}
      </InsightCallout>
    </Section>
  );
}
