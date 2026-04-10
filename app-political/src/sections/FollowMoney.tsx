import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtUsd, fmtNum, partyColor } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CATEGORY_LABEL: Record<string, string> = {
  party: "Political party",
  government: "Government",
  advocacy: "NGO / Advocacy",
  other: "Other",
};

const CATEGORY_COLOR: Record<string, string> = {
  party: "#365791",
  government: "#217866",
  advocacy: "#efd467",
  other: "#d8d8d4",
};

export function FollowMoney() {
  const top15 = [...report.top_advertisers]
    .sort((a, b) => b.spend_usd - a.spend_usd)
    .slice(0, 15);
  const chartData = top15.map((a) => ({
    name: a.name.length > 22 ? a.name.slice(0, 20) + "…" : a.name,
    fullName: a.name,
    spend: a.spend_usd,
    category: a.category,
    impressions: a.impressions,
    ads: a.ads,
  }));

  const byCategory = report.top_advertisers.reduce(
    (acc, a) => {
      const cat = a.category;
      if (!acc[cat]) acc[cat] = { spend: 0, ads: 0, count: 0 };
      acc[cat].spend += a.spend_usd;
      acc[cat].ads += a.ads;
      acc[cat].count += 1;
      return acc;
    },
    {} as Record<string, { spend: number; ads: number; count: number }>,
  );

  return (
    <Section id="money" title="Follow the Money" subtitle="Who Pays">
      <p className="mb-6 max-w-2xl text-gray-600">
        Norwegian political advertising on Snapchat isn't dominated by a single
        party. It's an ecosystem — from major parties to labor unions, from NGOs
        to government agencies. Here's who invests and how much.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(byCategory)
          .sort(([, a], [, b]) => b.spend - a.spend)
          .map(([cat, v]) => (
            <div
              key={cat}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div
                className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: CATEGORY_COLOR[cat] + "22",
                  color: CATEGORY_COLOR[cat],
                }}
              >
                {CATEGORY_LABEL[cat] ?? cat}
              </div>
              <p className="text-xl font-bold">{fmtUsd(v.spend)}</p>
              <p className="text-xs text-gray-600">
                {v.count} organizations · {v.ads.toLocaleString()} ads
              </p>
            </div>
          ))}
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Top 15 advertisers by USD spend
        </h3>
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 4 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) => fmtUsd(v)}
                tick={{ fontSize: 11, fill: "#7a7a7a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fontSize: 11, fill: "#171c1b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [fmtUsd(value), "Spend"]}
                labelFormatter={(label: string) => {
                  const item = chartData.find((d) => d.name === label);
                  return item?.fullName ?? label;
                }}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e8e8e6",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.category === "party"
                        ? partyColor(entry.fullName)
                        : CATEGORY_COLOR[entry.category] ?? "#7891d4"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <InsightCallout>
        <strong>Notice Fremskrittspartiet (FrP)?</strong> The Progress Party
        operates in EUR (not NOK), suggesting a pan-European ad buying
        arrangement — unusual for a domestic party. At EUR 287K (~$312K USD),
        they're the 2nd largest spender by USD value despite paying through a
        different currency.
      </InsightCallout>
    </Section>
  );
}
