export interface SpotlightCreator {
  username: string;
  displayName: string;
  tier?: string;
  viewCount: number;
  shareCount: number;
  llmTitle?: string;
  llmDescription?: string;
  llmKeywords?: string[];
  thumbnailUrl?: string;
}

export interface SubscribeProfile {
  title: string;
  subscriberCount: number;
  username: string;
  isBrand: boolean;
  isPartner: boolean;
  websiteUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  category?: string;
}

export interface SectionSummary {
  type: string;
  count: number;
}

export interface ExploreResult {
  keyword: string;
  query?: string;
  country?: string;
  sections: SectionSummary[];
  spotlightCreators: SpotlightCreator[];
  subscribeProfiles: SubscribeProfile[];
  topics: string[];
  totalCreators: number;
  _stale?: boolean;
}

export interface CachedKeyword {
  keyword: string;
  fetchedAt: string;
  creatorsFound: number;
  sectionCount: number;
  country?: string;
}

export interface TrendingData {
  creators: Array<{
    username: string;
    displayName: string;
    totalViews: number;
    keywords: string[];
    thumbnailUrl?: string;
  }>;
  profiles: Array<{
    username: string;
    title: string;
    subscriberCount: number;
    keywords: string[];
    logoUrl?: string;
  }>;
  topics: Array<{ topic: string; count: number }>;
}

export async function fetchExploreData(keyword: string): Promise<ExploreResult> {
  const res = await fetch(`/api/explore?q=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCachedKeywords(): Promise<CachedKeyword[]> {
  const res = await fetch("/api/explore/cached");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.keywords;
}

export async function fetchTrending(): Promise<TrendingData> {
  const res = await fetch("/api/explore/trending");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface SponsoredResult {
  sponsor_name: string;
  creator_name: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
}

export interface SponsoredSearchResponse {
  query: string;
  total: number;
  results: SponsoredResult[];
  topSponsors: Array<{ name: string; count: number }>;
  topCreators: Array<{ name: string; count: number }>;
}

export interface SponsoredStats {
  stats: Array<{
    content_type: string;
    total: number;
    sponsors: number;
    creators: number;
  }>;
}

export async function searchSponsored(q: string, type?: string, limit = 50): Promise<SponsoredSearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (type) params.set("type", type);
  const res = await fetch(`/api/sponsored/search?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSponsoredStats(): Promise<SponsoredStats> {
  const res = await fetch("/api/sponsored/stats");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
