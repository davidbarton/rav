import { useState } from "react";
import { ExternalLink, Video, Image, Play } from "lucide-react";
import { Section } from "@/components/Section";
import { InsightCallout } from "@/components/InsightCallout";
import { report } from "@/lib/data";
import { fmtNum, fmtUsd } from "@/lib/utils";

const CATEGORY_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  party: { label: "Party", bg: "#365791", text: "#fff" },
  government: { label: "Gov't", bg: "#217866", text: "#fff" },
  advocacy: { label: "NGO", bg: "#efd467", text: "#171c1b" },
  other: { label: "Other", bg: "#d8d8d4", text: "#171c1b" },
};

function CreativeCard({ c }: { c: (typeof report.top_creatives)[number] }) {
  const badge = CATEGORY_BADGE[c.category] ?? CATEGORY_BADGE.other;
  const MediaIcon = c.media_type === "video" ? Video : Image;
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={c.creative_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[9/16] flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-gray-900 text-left transition hover:shadow-lg hover:ring-2 hover:ring-brand-600/40"
    >
      {/* Background media */}
      {c.media_url && !imgError ? (
        c.media_type === "image" ? (
          <img
            src={c.media_url}
            alt={`Ad by ${c.advertiser}`}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={c.media_url}
            muted
            playsInline
            preload="auto"
            onError={() => setImgError(true)}
            onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.5; }}
            className="absolute inset-0 h-full w-full object-cover"
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0.5; }}
          />
        )
      ) : null}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {/* Content layer */}
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        {/* Top: badges */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
          <MediaIcon className="size-3.5 text-white/60" />
        </div>

        {/* Center: play/link icon */}
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-full bg-black/30 p-3 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
            {c.media_type === "video" ? (
              <Play className="size-5 text-white" />
            ) : (
              <ExternalLink className="size-5 text-white" />
            )}
          </div>
        </div>

        {/* Bottom: metadata */}
        <div>
          <p className="truncate text-xs font-semibold text-white drop-shadow">
            {c.advertiser}
          </p>
          <p className="mt-0.5 text-[10px] text-white/80 drop-shadow">
            {fmtNum(c.impressions)} impr · {fmtUsd(c.spend_usd)}
          </p>
          <p className="text-[10px] text-white/60 drop-shadow">
            {c.date.slice(0, 10)} · {c.media_type}
          </p>
        </div>
      </div>
    </a>
  );
}

export function SeeTheAds() {
  const creatives = report.top_creatives;

  return (
    <Section id="creatives" title="See the Actual Ads" subtitle="Creative Gallery">
      <p className="mb-6 max-w-2xl text-gray-600">
        Every political ad on Snapchat comes with its actual creative asset —
        the image or video voters saw. Click any card to view the original in
        Snapchat's Political Ads Library. These are the highest-reach Norwegian
        political ads, spanning parties, NGOs, and government.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {creatives.map((c, i) => (
          <CreativeCard key={i} c={c} />
        ))}
      </div>

      <InsightCallout>
        <strong>Full transparency:</strong> Every creative shown here is
        directly from Snapchat's Political Ads Library. 99.7% of Norway's
        4,600 political ads include their original creative asset — a level
        of transparency no other platform offers. Click any card to see
        the actual ad Norwegian voters saw.
      </InsightCallout>
    </Section>
  );
}
