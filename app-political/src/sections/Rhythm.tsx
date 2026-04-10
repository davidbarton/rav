import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtNok } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const MONTH_LABELS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Rhythm() {
  const cadenceData = report.monthly_cadence.map((c) => ({
    label: `${MONTH_LABELS[c.month]} ${c.year.toString().slice(2)}`,
    sortKey: c.year * 100 + c.month,
    spend: c.spend_nok,
    ads: c.ads,
    year: c.year,
    month: c.month,
  })).sort((a, b) => a.sortKey - b.sortKey);

  const electionLabels = report.elections.map((e) => {
    const d = new Date(e.date);
    const mo = d.getMonth() + 1;
    const yr = d.getFullYear();
    return {
      sortKey: yr * 100 + mo,
      label: `${MONTH_LABELS[mo]} ${yr.toString().slice(2)}`,
      name: e.name,
    };
  });

  return (
    <Section id="rhythm" title="The Election Rhythm" subtitle="Cadence">
      <p className="mb-6 max-w-2xl text-gray-600">
        Norwegian political ad spending follows a predictable heartbeat: massive
        August spikes before September elections, then near-silence. The pattern
        holds across parliamentary (Stortingsvalget) and local (Kommunevalget)
        elections.{" "}
        <span className="text-gray-400">
          (NOK-denominated ads only; EUR/GBP campaigns excluded for currency consistency.)
        </span>
      </p>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={cadenceData}
            margin={{ top: 20, right: 16, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#217866" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#217866" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#7a7a7a" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => fmtNok(v)}
              tick={{ fontSize: 11, fill: "#7a7a7a" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [fmtNok(value), "NOK Spend"]}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e8e8e6",
                fontSize: "12px",
              }}
            />
            {electionLabels.map((e) => (
              <ReferenceLine
                key={e.sortKey}
                x={e.label}
                stroke="#cd483f"
                strokeDasharray="4 4"
                label={{
                  value: e.name,
                  position: "top",
                  fontSize: 10,
                  fill: "#cd483f",
                }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#217866"
              strokeWidth={2}
              fill="url(#spendGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <InsightCallout>
        <strong>The August rule:</strong> In every election year, spending peaks
        in August — one month before the September vote. The 2025
        Stortingsvalget drove the largest single month (NOK 4.4M). Political
        parties clearly view Snapchat as a sprint channel, not a marathon one.
      </InsightCallout>
    </Section>
  );
}
