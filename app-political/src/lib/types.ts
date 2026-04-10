export interface Report {
  generated_at: string;
  title: string;
  meta: {
    fx_rates: Record<string, number>;
    disclaimer: string;
    population: Record<string, number>;
  };
  overview: {
    total_ads: number;
    total_spend_usd: number;
    total_impressions: number;
    unique_advertisers: number;
    year_range: string;
    per_capita_usd: number;
    impressions_per_citizen: number;
  };
  by_currency: CurrencyBreakdown[];
  top_advertisers: Advertiser[];
  by_year: YearEntry[];
  monthly_cadence: CadenceEntry[];
  age_brackets: AgeBracket[];
  targeting_rates: TargetingRates;
  nordic_comparison: CountryComparison[];
  global_comparison: CountryComparison[];
  cpm_by_country: CpmEntry[];
  top_creatives: Creative[];
  saturation: Saturation;
  spend_vs_results_2021: SpendVsResult[];
  elections: Election[];
  findings: Finding[];
}

export interface Creative {
  advertiser: string;
  category: "party" | "government" | "advocacy" | "other";
  creative_url: string;
  media_url: string;
  media_type: "image" | "video";
  impressions: number;
  spend_usd: number;
  currency: string;
  date: string;
  age_target: string;
}

export interface CurrencyBreakdown {
  currency: string;
  ads: number;
  spend_local: number;
  spend_usd: number;
  impressions: number;
  cpm_local: number;
  cpm_usd: number;
}

export interface Advertiser {
  name: string;
  category: "party" | "government" | "advocacy" | "other";
  currency: string;
  ads: number;
  spend_local: number;
  spend_usd: number;
  impressions: number;
}

export interface YearEntry {
  year: number;
  ads: number;
  spend_usd: number;
  impressions: number;
}

export interface CadenceEntry {
  year: number;
  month: number;
  ads: number;
  spend_nok: number;
  impressions: number;
}

export interface AgeBracket {
  bracket: string;
  ads: number;
  spend: number;
  impressions: number;
}

export interface TargetingRates {
  total_ads: number;
  age_pct: number;
  gender_pct: number;
  regions_pct: number;
  radius_pct: number;
  interests_pct: number;
  metros_pct: number;
}

export interface CountryComparison {
  country: string;
  ads: number;
  spend_usd: number;
  impressions: number;
  population: number;
  per_capita_usd: number;
  impressions_per_citizen: number;
  unique_advertisers?: number;
}

export interface CpmEntry {
  country: string;
  currency: string;
  ads: number;
  cpm_local: number;
  cpm_usd: number;
}

export interface Saturation {
  impressions_per_citizen: number;
  impressions_per_snap_user: number;
  ads_per_million_citizens: number;
  snap_users: number;
  snap_penetration_pct: number;
  youth_targeted_impressions: number;
  youth_impressions_per_young_voter: number;
  ads_targeting_minors: number;
  minor_impressions: number;
}

export interface SpendVsResult {
  party: string;
  spend_usd: number;
  impressions: number;
  result_pct: number;
  prev_pct: number;
  change_pp: number;
}

export interface Election {
  name: string;
  date: string;
  type: "parliamentary" | "local";
}

export interface Finding {
  id: string;
  title: string;
  body: string;
}
