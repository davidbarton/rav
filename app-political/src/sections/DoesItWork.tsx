import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtUsd } from "@/lib/utils";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label,
} from "recharts";

const PARTY_COLORS: Record<string, string> = {
  "Høyre": "#0065BF",
  "Arbeiderpartiet": "#EF3340",
  "Senterpartiet": "#ADC733",
  "FrP": "#002776",
  "SV": "#EB4C60",
  "Rødt": "#D12B1E",
  "Venstre": "#007C5C",
  "MDG": "#6CB534",
  "KrF": "#F5C518",
};

export function DoesItWork() {
  const data = report.spend_vs_results_2021.map((d) => ({
    ...d,
    size: Math.max(d.result_pct * 12, 40),
  }));

  const biggestSpender = data.reduce((a, b) => (a.spend_usd > b.spend_usd ? a : b));
  const biggestGainer = data.reduce((a, b) => (a.change_pp > b.change_pp ? a : b));

  return (
    <Section id="does-it-work" title="Does Money Win?" subtitle="Spend vs. Results">
      <p className="mb-6 max-w-2xl text-gray-600">
        Norway's 2021 parliamentary election (Stortingsvalget) lets us test a
        simple question: <strong>does more Snapchat ad spend lead to better
        election outcomes?</strong> We mapped every party's Snapchat investment
        against their vote share change.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Biggest Snapchat spender</p>
          <p className="mt-1 text-xl font-bold" style={{ color: PARTY_COLORS[biggestSpender.party] }}>
            {biggestSpender.party}
          </p>
          <p className="text-sm text-gray-600">
            {fmtUsd(biggestSpender.spend_usd)} spent
          </p>
          <p className="mt-1 text-lg font-bold text-red-600">
            {biggestSpender.change_pp > 0 ? "+" : ""}
            {biggestSpender.change_pp}pp
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Biggest election gainer</p>
          <p className="mt-1 text-xl font-bold" style={{ color: PARTY_COLORS[biggestGainer.party] }}>
            {biggestGainer.party}
          </p>
          <p className="text-sm text-gray-600">
            {biggestGainer.spend_usd === 0
              ? "$0 spent on Snapchat"
              : `${fmtUsd(biggestGainer.spend_usd)} spent`}
          </p>
          <p className="mt-1 text-lg font-bold text-green-700">
            +{biggestGainer.change_pp}pp
          </p>
        </div>
        <div className="rounded-xl border-2 border-brand-600 bg-brand-50 p-5">
          <p className="text-sm text-brand-700 font-medium">Correlation</p>
          <p className="mt-1 text-2xl font-bold text-brand-800">None</p>
          <p className="mt-1 text-xs text-brand-600">
            The two parties with the biggest gains (Sp, Rødt) spent
            zero on Snapchat. The biggest spender lost the most seats.
          </p>
        </div>
      </div>

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="spend_usd"
              tickFormatter={(v: number) => fmtUsd(v)}
              tick={{ fontSize: 11, fill: "#7a7a7a" }}
              axisLine={false}
              tickLine={false}
            >
              <Label value="Snapchat spend (USD)" position="bottom" offset={0} style={{ fontSize: 12, fill: "#7a7a7a" }} />
            </XAxis>
            <YAxis
              type="number"
              dataKey="change_pp"
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}pp`}
              tick={{ fontSize: 11, fill: "#7a7a7a" }}
              axisLine={false}
              tickLine={false}
            >
              <Label value="Vote share change" angle={-90} position="left" offset={0} style={{ fontSize: 12, fill: "#7a7a7a" }} />
            </YAxis>
            <ReferenceLine y={0} stroke="#e8e8e6" strokeWidth={2} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-bold" style={{ color: PARTY_COLORS[d.party] }}>{d.party}</p>
                    <p>Spend: {fmtUsd(d.spend_usd)}</p>
                    <p>Result: {d.result_pct}% ({d.change_pp > 0 ? "+" : ""}{d.change_pp}pp)</p>
                  </div>
                );
              }}
            />
            <Scatter data={data} shape="circle">
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={PARTY_COLORS[d.party] ?? "#7891d4"}
                  fillOpacity={0.85}
                  r={Math.max(d.result_pct * 1.5, 6)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Party legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
        {data.map((d) => (
          <span key={d.party} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: PARTY_COLORS[d.party] }}
            />
            {d.party} ({d.change_pp > 0 ? "+" : ""}{d.change_pp}pp)
          </span>
        ))}
      </div>

      <InsightCallout>
        <strong>The verdict:</strong> Money doesn't buy Norwegian elections.
        Høyre was the top Snapchat spender at $156K and lost 4.6 percentage
        points. Senterpartiet spent nothing and gained 3.2pp. Rødt — also
        at $0 — more than doubled their vote share. Norwegian voters are
        demonstrably independent of advertising influence. That's a working
        democracy.
      </InsightCallout>
    </Section>
  );
}
