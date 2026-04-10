import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtNum, fmtUsd } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function Surprise() {
  const { overview, saturation, by_year, elections } = report;

  const cascade = [
    {
      label: "Per citizen",
      value: saturation.impressions_per_citizen,
      detail: `${(overview.total_impressions / 1e6).toFixed(0)}M impressions ÷ 5.4M people`,
      color: "#abd28b",
    },
    {
      label: "Per Snapchat user",
      value: saturation.impressions_per_snap_user,
      detail: `÷ ${(saturation.snap_users / 1e6).toFixed(1)}M Snapchat users (${saturation.snap_penetration_pct}% penetration)`,
      color: "#217866",
    },
    {
      label: "Per young voter (18-29)",
      value: saturation.youth_impressions_per_young_voter,
      detail: `${(saturation.youth_targeted_impressions / 1e6).toFixed(0)}M youth-targeted impressions ÷ ~750K voters`,
      color: "#145a4a",
    },
  ];

  const electionYearData = by_year
    .filter((y) => [2021, 2023, 2025].includes(y.year))
    .map((y) => {
      const election = elections.find((e) => e.date.startsWith(y.year.toString()));
      return {
        year: y.year.toString(),
        spend_usd: y.spend_usd,
        ads: y.ads,
        label: election?.name ?? "",
        type: election?.type ?? "",
      };
    });

  return (
    <Section id="surprise" title="The Saturation" subtitle="Scale">
      <p className="mb-6 max-w-2xl text-gray-600">
        Norway — a country of 5.4 million — has generated{" "}
        <strong>{fmtNum(overview.total_impressions)}</strong> political ad
        impressions on Snapchat. The scale only becomes clear when you divide
        that number down.
      </p>

      {/* Cascade cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cascade.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
            style={{ borderTopColor: c.color, borderTopWidth: "4px" }}
          >
            <p className="text-sm text-gray-600">{c.label}</p>
            <p className="mt-1 text-4xl font-bold tabular-nums" style={{ color: c.color }}>
              {c.value}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">{c.detail}</p>
          </div>
        ))}
      </div>

      {/* Election year growth */}
      <div className="mt-10">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Spend per election cycle (USD)
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={electionYearData} margin={{ top: 20, right: 16, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="year"
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
                formatter={(v: number) => [fmtUsd(v), "Spend"]}
                labelFormatter={(label: string) => {
                  const item = electionYearData.find((d) => d.year === label);
                  return item ? `${item.label} ${label}` : label;
                }}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e8e8e6",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="spend_usd" radius={[4, 4, 0, 0]}>
                {electionYearData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.type === "parliamentary" ? "#217866" : "#7891d4"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-[#217866]" />
            Parliamentary (Stortingsvalget)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-[#7891d4]" />
            Local (Kommunevalget)
          </span>
        </div>
      </div>

      {/* Overview table */}
      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Spend by currency (raw disclosure)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-600">
                <th className="px-4 py-2.5">Currency</th>
                <th className="px-4 py-2.5 text-right">Ads</th>
                <th className="px-4 py-2.5 text-right">Local spend</th>
                <th className="px-4 py-2.5 text-right">USD equiv.</th>
                <th className="px-4 py-2.5 text-right">Impressions</th>
                <th className="px-4 py-2.5 text-right">CPM (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.by_currency.map((r) => (
                <tr key={r.currency} className="hover:bg-gray-25">
                  <td className="px-4 py-2.5 font-medium">{r.currency}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.ads.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.spend_local.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(r.spend_usd)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(r.impressions)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">${r.cpm_usd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InsightCallout>
        <strong>The growth is accelerating:</strong> The 2025 Stortingsvalget
        drove {fmtUsd(electionYearData.find((d) => d.year === "2025")?.spend_usd ?? 0)} in
        spend — nearly 2× the 2021 election. Norwegian parties are doubling
        down on Snapchat with each election cycle, not pulling back.
      </InsightCallout>
    </Section>
  );
}
