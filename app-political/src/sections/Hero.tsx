import { report } from "@/lib/data";
import { fmtNum } from "@/lib/utils";

export function Hero() {
  const { overview, saturation } = report;
  return (
    <header className="relative overflow-hidden bg-brand-900 px-6 py-20 text-white md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,#248069_0%,transparent_70%)] opacity-40" />
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-700/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-72 rounded-full bg-brand-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-brand-100">
          Ravineo / Snapchat Transparency Report
        </p>

        <h1 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Norway's Political Ads
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-base text-gray-300 md:text-lg">
          {saturation.impressions_per_snap_user} ad impressions per Snapchat
          user. {overview.unique_advertisers} organizations spending $
          {(overview.total_spend_usd / 1_000_000).toFixed(1)}M. Is this
          democracy working — or broken?
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
          <Stat
            label="Ad impressions"
            value={fmtNum(overview.total_impressions)}
            detail={`${saturation.impressions_per_snap_user} per Snapchat user`}
          />
          <Stat
            label="Total spend"
            value={`$${(overview.total_spend_usd / 1_000_000).toFixed(1)}M`}
            detail={`across ${fmtNum(overview.total_ads)} ads`}
          />
          <Stat
            label="Advertisers"
            value={overview.unique_advertisers.toString()}
            detail="parties · NGOs · government"
          />
        </div>

        <p className="mx-auto mt-10 max-w-lg text-xs leading-relaxed text-gray-300/60">
          <strong className="text-gray-300/80">Data source:</strong>{" "}
          Snapchat's Political Ads Library — the only platform disclosing
          actual spend amounts, targeting parameters, and creative assets
          for every political ad. All figures verified against raw data.
        </p>
      </div>
    </header>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <p className="text-2xl font-bold md:text-3xl">{value}</p>
      <p className="text-sm text-gray-300">{label}</p>
      <p className="mt-0.5 text-xs text-brand-100">{detail}</p>
    </div>
  );
}
