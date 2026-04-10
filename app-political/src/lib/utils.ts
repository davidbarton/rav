export function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtNok(n: number): string {
  if (n >= 1_000_000) return `kr ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `kr ${(n / 1_000).toFixed(0)}K`;
  return `kr ${n.toLocaleString("nb-NO")}`;
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function fmtCpm(n: number): string {
  return `$${n.toFixed(2)}`;
}

const COUNTRY_NAMES: Record<string, string> = {
  norway: "Norway",
  sweden: "Sweden",
  denmark: "Denmark",
  finland: "Finland",
  "united states": "United States",
  "united kingdom": "United Kingdom",
  canada: "Canada",
  australia: "Australia",
  france: "France",
  germany: "Germany",
  netherlands: "Netherlands",
  belgium: "Belgium",
  austria: "Austria",
  switzerland: "Switzerland",
  india: "India",
  kuwait: "Kuwait",
  qatar: "Qatar",
  "united arab emirates": "UAE",
  "new zealand": "New Zealand",
  ireland: "Ireland",
  "south africa": "South Africa",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

const PARTY_COLORS: Record<string, string> = {
  "Høyre": "#0065BF",
  "Arbeiderpartiet": "#EF3340",
  "Miljøpartiet de Grønne": "#6CB534",
  "Venstre": "#007C5C",
  "Fremskrittspartiet": "#002776",
  "AUF": "#EF3340",
  "LO": "#C8102E",
};

export function partyColor(name: string): string {
  return PARTY_COLORS[name] ?? "#7891d4";
}
