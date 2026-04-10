import { useState, useRef, useEffect } from "react";
import { Section } from "../components/Section";
import { InsightCallout } from "../components/InsightCallout";
import { report } from "../lib/data";
import { fmtNum } from "../lib/utils";
import { Users, Eye } from "lucide-react";

const BRAND_KEYWORD = "dior";

const LABEL: Record<string, string> = {
  dior: "Dior",
  chanel: "Chanel",
  gucci: "Gucci",
  cartier: "Cartier",
  burberry: "Burberry",
  louis_vuitton: "Louis Vuitton",
};

export function Discovery() {
  const data = report.discovery;
  const brands = Object.keys(data);
  const [expanded, setExpanded] = useState<string | null>(null);

  const dior = data[BRAND_KEYWORD];
  const maxCreators = Math.max(...brands.map((b) => data[b].totalCreators));

  // Determine competitive position
  const sorted = [...brands].sort(
    (a, b) => data[b].totalCreators - data[a].totalCreators,
  );
  const diorDiscoveryRank = sorted.indexOf(BRAND_KEYWORD) + 1;

  // Animated bars
  const barsRef = useRef<HTMLDivElement>(null);
  const [animateBars, setAnimateBars] = useState(false);
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateBars(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const chanelData = data["chanel"];
  const diorProfileCount = dior?.profileCount ?? 0;
  const chanelProfileCount = chanelData?.profileCount ?? 0;

  return (
    <Section id="discovery" title="Who Owns the Search?" subtitle="Discovery Landscape">
      <p className="mb-6 max-w-2xl text-gray-600">
        When someone searches for your brand on Snapchat's explore page, what do
        they find? This shows how each luxury house appears in organic discovery
        — creators making content, brand profiles surfacing, and related topics.
      </p>

      {/* Competitive comparison bars */}
      <div ref={barsRef} className="mb-8 space-y-3">
        {sorted.map((kw, i) => {
          const d = data[kw];
          const pct = maxCreators > 0 ? (d.totalCreators / maxCreators) * 100 : 0;
          const isUs = kw === BRAND_KEYWORD;

          return (
            <button
              key={kw}
              onClick={() => setExpanded(expanded === kw ? null : kw)}
              className={`group w-full text-left transition ${
                expanded === kw ? "rounded-card border border-brand-600/20 bg-brand-50/30 p-4" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-28 shrink-0 text-sm font-medium ${
                    isUs ? "text-brand-600" : "text-gray-600"
                  }`}
                >
                  {LABEL[kw] ?? kw}
                </span>
                <div className="relative h-7 flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className={`h-full rounded transition-all duration-700 ease-out ${
                      isUs ? "bg-brand-600" : "bg-gray-300 group-hover:bg-gray-400"
                    }`}
                    style={{
                      width: animateBars ? `${pct}%` : "0%",
                      transitionDelay: `${i * 80}ms`,
                    }}
                  />
                  <span
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium ${
                      pct > 60 ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {d.totalCreators} creators
                  </span>
                </div>
                <div className="flex w-20 shrink-0 items-center gap-1 text-xs text-gray-600">
                  <Users className="size-3" />
                  {d.profileCount} profiles
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === kw && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Sections breakdown */}
                  <div className="rounded-card border border-gray-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Content Sections
                    </p>
                    <div className="space-y-1">
                      {d.sections.map((s) => (
                        <div
                          key={s.type}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {s.type === "storyCard"
                              ? "Stories"
                              : s.type === "snapProEntity"
                                ? "Profiles"
                                : s.type === "lens"
                                  ? "Lenses"
                                  : s.type === "publisherEdition"
                                    ? "Shows"
                                    : s.type === "place"
                                      ? "Places"
                                      : s.type === "topic"
                                        ? "Topics"
                                        : s.type}
                          </span>
                          <span className="font-medium">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Related topics */}
                  {d.topics.length > 0 && (
                    <div className="rounded-card border border-gray-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Related Topics
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.topics.map((t) => (
                          <span
                            key={t}
                            className="rounded-pill bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top creators */}
                  {d.topCreators.length > 0 && (
                    <div className="rounded-card border border-gray-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Top Creators
                      </p>
                      <div className="space-y-1.5">
                        {d.topCreators.slice(0, 4).map((c) => (
                          <div
                            key={c.username}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="min-w-0 flex-1 truncate text-gray-900">
                              {c.displayName}
                            </span>
                            {c.viewCount > 0 && (
                              <span className="shrink-0 flex items-center gap-1 text-xs text-gray-600">
                                <Eye className="size-3" />
                                {fmtNum(c.viewCount)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Insight */}
      <InsightCallout>
        {diorDiscoveryRank <= 2 ? (
          <>
            Dior ranks <strong>#{diorDiscoveryRank}</strong> in explore discovery
            with <strong>{dior?.totalCreators}</strong> creators generating
            organic content around the brand keyword.
          </>
        ) : (
          <>
            Dior ranks <strong>#{diorDiscoveryRank} of {brands.length}</strong> in
            explore discovery. {sorted[0] && (
              <>
                <strong>{LABEL[sorted[0]]}</strong> leads with{" "}
                <strong>{data[sorted[0]].totalCreators}</strong> creators vs Dior's{" "}
                <strong>{dior?.totalCreators}</strong>.
              </>
            )}
            {chanelProfileCount > diorProfileCount && (
              <> Chanel surfaces <strong>{chanelProfileCount} brand profiles</strong> vs
              Dior's <strong>{diorProfileCount}</strong> — more owned presence in search.</>
            )}
          </>
        )}
      </InsightCallout>
    </Section>
  );
}
