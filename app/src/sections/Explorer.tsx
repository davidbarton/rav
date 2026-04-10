import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, Users, Eye, Share2, ArrowRight, ExternalLink, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { Section } from "../components/Section";
import {
  fetchExploreData,
  fetchCachedKeywords,
  fetchTrending,
  type ExploreResult,
  type CachedKeyword,
  type TrendingData,
} from "../lib/api";
import { fmtNum } from "../lib/utils";

const BRAND_KEYWORDS = ["dior", "chanel", "gucci", "cartier", "burberry", "louis_vuitton"];
const LIFESTYLE_KEYWORDS = ["luxury", "fashion", "beauty", "makeup", "skincare"];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-card border border-gray-200 bg-white p-4">
      <div className="mb-3 h-4 w-2/3 rounded bg-gray-200" />
      <div className="mb-2 h-3 w-1/2 rounded bg-gray-100" />
      <div className="h-3 w-1/3 rounded bg-gray-100" />
    </div>
  );
}

function TopicChip({
  topic,
  onClick,
  active,
}: {
  topic: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-gray-200 bg-white text-gray-600 hover:border-brand-600 hover:text-brand-600"
      }`}
    >
      #{topic.replace(/_/g, " ")}
      <ChevronRight className="size-3" />
    </button>
  );
}

function CreatorCard({ creator }: { creator: ExploreResult["spotlightCreators"][0] }) {
  return (
    <div className="group rounded-card border border-gray-200 bg-white p-4 transition hover:border-brand-600/40 hover:shadow-md">
      <div className="flex items-start gap-3">
        {creator.thumbnailUrl ? (
          <img
            src={creator.thumbnailUrl}
            alt=""
            className="size-12 shrink-0 rounded-full bg-gray-100 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Users className="size-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">{creator.displayName}</p>
          <p className="text-xs text-gray-600">@{creator.username}</p>
        </div>
      </div>
      {creator.llmTitle && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{creator.llmTitle}</p>
      )}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
        {creator.viewCount > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="size-3" /> {fmtNum(creator.viewCount)}
          </span>
        )}
        {creator.shareCount > 0 && (
          <span className="flex items-center gap-1">
            <Share2 className="size-3" /> {fmtNum(creator.shareCount)}
          </span>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: ExploreResult["subscribeProfiles"][0] }) {
  return (
    <div className="group rounded-card border border-gray-200 bg-white p-4 transition hover:border-brand-600/40 hover:shadow-md">
      <div className="flex items-start gap-3">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt=""
            className="size-10 shrink-0 rounded-full bg-gray-100 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-sm font-bold">
            {profile.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">{profile.title}</p>
          <p className="text-xs text-gray-600">@{profile.username}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-gray-600">
          <Users className="size-3" /> {fmtNum(profile.subscriberCount)} subscribers
        </span>
        {profile.websiteUrl && (
          <a
            href={profile.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand-600 hover:underline"
          >
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="mt-2 flex gap-1">
        {profile.isBrand && (
          <span className="rounded-pill bg-brand-50 px-2 py-0.5 text-xs text-brand-600">Brand</span>
        )}
        {profile.isPartner && (
          <span className="rounded-pill bg-brand-50 px-2 py-0.5 text-xs text-brand-600">Partner</span>
        )}
      </div>
    </div>
  );
}

function SectionBreakdown({ sections }: { sections: ExploreResult["sections"] }) {
  const total = sections.reduce((s, x) => s + x.count, 0);
  const typeLabels: Record<string, string> = {
    storyCard: "Stories",
    snapProEntity: "Profiles",
    publisher: "Publishers",
    publisherEdition: "Shows",
    lens: "Lenses",
    topic: "Topics",
    place: "Places",
    user: "Users",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((s) => (
        <div
          key={s.type}
          className="rounded-card border border-gray-200 bg-gray-25 px-3 py-2 text-center"
        >
          <p className="text-lg font-bold text-gray-900">{s.count}</p>
          <p className="text-xs text-gray-600">{typeLabels[s.type] ?? s.type}</p>
        </div>
      ))}
      <div className="rounded-card border border-brand-600/20 bg-brand-50 px-3 py-2 text-center">
        <p className="text-lg font-bold text-brand-600">{total}</p>
        <p className="text-xs text-brand-600">Total</p>
      </div>
    </div>
  );
}

function ExploreResults({
  data,
  onTopicClick,
}: {
  data: ExploreResult;
  onTopicClick: (topic: string) => void;
}) {
  const [showAllCreators, setShowAllCreators] = useState(false);
  const visibleCreators = showAllCreators
    ? data.spotlightCreators
    : data.spotlightCreators.slice(0, 6);

  return (
    <div className="mt-6 space-y-8">
      {data._stale && (
        <div className="rounded-card border border-warning/30 bg-warning-light px-4 py-2 text-sm text-warning">
          Showing cached results (live fetch failed). Data may be outdated.
        </div>
      )}

      <SectionBreakdown sections={data.sections} />

      {data.topics.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
            <Sparkles className="size-4" /> Related Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.topics.map((t) => (
              <TopicChip key={t} topic={t} onClick={() => onTopicClick(t)} />
            ))}
          </div>
        </div>
      )}

      {data.subscribeProfiles.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
            <Users className="size-4" /> Profiles ({data.subscribeProfiles.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.subscribeProfiles.map((p) => (
              <ProfileCard key={p.username} profile={p} />
            ))}
          </div>
        </div>
      )}

      {data.spotlightCreators.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
            <TrendingUp className="size-4" /> Spotlight Creators ({data.spotlightCreators.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCreators.map((c) => (
              <CreatorCard key={c.username} creator={c} />
            ))}
          </div>
          {data.spotlightCreators.length > 6 && !showAllCreators && (
            <button
              onClick={() => setShowAllCreators(true)}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
            >
              Show all {data.spotlightCreators.length} creators
              <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Explorer() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExploreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedKeywords, setCachedKeywords] = useState<CachedKeyword[]>([]);
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCachedKeywords().then(setCachedKeywords).catch(() => {});
    fetchTrending().then(setTrending).catch(() => {});
  }, []);

  const doSearch = useCallback(
    async (keyword: string) => {
      const clean = keyword.trim().toLowerCase();
      if (!clean) return;

      setQuery(clean);
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await fetchExploreData(clean);
        setResult(data);
        setTrail((prev) => {
          const without = prev.filter((k) => k !== clean);
          return [...without, clean];
        });
        // Refresh cached list
        fetchCachedKeywords().then(setCachedKeywords).catch(() => {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleTopicClick = (topic: string) => {
    doSearch(topic);
    window.scrollTo({ top: document.getElementById("explorer")?.offsetTop ?? 0, behavior: "smooth" });
  };

  return (
    <Section id="explorer" title="Keyword Explorer" subtitle="Live Discovery">
      <p className="mb-6 max-w-2xl text-gray-600">
        Type any keyword to see who shows up on Snapchat's explore page — profiles,
        creators, spotlight content, and related topics. Results are fetched live
        from Snapchat and cached locally.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-600" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any keyword... (e.g. dior, sneakers, beauty)"
          className="w-full rounded-card border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-600/50 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-600" />
        )}
      </form>

      {/* Quick-select chips */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
          Brands
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BRAND_KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => doSearch(kw)}
              className={`rounded-pill px-3 py-1 text-xs font-medium transition ${
                result?.keyword === kw
                  ? "bg-brand-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-brand-600 hover:text-brand-600"
              }`}
            >
              {kw.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
          Categories
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LIFESTYLE_KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => doSearch(kw)}
              className={`rounded-pill px-3 py-1 text-xs font-medium transition ${
                result?.keyword === kw
                  ? "bg-brand-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-brand-600 hover:text-brand-600"
              }`}
            >
              {kw.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Exploration trail (breadcrumb) */}
      {trail.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-600">
          <span className="font-semibold">Trail:</span>
          {trail.map((t, i) => (
            <span key={t} className="flex items-center gap-1">
              {i > 0 && <ArrowRight className="size-3 text-gray-300" />}
              <button
                onClick={() => doSearch(t)}
                className={`rounded-pill px-2 py-0.5 transition ${
                  t === result?.keyword
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 hover:bg-brand-50 hover:text-brand-600"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="size-4 animate-spin" />
            Fetching live data from Snapchat for &ldquo;{query}&rdquo;...
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-card border border-error/30 bg-error-light px-4 py-3 text-sm text-error">
          Failed to load results: {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <ExploreResults data={result} onTopicClick={handleTopicClick} />
      )}

      {/* Trending overview (shown when no active search) */}
      {!result && !loading && trending && (
        <div className="mt-4 space-y-8">
          <div className="rounded-card border border-gray-200 bg-gray-25 p-6">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-600">
              Aggregated from {cachedKeywords.length} keywords
            </h3>
            <p className="mb-4 text-xs text-gray-600">
              Top creators and profiles across all cached explore data.
            </p>

            {trending.topics.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold text-gray-600">Discovered Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {trending.topics.slice(0, 20).map((t) => (
                    <TopicChip
                      key={t.topic}
                      topic={t.topic}
                      onClick={() => doSearch(t.topic)}
                    />
                  ))}
                </div>
              </div>
            )}

            {trending.creators.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold text-gray-600">
                  Top Creators by Views
                </p>
                <div className="space-y-1">
                  {trending.creators.slice(0, 8).map((c) => (
                    <div
                      key={c.username}
                      className="flex items-center gap-3 rounded-btn bg-white px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {c.displayName}
                      </span>
                      <span className="shrink-0 text-xs text-gray-600">
                        {fmtNum(c.totalViews)} views
                      </span>
                      <span className="shrink-0 text-xs text-gray-300">
                        {c.keywords.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trending.profiles.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-600">
                  Top Profiles by Subscribers
                </p>
                <div className="space-y-1">
                  {trending.profiles.slice(0, 8).map((p) => (
                    <div
                      key={p.username}
                      className="flex items-center gap-3 rounded-btn bg-white px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {p.title}
                      </span>
                      <span className="shrink-0 text-xs text-gray-600">
                        {fmtNum(p.subscriberCount)} subs
                      </span>
                      <span className="shrink-0 text-xs text-gray-300">
                        {p.keywords.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
