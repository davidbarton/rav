import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState } from "react";
import { Section } from "../components/Section";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum } from "../lib/utils";

const COLORS: Record<string, string> = {
  Dior: "#248069",
  Cartier: "#7891d4",
  Gucci: "#efd467",
  Chanel: "#abd28b",
  "Louis Vuitton": "#365791",
};

const SHOWN_BRANDS = ["Dior", "Cartier", "Gucci", "Chanel", "Louis Vuitton"];

export function Cadence() {
  const cadence = report.cadence;
  const [focusBrand, setFocusBrand] = useState<string | null>(null);

  const allMonths = new Set<string>();
  for (const entries of Object.values(cadence)) {
    for (const e of entries) allMonths.add(e.month);
  }
  const months = [...allMonths].sort();

  const chartData = months.map((m) => {
    const row: Record<string, string | number> = {
      month: m.slice(0, 7),
    };
    for (const brand of SHOWN_BRANDS) {
      const entry = cadence[brand]?.find((e) => e.month === m);
      row[brand] = entry ? entry.impressions : 0;
    }
    return row;
  });

  const diorMonths = cadence["Dior"] ?? [];
  const activeMonths = diorMonths.length;
  const gapMonths = months.length - activeMonths;

  return (
    <Section
      id="cadence"
      subtitle="Campaign Rhythm"
      title="When do you show up — and when don't you?"
    >
      <p className="mb-4 max-w-prose text-gray-600">
        Campaign timing reveals strategy. Cartier concentrates spend in
        massive bursts. Chanel maintains always-on presence. Dior is active{" "}
        {activeMonths} of {months.length} months
        {gapMonths > 0 && ` — leaving ${gapMonths} gap months`}.
      </p>

      {/* Brand filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFocusBrand(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            focusBrand === null
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All brands
        </button>
        {SHOWN_BRANDS.map((brand) => (
          <button
            key={brand}
            onClick={() => setFocusBrand(focusBrand === brand ? null : brand)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              focusBrand === brand
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={focusBrand === brand ? { backgroundColor: COLORS[brand] } : undefined}
          >
            {brand}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart
            data={chartData}
            margin={{ left: 10, right: 10, top: 8, bottom: 8 }}
          >
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#7a7a7a" }}
              tickFormatter={(v: string) => {
                const [y, m] = v.split("-");
                return `${m}/${y.slice(2)}`;
              }}
            />
            <YAxis
              tickFormatter={fmtNum}
              tick={{ fontSize: 11, fill: "#7a7a7a" }}
              width={55}
            />
            <Tooltip
              formatter={(v: number, name: string) => [fmtNum(v), name]}
              labelFormatter={(l: string) => {
                const [y, m] = l.split("-");
                return `${m}/${y}`;
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e8e8e6",
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SHOWN_BRANDS.map((brand) => {
              const isVisible = focusBrand === null || focusBrand === brand;
              const isDior = brand === "Dior";
              return (
                <Area
                  key={brand}
                  type="monotone"
                  dataKey={brand}
                  stroke={COLORS[brand] ?? "#999"}
                  fill={COLORS[brand] ?? "#999"}
                  fillOpacity={isVisible ? (isDior ? 0.25 : 0.08) : 0}
                  strokeOpacity={isVisible ? 1 : 0.1}
                  strokeWidth={isVisible && isDior ? 2.5 : 1.5}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <InsightCallout>
        Dior peaks in January ({fmtNum(diorMonths.find((m) => m.month.includes("2026-01"))?.impressions ?? 0)}{" "}
        impressions) and February, likely seasonal collection launches.
        {gapMonths > 0 && (
          <> The {gapMonths} silent months are windows where competitors capture attention unchallenged.</>
        )}
      </InsightCallout>
    </Section>
  );
}
