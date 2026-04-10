export function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function fmtEur(n: number): string {
  return `€${n.toLocaleString("en-US")}`;
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function countryName(code: string): string {
  const map: Record<string, string> = {
    at: "Austria",
    be: "Belgium",
    bg: "Bulgaria",
    cz: "Czechia",
    cy: "Cyprus",
    de: "Germany",
    dk: "Denmark",
    ee: "Estonia",
    el: "Greece",
    es: "Spain",
    fi: "Finland",
    fr: "France",
    hr: "Croatia",
    hu: "Hungary",
    ie: "Ireland",
    it: "Italy",
    lt: "Lithuania",
    lu: "Luxembourg",
    lv: "Latvia",
    mt: "Malta",
    nl: "Netherlands",
    pl: "Poland",
    pt: "Portugal",
    ro: "Romania",
    se: "Sweden",
    si: "Slovenia",
    sk: "Slovakia",
    tr: "Turkey",
  };
  return map[code] ?? code.toUpperCase();
}

const FORMAT_LABELS: Record<string, string> = {
  VIDEO: "Video",
  IMAGE: "Image",
  LENS_PACKAGE: "AR Lens",
  COLLECTION: "Collection Ad",
};

export function formatLabel(raw: string): string {
  return FORMAT_LABELS[raw] ?? raw;
}
