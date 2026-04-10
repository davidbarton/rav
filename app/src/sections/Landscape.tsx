import { Section } from "../components/Section";
import { KpiCard } from "../components/KpiCard";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum, fmtEur } from "../lib/utils";

export function Landscape() {
  const d = report.landscape;
  const m = d.market;
  return (
    <Section
      id="landscape"
      subtitle="The Market"
      title="How big is fashion on Snapchat?"
    >
      {m && (
        <>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-600">
            Full Fashion Market
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Brands Tracked" value={m.brand_count} />
            <KpiCard label="Total Ads" value={m.total_ads} />
            <KpiCard
              label="Total Impressions"
              value={m.total_impressions}
              formatter={fmtNum}
            />
            <KpiCard
              label="Est. Market Spend"
              value={m.est_spend_low}
              formatter={fmtEur}
              detail={`Range: ${fmtEur(m.est_spend_low)}–${fmtEur(m.est_spend_high)}`}
            />
          </div>
        </>
      )}

      <p className="mb-1 mt-8 text-xs font-medium uppercase tracking-wider text-gray-600">
        Your Luxury Competitive Set
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Luxury Brands" value={d.brand_count} />
        <KpiCard label="Luxury Ads" value={d.total_ads} />
        <KpiCard
          label="Luxury Impressions"
          value={d.total_impressions}
          formatter={fmtNum}
        />
        <KpiCard
          label="EU Countries"
          value={d.country_count}
        />
      </div>

      <InsightCallout>
        {m
          ? <>We track <strong>{m.brand_count} fashion brands</strong> running{" "}
              {fmtNum(m.total_ads)} ads for {fmtNum(m.total_impressions)} impressions
              across {m.country_count} EU countries (est. spend {fmtEur(m.est_spend_low)}–{fmtEur(m.est_spend_high)}).{" "}
              Within this, your <strong>{d.brand_count} luxury competitors</strong> account
              for {fmtNum(d.total_ads)} ads and {fmtNum(d.total_impressions)} impressions.</>
          : <>{d.brand_count} luxury brands collectively ran {d.total_ads} ads
              generating {fmtNum(d.total_impressions)} impressions across{" "}
              {d.country_count} EU countries. Estimated combined spend:{" "}
              {fmtEur(d.est_spend_low)}–{fmtEur(d.est_spend_high)}.</>
        }{" "}
        <strong>Snapchat is a serious channel for luxury.</strong>
      </InsightCallout>
    </Section>
  );
}
