async function loadData() {
  const res = await fetch("./data/normalized.json");
  if (!res.ok) throw new Error("Missing data/normalized.json. Run build script.");
  return res.json();
}

function fmtNum(n) {
  return new Intl.NumberFormat("en-US").format(n || 0);
}

function fmtMoney(low, high) {
  return `€${fmtNum(Math.round(low))} - €${fmtNum(Math.round(high))}`;
}

function formatDateIso(iso) {
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  } catch (_e) {
    return iso || "-";
  }
}

function applyFilters(rows) {
  const q = document.getElementById("search").value.toLowerCase().trim();
  const cat = document.getElementById("category-filter").value;
  const hideUnknown = document.getElementById("hide-unknown").checked;
  return rows.filter((r) => {
    const blob = `${r.headline} ${r.brand} ${r.advertiser}`.toLowerCase();
    if (q && !blob.includes(q)) return false;
    if (cat !== "all" && r.category !== cat) return false;
    if (hideUnknown && r.unknown_category) return false;
    return true;
  });
}

function sortRows(rows) {
  const mode = document.getElementById("sort-by").value;
  const copy = [...rows];
  if (mode === "spend_desc") {
    copy.sort((a, b) => (b.est_spend_high_eur || 0) - (a.est_spend_high_eur || 0));
  } else if (mode === "risk_desc") {
    copy.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
  } else if (mode === "running_desc") {
    copy.sort((a, b) => (b.running_days || 0) - (a.running_days || 0));
  } else {
    copy.sort((a, b) => (b.impressions_total || 0) - (a.impressions_total || 0));
  }
  return copy;
}

function renderKPIs(data, rows) {
  const totalImpr = rows.reduce((a, b) => a + (b.impressions_total || 0), 0);
  const low = rows.reduce((a, b) => a + (b.est_spend_low_eur || 0), 0);
  const high = rows.reduce((a, b) => a + (b.est_spend_high_eur || 0), 0);
  const unknownRatio = rows.length ? (rows.filter((x) => x.unknown_category).length / rows.length) * 100 : 0;
  document.getElementById("kpi-ads").textContent = fmtNum(rows.length);
  document.getElementById("kpi-impressions").textContent = fmtNum(totalImpr);
  document.getElementById("kpi-spend").textContent = fmtMoney(low, high);
  document.getElementById("kpi-unknown").textContent = `${unknownRatio.toFixed(1)}%`;
}

function renderReadmeContext(data, ads) {
  const generatedAtEl = document.getElementById("readme-generated-at");
  const adsCountEl = document.getElementById("readme-ads-count");
  const sourceFilesEl = document.getElementById("readme-source-files");
  if (!generatedAtEl || !adsCountEl || !sourceFilesEl) return;

  const sourceFiles = (data.notes && data.notes.ads_source_files_used) || [];
  generatedAtEl.textContent = formatDateIso(data.generated_at_utc);
  adsCountEl.textContent = fmtNum(ads.length);
  sourceFilesEl.textContent = sourceFiles.length ? sourceFiles.join(", ") : "Not specified in dataset notes";
}

function renderLeaderboard(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.advertiser]) map[r.advertiser] = { ads: 0, impressions: 0, low: 0, high: 0 };
    map[r.advertiser].ads += 1;
    map[r.advertiser].impressions += r.impressions_total || 0;
    map[r.advertiser].low += r.est_spend_low_eur || 0;
    map[r.advertiser].high += r.est_spend_high_eur || 0;
  });
  const sorted = Object.entries(map).sort((a, b) => b[1].impressions - a[1].impressions);
  const tbody = document.querySelector("#leaderboard tbody");
  tbody.innerHTML = "";
  sorted.forEach(([name, v]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${name}</td><td>${v.ads}</td><td>${fmtNum(v.impressions)}</td><td>${fmtMoney(v.low, v.high)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderCategorySplit(rows) {
  const byCat = {};
  rows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + 1; });
  const list = document.getElementById("category-split");
  list.innerHTML = "";
  const total = rows.length || 1;
  Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
    const pct = ((n / total) * 100).toFixed(1);
    const row = document.createElement("div");
    row.innerHTML = `
      <div class="flex justify-between text-xs mb-1"><span>${cat}</span><span>${n} (${pct}%)</span></div>
      <div class="h-2 bg-slate-100 rounded"><div class="h-2 bg-teal-600 rounded" style="width:${pct}%"></div></div>
    `;
    list.appendChild(row);
  });
}

function renderSponsoredSnapshot(data) {
  const kpis = data.sponsored_kpis || {};
  document.getElementById("kpi-sponsored-rows").textContent = fmtNum(kpis.sponsored_rows || 0);
  document.getElementById("kpi-unique-creators").textContent = fmtNum(kpis.unique_creators || 0);
  document.getElementById("kpi-unique-sponsors").textContent = fmtNum(kpis.unique_sponsors || 0);

  const sponsorBody = document.querySelector("#top-sponsors tbody");
  sponsorBody.innerHTML = "";
  (kpis.top_sponsors || []).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="py-1">${row.sponsor_name}</td><td>${fmtNum(row.count)}</td>`;
    sponsorBody.appendChild(tr);
  });

  const creatorBody = document.querySelector("#top-creators tbody");
  creatorBody.innerHTML = "";
  (kpis.top_creators || []).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="py-1">${row.creator_name}</td><td>${fmtNum(row.count)}</td>`;
    creatorBody.appendChild(tr);
  });
}

function renderTable(rows) {
  const tbody = document.querySelector("#ads-table tbody");
  tbody.innerHTML = "";
  rows.forEach((r) => {
    const riskClass = r.risk_score >= 4 ? "text-red-700 font-semibold" : "text-slate-500";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.headline || "-"}</td>
      <td>${r.brand}</td>
      <td>${r.category} / ${r.sub_category}</td>
      <td>${r.running_days ?? "-"}d</td>
      <td>${fmtNum(r.impressions_total)}</td>
      <td>${fmtMoney(r.est_spend_low_eur, r.est_spend_high_eur)}</td>
      <td class="${riskClass}">${r.risk_score}/10 ${r.risk_flags.join(", ")}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderGallery(rows) {
  const wrap = document.getElementById("gallery-mode");
  wrap.innerHTML = "";
  rows.forEach((r) => {
    const el = document.createElement("article");
    el.className = "bg-white border rounded-xl p-3";
    el.innerHTML = `
      <div class="mb-2 text-xs"><span class="px-2 py-0.5 rounded-full bg-slate-100 mr-1">${r.brand}</span><span class="px-2 py-0.5 rounded-full bg-slate-100">${r.category}</span></div>
      <h4 class="font-medium text-sm mb-2">${r.headline || "No headline"}</h4>
      <p class="text-xs"><strong>Impr:</strong> ${fmtNum(r.impressions_total)}</p>
      <p class="text-xs"><strong>Spend:</strong> ${fmtMoney(r.est_spend_low_eur, r.est_spend_high_eur)}</p>
      <p class="text-xs"><strong>Running:</strong> ${r.running_days ?? "-"}d</p>
      <p class="text-xs"><strong>Risk:</strong> ${r.risk_score}/10 ${r.risk_flags.length ? "(" + r.risk_flags.join(", ") + ")" : ""}</p>
    `;
    wrap.appendChild(el);
  });
}

function setView() {
  const dash = document.getElementById("dashboard-view");
  const campaigns = document.getElementById("campaigns-view");
  const isDash = document.getElementById("tab-dashboard").classList.contains("active");
  dash.classList.toggle("hidden", !isDash);
  campaigns.classList.toggle("hidden", isDash);
}

async function main() {
  const data = await loadData();
  const ads = data.ads || [];
  document.getElementById("generated-at").textContent = `Dataset: ${formatDateIso(data.generated_at_utc)}`;
  renderReadmeContext(data, ads);
  const catSelect = document.getElementById("category-filter");
  [...new Set(ads.map((a) => a.category))].forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });

  const rerender = () => {
    const rows = sortRows(applyFilters(ads));
    renderKPIs(data, rows);
    renderLeaderboard(rows);
    renderCategorySplit(rows);
    renderSponsoredSnapshot(data);
    renderTable(rows);
    renderGallery(rows);
  };

  document.getElementById("tab-dashboard").onclick = () => {
    document.getElementById("tab-dashboard").classList.add("active");
    document.getElementById("tab-campaigns").classList.remove("active");
    setView();
  };
  document.getElementById("tab-campaigns").onclick = () => {
    document.getElementById("tab-campaigns").classList.add("active");
    document.getElementById("tab-dashboard").classList.remove("active");
    setView();
  };
  document.getElementById("mode-table").onclick = () => {
    document.getElementById("mode-table").classList.add("active");
    document.getElementById("mode-gallery").classList.remove("active");
    document.getElementById("table-mode").classList.remove("hidden");
    document.getElementById("gallery-mode").classList.add("hidden");
  };
  document.getElementById("mode-gallery").onclick = () => {
    document.getElementById("mode-gallery").classList.add("active");
    document.getElementById("mode-table").classList.remove("active");
    document.getElementById("gallery-mode").classList.remove("hidden");
    document.getElementById("table-mode").classList.add("hidden");
  };

  ["search", "category-filter", "hide-unknown", "sort-by"].forEach((id) => {
    document.getElementById(id).addEventListener("input", rerender);
    document.getElementById(id).addEventListener("change", rerender);
  });

  rerender();
}

main().catch((e) => {
  document.body.innerHTML = `<pre>Failed to load prototype data.\n${e.message}</pre>`;
});
