import { Play, Eye, Share2, Flame } from "lucide-react";
import { Section } from "../components/Section";
import { KpiCard } from "../components/KpiCard";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum } from "../lib/utils";

export function Content() {
  const { spotlights, totals } = report.content;

  return (
    <Section
      id="content"
      subtitle="Organic Content"
      title="What's your strongest Snapchat content?"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Spotlight Videos" value={totals.count} />
        <KpiCard label="Total Views" value={totals.total_views} formatter={fmtNum} />
        <KpiCard label="Total Boosts" value={totals.total_boosts} formatter={fmtNum} />
        <KpiCard label="Total Shares" value={totals.total_shares} />
      </div>

      {/* Spotlight gallery */}
      <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-3">
        {spotlights.slice(0, 6).map((s, i) => (
          <div
            key={i}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
          >
            <div className="relative">
              <img
                src={s.thumbnail_url}
                alt={s.llm_title ?? s.description}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%23f5f5f4' width='320' height='180'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237a7a7a' font-size='14'%3ENo preview%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                <Play className="size-10 text-white" fill="white" />
              </div>
              <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {Math.round(s.duration_ms / 1000)}s
              </span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium">
                {s.llm_title ?? s.description}
              </p>
              <div className="mt-2 flex gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" /> {fmtNum(s.view_count)}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="size-3.5" /> {fmtNum(s.boost_count)}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="size-3.5" /> {s.share_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <InsightCallout>
        Fashion show behind-the-scenes content dominates engagement. The top
        spotlight — "{spotlights[0]?.llm_title ?? spotlights[0]?.description}" —
        earned {fmtNum(spotlights[0]?.view_count ?? 0)} views and{" "}
        {fmtNum(spotlights[0]?.boost_count ?? 0)} boosts. Organic content is
        working — invest more here.
      </InsightCallout>
    </Section>
  );
}
