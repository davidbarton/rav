/**
 * Shared Snapchat /explore/<keyword> fetch + parse logic.
 *
 * Used by:
 *   - data_sources/snap_explore/src/fetch_explore.ts  (batch crawler)
 *   - app/server.ts                                    (live API proxy)
 */

import { gotScraping } from "got-scraping";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExploreStatus =
  | "fetched"
  | "empty"
  | "not_found"
  | "rate_limited"
  | "error";

export interface SectionSummary {
  type: string;
  count: number;
}

export interface ExploreExtract {
  query?: string;
  country?: string;
  sections: SectionSummary[];
  creatorsFound: number;
  topicsFound: string[];
}

export interface ExploreResult {
  status: ExploreStatus;
  keyword: string;
  pageProps?: Record<string, unknown>;
  extract?: ExploreExtract;
  error?: string;
}

export interface SpotlightCreator {
  username: string;
  displayName: string;
  tier?: string;
  userId?: string;
  viewCount: number;
  shareCount: number;
  llmTitle?: string;
  llmDescription?: string;
  llmKeywords?: string[];
  storyId?: string;
  thumbnailUrl?: string;
}

export interface SubscribeProfile {
  title: string;
  subscriberCount: number;
  username: string;
  mutableUsername?: string;
  tier?: string;
  isBrand: boolean;
  isPartner: boolean;
  businessProfileId?: string;
  accountId?: string;
  websiteUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  category?: string;
}

export interface ExploreData {
  keyword: string;
  query?: string;
  country?: string;
  sections: SectionSummary[];
  spotlightCreators: SpotlightCreator[];
  subscribeProfiles: SubscribeProfile[];
  topics: string[];
  totalCreators: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SNAPCHAT_EXPLORE = "https://www.snapchat.com/explore";
const REQUEST_TIMEOUT = 30_000;
const NEXT_DATA_RE = /<script[^>]*type="application\/json"[^>]*>(.*?)<\/script>/s;

// ---------------------------------------------------------------------------
// Core: parse pageProps into structured sections
// ---------------------------------------------------------------------------

export function extractExploreSummary(pageProps: Record<string, unknown>): ExploreExtract {
  const result: ExploreExtract = {
    query: pageProps.query as string | undefined,
    country: pageProps.country as string | undefined,
    sections: [],
    creatorsFound: 0,
    topicsFound: [],
  };

  let searchResponse: Record<string, unknown> | null = null;
  const rawSearch = pageProps.encodedSearchResponse;
  if (typeof rawSearch === "string" && rawSearch.length > 0) {
    try {
      searchResponse = JSON.parse(rawSearch) as Record<string, unknown>;
    } catch {
      // might already be an object
    }
  } else if (rawSearch && typeof rawSearch === "object") {
    searchResponse = rawSearch as Record<string, unknown>;
  }

  if (searchResponse) {
    const sections = searchResponse.sections as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(sections)) {
      for (const section of sections) {
        const results = section.results as Array<Record<string, unknown>> | undefined;
        if (!results || results.length === 0) continue;

        const firstResult = results[0].result as Record<string, unknown> | undefined;
        const sectionType = (firstResult?.$case as string) ?? "unknown";
        result.sections.push({ type: sectionType, count: results.length });

        for (const item of results) {
          const res = item.result as Record<string, unknown> | undefined;
          if (!res) continue;
          const caseType = res.$case as string | undefined;

          if (caseType === "snapProEntity" || caseType === "publisher" || caseType === "user") {
            result.creatorsFound++;
          } else if (caseType === "topic") {
            const topic = res.topic as Record<string, unknown> | undefined;
            if (topic) {
              const onTap = topic.onTap as Record<string, unknown> | undefined;
              const action = onTap?.action as Record<string, unknown> | undefined;
              const hashtagTopic = action?.openHashtagTopic as Record<string, unknown> | undefined;
              const topicText = hashtagTopic?.topicText as string | undefined;
              if (topicText) {
                result.topicsFound.push(topicText);
              } else {
                const directText = topic.text as string | undefined;
                if (directText) result.topicsFound.push(directText);
              }
            }
          }
        }
      }
    }
  }

  let spotlightMap: Record<string, unknown> | null = null;
  const rawSpotlight = pageProps.encodedSpotlightCardMap;
  if (typeof rawSpotlight === "string" && rawSpotlight.length > 0) {
    try {
      spotlightMap = JSON.parse(rawSpotlight) as Record<string, unknown>;
    } catch { /* already object */ }
  } else if (rawSpotlight && typeof rawSpotlight === "object") {
    spotlightMap = rawSpotlight as Record<string, unknown>;
  }

  if (spotlightMap) {
    const uniqueCreators = new Set<string>();
    for (const card of Object.values(spotlightMap) as Array<Record<string, unknown>>) {
      const snaps = card.snaps as Array<Record<string, unknown>> | undefined;
      if (!snaps) continue;
      for (const snap of snaps) {
        const creator = snap.creatorInfo as Record<string, unknown> | undefined;
        const userName = creator?.userName as string | undefined;
        if (userName) uniqueCreators.add(userName);
      }
    }
    result.creatorsFound += uniqueCreators.size;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Extract rich structured data from pageProps
// ---------------------------------------------------------------------------

export function extractExploreData(keyword: string, pageProps: Record<string, unknown>): ExploreData {
  const summary = extractExploreSummary(pageProps);

  const spotlightCreators: SpotlightCreator[] = [];
  const subscribeProfiles: SubscribeProfile[] = [];

  // Parse spotlight cards
  let spotlightMap: Record<string, unknown> | null = null;
  const rawSpotlight = pageProps.encodedSpotlightCardMap;
  if (typeof rawSpotlight === "string" && rawSpotlight.length > 0) {
    try { spotlightMap = JSON.parse(rawSpotlight); } catch { /* */ }
  } else if (rawSpotlight && typeof rawSpotlight === "object") {
    spotlightMap = rawSpotlight as Record<string, unknown>;
  }

  if (spotlightMap) {
    const seen = new Set<string>();
    for (const card of Object.values(spotlightMap) as Array<Record<string, unknown>>) {
      const snaps = card.snaps as Array<Record<string, unknown>> | undefined;
      if (!snaps) continue;
      for (const snap of snaps) {
        const creator = snap.creatorInfo as Record<string, unknown> | undefined;
        const userName = creator?.userName as string | undefined;
        if (!userName || seen.has(userName)) continue;
        seen.add(userName);

        const meta = snap.spotlightStoryMetadata as Record<string, unknown> | undefined;
        const thumbnails = snap.thumbnailUrls as string[] | undefined;

        spotlightCreators.push({
          username: userName,
          displayName: (creator?.displayName as string) ?? userName,
          tier: creator?.tier as string | undefined,
          userId: creator?.userId as string | undefined,
          viewCount: Number(snap.viewCount ?? meta?.viewCount ?? 0),
          shareCount: Number(snap.shareCount ?? meta?.shareCount ?? 0),
          llmTitle: meta?.llmTitle as string | undefined,
          llmDescription: meta?.llmDescription as string | undefined,
          llmKeywords: meta?.llmKeywords as string[] | undefined,
          storyId: snap.storyId as string | undefined,
          thumbnailUrl: thumbnails?.[0] ?? (snap.thumbnailUrl as string | undefined),
        });
      }
    }
  }

  // Parse subscribe profiles from encodedSearchResponse
  let searchResponse: Record<string, unknown> | null = null;
  const rawSearch = pageProps.encodedSearchResponse;
  if (typeof rawSearch === "string" && rawSearch.length > 0) {
    try { searchResponse = JSON.parse(rawSearch); } catch { /* */ }
  } else if (rawSearch && typeof rawSearch === "object") {
    searchResponse = rawSearch as Record<string, unknown>;
  }

  if (searchResponse) {
    const sections = searchResponse.sections as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(sections)) {
      for (const section of sections) {
        const results = section.results as Array<Record<string, unknown>> | undefined;
        if (!results) continue;
        for (const item of results) {
          const res = item.result as Record<string, unknown> | undefined;
          if (!res || res.$case !== "snapProEntity") continue;
          const entity = res.snapProEntity as Record<string, unknown> | undefined;
          if (!entity) continue;

          const profileInfo = entity.publicProfileInfo as Record<string, unknown> | undefined;
          const userInfo = entity.userInfo as Record<string, unknown> | undefined;

          subscribeProfiles.push({
            title: (entity.title as string) ?? (profileInfo?.title as string) ?? "",
            subscriberCount: Number(profileInfo?.subscriberCount ?? entity.subscriberCount ?? 0),
            username: (userInfo?.username as string) ?? (entity.username as string) ?? "",
            mutableUsername: userInfo?.mutableUsername as string | undefined,
            tier: userInfo?.tier as string | undefined,
            isBrand: Boolean(userInfo?.isBrand ?? false),
            isPartner: Boolean(userInfo?.isPartner ?? false),
            businessProfileId: profileInfo?.businessProfileId as string | undefined,
            accountId: profileInfo?.accountId as string | undefined,
            websiteUrl: profileInfo?.websiteUrl as string | undefined,
            logoUrl: (profileInfo?.profilePictureUrl as string) ?? (entity.squareHeroImageUrl as string | undefined),
            heroImageUrl: profileInfo?.heroImageUrl as string | undefined,
            category: profileInfo?.category as string | undefined,
          });
        }
      }
    }
  }

  return {
    keyword,
    query: summary.query,
    country: summary.country,
    sections: summary.sections,
    spotlightCreators,
    subscribeProfiles,
    topics: summary.topicsFound,
    totalCreators: summary.creatorsFound,
  };
}

// ---------------------------------------------------------------------------
// Core: fetch a single explore page from Snapchat
// ---------------------------------------------------------------------------

export function keywordToSlug(keyword: string): string {
  return encodeURIComponent(keyword.trim().toLowerCase());
}

export async function fetchExplore(keyword: string, proxyUrl?: string): Promise<ExploreResult> {
  const slug = keywordToSlug(keyword);
  const url = `${SNAPCHAT_EXPLORE}/${slug}`;
  const base: ExploreResult = { status: "error", keyword };

  let statusCode: number;
  let body: string;
  try {
    const opts: Record<string, unknown> = {
      url,
      headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] },
      responseType: "text",
      throwHttpErrors: false,
      timeout: { request: REQUEST_TIMEOUT },
    };
    if (proxyUrl) opts.proxyUrl = proxyUrl;
    const resp = await gotScraping(opts as Parameters<typeof gotScraping>[0]);
    statusCode = resp.statusCode;
    body = resp.body as string;
  } catch (err) {
    return { ...base, error: `NETWORK: ${err}` };
  }

  if (statusCode === 404) return { ...base, status: "not_found" };
  if (statusCode === 429) return { ...base, status: "rate_limited", error: "HTTP 429" };
  if (statusCode !== 200) return { ...base, status: "error", error: `HTTP ${statusCode}` };

  if (body.length < 1000) {
    return { ...base, status: "rate_limited", error: "Tiny response (likely blocked)" };
  }

  const match = NEXT_DATA_RE.exec(body);
  if (!match) {
    return { ...base, status: "error", error: "No __NEXT_DATA__ found" };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return { ...base, status: "error", error: "JSON parse failed on __NEXT_DATA__" };
  }

  const props = data.props as Record<string, unknown> | undefined;
  const pageProps = props?.pageProps as Record<string, unknown> | undefined;
  if (!pageProps) {
    return { ...base, status: "error", error: "No pageProps" };
  }

  const extract = extractExploreSummary(pageProps);

  if (extract.sections.length === 0 && !pageProps.encodedSpotlightCardMap) {
    return { ...base, status: "empty", pageProps, extract, error: "No sections or spotlight data" };
  }

  return { status: "fetched", keyword, pageProps, extract };
}
