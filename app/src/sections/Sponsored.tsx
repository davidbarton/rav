import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Image, Video, ExternalLink, Users, Building2 } from "lucide-react";
import { Section } from "../components/Section";
import {
  searchSponsored,
  fetchSponsoredStats,
  type SponsoredSearchResponse,
  type SponsoredStats,
} from "../lib/api";
import { fmtNum } from "../lib/utils";

function ContentTypeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-pill px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-gray-200 bg-white text-gray-600 hover:border-brand-600 hover:text-brand-600"
      }`}
    >
      {label}
    </button>
  );
}

export function Sponsored() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SponsoredSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SponsoredStats | null>(null);

  useEffect(() => {
    fetchSponsoredStats().then(setStats).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string, type: string) => {
    const clean = q.trim();
    if (clean.length < 2) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await searchSponsored(clean, type || undefined, 100);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, typeFilter);
  };

  const handleTypeChange = (type: string) => {
    const next = typeFilter === type ? "" : type;
    setTypeFilter(next);
    if (query.trim().length >= 2) doSearch(query, next);
  };

  const totalContent = stats?.stats.reduce((s, x) => s + x.total, 0) ?? 0;
  const totalSponsors = stats?.stats.reduce((s, x) => s + x.sponsors, 0) ?? 0;
  const totalCreators = stats?.stats.reduce((s, x) => s + x.creators, 0) ?? 0;

  return (
    <Section id="sponsored" title="Sponsored Content Search" subtitle="Creator Partnerships">
      <p className="mb-4 max-w-2xl text-gray-600">
        Search through <strong>{fmtNum(totalContent)}</strong> sponsored
        Snapchat posts to find creator partnerships, brand deals, and sponsored
        content by any name.
      </p>

      {/* Stats summary */}
      {stats && (
        <div className="mb-6 flex flex-wrap gap-4">
          {stats.stats.map((s) => (
            <div
              key={s.content_type}
              className="rounded-card border border-gray-200 bg-gray-25 px-4 py-3 text-center"
            >
              <p className="text-lg font-bold text-gray-900">
                {fmtNum(s.total)}
              </p>
              <p className="text-xs text-gray-600">
                {s.content_type === "SPOTLIGHT" ? "Spotlights" : "Stories"}
              </p>
              <p className="text-xs text-gray-300">
                {fmtNum(s.sponsors)} sponsors · {fmtNum(s.creators)} creators
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <form onSubmit={handleSubmit} className="mb-4 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by sponsor or creator name..."
            className="w-full rounded-card border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-600/50 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-600" />
          )}
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="shrink-0 rounded-card bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      <div className="mb-6 flex gap-2">
        <ContentTypeChip
          label="All"
          active={typeFilter === ""}
          onClick={() => handleTypeChange("")}
        />
        <ContentTypeChip
          label="Spotlights"
          active={typeFilter === "SPOTLIGHT"}
          onClick={() => handleTypeChange("SPOTLIGHT")}
        />
        <ContentTypeChip
          label="Stories"
          active={typeFilter === "STORY"}
          onClick={() => handleTypeChange("STORY")}
        />
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="rounded-card border border-error/30 bg-error-light px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
          <Loader2 className="size-4 animate-spin" />
          Searching sponsored content...
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Found <strong>{result.total}</strong> results for &ldquo;{result.query}&rdquo;
            {result.total >= 100 && " (showing first 100)"}
          </p>

          {/* Top sponsors & creators side by side */}
          <div className="grid gap-4 sm:grid-cols-2">
            {result.topSponsors.length > 0 && (
              <div className="rounded-card border border-gray-200 bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <Building2 className="size-3" /> Top Sponsors
                </h4>
                <div className="space-y-1.5">
                  {result.topSponsors.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-gray-900">
                        {s.name}
                      </span>
                      <span className="shrink-0 text-xs text-gray-600">
                        {s.count} posts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.topCreators.length > 0 && (
              <div className="rounded-card border border-gray-200 bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <Users className="size-3" /> Top Creators
                </h4>
                <div className="space-y-1.5">
                  {result.topCreators.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-gray-900">
                        {c.name}
                      </span>
                      <span className="shrink-0 text-xs text-gray-600">
                        {c.count} posts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content grid */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
              Content ({result.results.length})
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {result.results.slice(0, 20).map((item, idx) => (
                <div
                  key={idx}
                  className="group overflow-hidden rounded-card border border-gray-200 bg-white transition hover:border-brand-600/40 hover:shadow-md"
                >
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      className="aspect-square w-full bg-gray-100 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gray-100">
                      {item.content_type === "SPOTLIGHT" ? (
                        <Video className="size-8 text-gray-300" />
                      ) : (
                        <Image className="size-8 text-gray-300" />
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-pill px-2 py-0.5 text-xs ${
                          item.content_type === "SPOTLIGHT"
                            ? "bg-brand-50 text-brand-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.content_type === "SPOTLIGHT"
                          ? "Spotlight"
                          : "Story"}
                      </span>
                      {item.content_url && (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-brand-600"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    {item.sponsor_name && (
                      <p className="mt-1 truncate text-xs text-gray-600">
                        Sponsor: {item.sponsor_name}
                      </p>
                    )}
                    {item.creator_name && (
                      <p className="truncate text-xs text-gray-300">
                        Creator: {item.creator_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {result.results.length > 20 && (
              <p className="mt-3 text-xs text-gray-300">
                Showing 20 of {result.results.length} results
              </p>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
