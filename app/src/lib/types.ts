export interface Report {
  generated_at: string;
  brand: string;
  meta: {
    cpm_range: { low: number; high: number };
    currency: string;
    disclaimer: string;
  };
  profile: {
    bio: string;
    website: string;
    avatar_url: string;
    hero_url: string;
    spotlight_count: number;
  } | null;
  landscape: {
    total_ads: number;
    total_impressions: number;
    est_spend_low: number;
    est_spend_high: number;
    brand_count: number;
    country_count: number;
  };
  position: {
    dior_rank: number;
    brands: BrandPosition[];
  };
  geography: {
    dior: GeoEntry[];
    missing_countries: string[];
    competitors: CompetitorGeo[];
  };
  creative: {
    format_by_brand: Record<string, FormatEntry[]>;
    top_creatives: Creative[];
  };
  cadence: Record<string, CadenceEntry[]>;
  discovery: Record<string, DiscoveryBrand>;
  content: {
    spotlights: Spotlight[];
    totals: {
      count: number;
      total_views: number;
      total_boosts: number;
      total_shares: number;
    };
  };
  takeaways: Takeaway[];
}

export interface BrandPosition {
  brand: string;
  ads: number;
  countries: number;
  impressions: number;
  share_pct: number;
  per_ad_avg: number;
  est_spend_low: number;
  est_spend_high: number;
}

export interface GeoEntry {
  country: string;
  ads: number;
  impressions: number;
}

export interface CompetitorGeo {
  brand: string;
  countries: string[];
  top_country: string | null;
  top_country_impressions: number;
}

export interface FormatEntry {
  format: string;
  ads: number;
  impressions: number;
  pct: number;
}

export interface Creative {
  headline: string;
  impressions_total: number;
  country: string;
  format: string;
  creative_url: string | null;
  start_date: string;
}

export interface CadenceEntry {
  month: string;
  ads: number;
  impressions: number;
}

export interface Spotlight {
  llm_title: string | null;
  description: string;
  view_count: number;
  share_count: number;
  boost_count: number;
  thumbnail_url: string;
  content_url: string;
  duration_ms: number;
  uploaded_at: string;
  hashtags: string[];
}

export interface DiscoveryBrand {
  keyword: string;
  sections: { type: string; count: number }[];
  totalCreators: number;
  profileCount: number;
  topicCount: number;
  topics: string[];
  topCreators: {
    username: string;
    displayName: string;
    viewCount: number;
    thumbnailUrl?: string;
  }[];
}

export interface Takeaway {
  id: string;
  title: string;
  body: string;
}
