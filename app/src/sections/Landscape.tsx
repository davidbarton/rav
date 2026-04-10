import { Section } from "../components/Section";
import { KpiCard } from "../components/KpiCard";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum, fmtEur } from "../lib/utils";

export function Landscape() {
  const d = report.landscape;
  return (
    <Section
      id="landscape"
      subtitle="The Market"
      title="How big is luxury fashion on Snapchat?"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Ads Tracked"
          value={d.total_ads}
        />
        <KpiCard
          label="Total Impressions"
          value={d.total_impressions}
          formatter={fmtNum}
        />
        <KpiCard
          label="Est. Combined Spend"
          value={d.est_spend_low}
          formatter={fmtEur}
          detail={`Range: ${fmtEur(d.est_spend_low)}–${fmtEur(d.est_spend_high)}`}
        />
        <KpiCard
          label="EU Countries"
          value={d.country_count}
        />
      </div>

      <InsightCallout>
        {d.brand_count} luxury brands collectively ran {d.total_ads} ads
        generating {fmtNum(d.total_impressions)} impressions across{" "}
        {d.country_count} EU countries. Estimated combined spend:{" "}
        {fmtEur(d.est_spend_low)}–{fmtEur(d.est_spend_high)}.{" "}
        <strong>Snapchat is a serious channel for luxury.</strong>
      </InsightCallout>
    </Section>
  );
}
