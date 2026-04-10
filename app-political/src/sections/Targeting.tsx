import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtNum } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const FILL_COLORS = ["#217866", "#abd28b", "#efd467", "#7891d4", "#365791", "#36b2cf"];

export function Targeting() {
  const { targeting_rates, age_brackets } = report;

  const fillData = [
    { name: "Age", value: targeting_rates.age_pct },
    { name: "Metro/City", value: targeting_rates.metros_pct },
    { name: "Interests", value: targeting_rates.interests_pct },
    { name: "Region", value: targeting_rates.regions_pct },
    { name: "Radius", value: targeting_rates.radius_pct },
    { name: "Gender", value: targeting_rates.gender_pct },
  ];

  const agePieData = age_brackets
    .filter((b) => b.ads >= 10)
    .map((b) => ({
      name: b.bracket,
      value: b.ads,
    }));

  return (
    <Section id="targeting" title="Who They're Reaching" subtitle="Targeting">
      <p className="mb-6 max-w-2xl text-gray-600">
        Norwegian political advertisers target almost exclusively by age — but
        almost never by gender. Metro-level targeting is used by a third of ads,
        suggesting specific city-level campaigns.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Targeting parameter usage
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fillData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#7a7a7a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 12, fill: "#171c1b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Usage"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #e8e8e6",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#217866" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Age bracket distribution (grouped)
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {agePieData.map((_, i) => (
                    <Cell key={i} fill={FILL_COLORS[i % FILL_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString() + " ads", "Count"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #e8e8e6",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <InsightCallout>
        <strong>Gender-blind by default:</strong> Only 4.1% of Norwegian
        political ads target by gender — compared to commercial ads where
        gender targeting is common. Norwegian parties treat Snapchat as a
        universal reach channel, not a micro-targeting tool.
      </InsightCallout>

      <InsightCallout>
        <strong>Reaching future voters:</strong>{" "}
        {report.saturation.ads_targeting_minors} ads explicitly target 15-17
        year olds — citizens who can't yet vote in national elections. With{" "}
        {fmtNum(report.saturation.minor_impressions)} impressions served to
        minors, parties are priming the next generation of voters. Norway has
        debated lowering the voting age to 16; this data shows parties are
        already treating them as an audience.
      </InsightCallout>
    </Section>
  );
}
