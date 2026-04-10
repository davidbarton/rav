import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState } from "react";
import { X } from "lucide-react";
import { Section } from "../components/Section";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum, formatLabel } from "../lib/utils";

const DATA_COLORS = [
  "#217866",
  "#abd28b",
  "#efd467",
  "#7891d4",
  "#365791",
  "#36b2cf",
];
const FORMATS = ["VIDEO", "IMAGE", "LENS_PACKAGE", "COLLECTION"];

export function Creative() {
  const { format_by_brand, top_creatives } = report.creative;
  const [lightbox, setLightbox] = useState<number | null>(null);

  const brands = Object.keys(format_by_brand);
  const chartData = brands.map((brand) => {
    const entry: Record<string, string | number> = { brand };
    for (const fmt of FORMATS) {
      const found = format_by_brand[brand].find((f) => f.format === fmt);
      entry[fmt] = found?.pct ?? 0;
    }
    return entry;
  });

  const diorLens = format_by_brand["Dior"]?.find(
    (f) => f.format === "LENS_PACKAGE",
  );
  const cartierLens = format_by_brand["Cartier"]?.find(
    (f) => f.format === "LENS_PACKAGE",
  );

  const hasImage = (c: typeof top_creatives[0]) =>
    c.creative_url &&
    !c.creative_url.includes("googleapis.com") &&
    c.creative_url.includes("sc-cdn.net");

  return (
    <Section
      id="creative"
      subtitle="Creative Strategy"
      title="What formats are your competitors investing in?"
    >
      <p className="mb-6 max-w-prose text-gray-600">
        Format mix reveals strategy. AR Lenses signal premium investment
        (€15–40 CPM vs €4–9 for standard). Dior dedicates{" "}
        {diorLens?.pct ?? 0}% of impressions to Lenses — Cartier invests{" "}
        {cartierLens?.pct ?? 0}%.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            margin={{ left: 80, right: 20, top: 8, bottom: 8 }}
            layout="vertical"
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12, fill: "#7a7a7a" }}
            />
            <YAxis
              type="category"
              dataKey="brand"
              tick={{ fontSize: 13, fill: "#171c1b" }}
              width={70}
            />
            <Tooltip
              formatter={(v: number, name: string) => [
                `${v}%`,
                formatLabel(name),
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e8e8e6",
                fontSize: 13,
              }}
            />
            <Legend
              formatter={formatLabel}
              wrapperStyle={{ fontSize: 12 }}
            />
            {FORMATS.map((fmt, i) => (
              <Bar
                key={fmt}
                dataKey={fmt}
                stackId="stack"
                fill={DATA_COLORS[i]}
                radius={
                  i === FORMATS.length - 1 ? [0, 4, 4, 0] : undefined
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top creatives gallery */}
      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Top Dior Creatives by Impressions
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {top_creatives.slice(0, 5).map((c, i) => (
            <button
              key={i}
              onClick={() => hasImage(c) ? setLightbox(i) : undefined}
              className={`group relative overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-md ${hasImage(c) ? "cursor-pointer" : "cursor-default"}`}
            >
              {hasImage(c) ? (
                <img
                  src={c.creative_url!}
                  alt={c.headline}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex aspect-[9/16] w-full items-center justify-center bg-gradient-to-b from-brand-900 to-brand-700 p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-white/90">{formatLabel(c.format)}</p>
                    <p className="mt-1 line-clamp-3 text-[10px] leading-tight text-white/60">{c.headline}</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6 text-left">
                <p className="truncate text-xs font-medium text-white">
                  {c.headline}
                </p>
                <p className="text-xs text-white/70">
                  {fmtNum(c.impressions_total)} impr · {c.country.toUpperCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && top_creatives[lightbox] && hasImage(top_creatives[lightbox]) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow"
            >
              <X className="size-4" />
            </button>
            <img
              src={top_creatives[lightbox].creative_url!}
              alt={top_creatives[lightbox].headline}
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="p-4">
              <p className="font-semibold">
                {top_creatives[lightbox].headline}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {fmtNum(top_creatives[lightbox].impressions_total)}{" "}
                impressions · {top_creatives[lightbox].country.toUpperCase()}{" "}
                · {formatLabel(top_creatives[lightbox].format)}
              </p>
            </div>
          </div>
        </div>
      )}

      <InsightCallout>
        The AR Lens gap is real: Cartier puts {cartierLens?.pct ?? 0}% of
        impression volume into premium AR formats. Dior's{" "}
        {diorLens?.pct ?? 0}% allocation leaves significant room to grow
        in the highest-impact ad format on Snapchat.
      </InsightCallout>
    </Section>
  );
}
