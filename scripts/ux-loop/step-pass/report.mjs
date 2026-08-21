// report.mjs — renders the step-pass findings into one self-contained HTML page.
// Grouped by step type; a card per viewport with its shot, the CONFIRMED
// (measurement-backed) findings, the taste queue, and the refuted count. Header
// carries the portfolio trust metric (the model's false-positive rate).

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KIND_LABEL = {
  "edge-bleed": "edge bleed", clipped: "clipped", "tap-target": "tap target",
  truncation: "truncation", overflow: "overflow", "cta-fold": "CTA fold", "reflow-on-submit": "reflow",
};
const SEV_ORDER = { notable: 0, minor: 1, polish: 2 };

function findingRow(f) {
  const sev = f.severity || "minor";
  const note = f.corroborated && f.claim ? ` — <span class="note">${esc(f.claim.suggestion || f.claim.issue)}</span>` : "";
  const flag = f.corroborated ? "" : ` <span class="miss" title="measured; the model did not mention it">model miss</span>`;
  return `<li class="f sev-${sev}"><span class="kind k-${f.kind}">${KIND_LABEL[f.kind] || f.kind}</span> <b>${esc(f.label)}</b> <span class="detail">${esc(f.detail)}</span>${flag}${note}</li>`;
}

function cellCard(c, rootRel) {
  const r = c.result;
  const err = c.measurement?.error;
  const misrouted = c.measurement?.misrouted;
  const confirmed = [...r.confirmed].sort((a, b) => (SEV_ORDER[a.severity] ?? 1) - (SEV_ORDER[b.severity] ?? 1));
  const clean = !err && !misrouted && confirmed.length === 0;
  const taste = r.taste || [];
  const seen = c.measurement?.seenType;
  return `<div class="card ${clean ? "clean" : ""} ${misrouted ? "misrouted" : ""}">
    <div class="card-h"><span class="vp">${esc(c.viewport)}</span>${clean ? '<span class="ok">✓ clean</span>' : ""}${misrouted ? `<span class="err">route fell back${seen ? ` → ${esc(seen)}` : " → home"}</span>` : ""}${err ? '<span class="err">probe error</span>' : ""}</div>
    <a href="${esc(rootRel)}" target="_blank"><img loading="lazy" src="${esc(rootRel)}" alt="${esc(c.stepType)} ${esc(c.viewport)}"></a>
    ${confirmed.length ? `<ul class="findings">${confirmed.map(findingRow).join("")}</ul>` : ""}
    ${taste.length ? `<div class="taste"><span class="t-h">taste queue</span>${taste.map((t) => `<span class="chip" title="${esc(t.suggestion || "")}">${esc(t.claim_kind)}: ${esc(t.area)}</span>`).join("")}</div>` : ""}
    ${r.refuted?.length ? `<div class="refuted">${r.refuted.length} model false-positive${r.refuted.length > 1 ? "s" : ""} dropped</div>` : ""}
  </div>`;
}

export function renderReport(agg) {
  const byType = {};
  for (const c of agg.cells) (byType[c.stepType] ??= []).push(c);

  const totalConfirmed = agg.cells.reduce((n, c) => n + c.result.confirmed.length, 0);
  const totalTaste = agg.cells.reduce((n, c) => n + c.result.taste.length, 0);
  const fpPct = (agg.trust.falsePositiveRate * 100).toFixed(0);

  // rank step types: most confirmed findings first
  const typeOrder = Object.entries(byType).sort(
    (a, b) => b[1].reduce((n, c) => n + c.result.confirmed.length, 0) - a[1].reduce((n, c) => n + c.result.confirmed.length, 0),
  );

  const sections = typeOrder.map(([stepType, cells]) => {
    const n = cells.reduce((m, c) => m + c.result.confirmed.length, 0);
    return `<section>
      <h2>${esc(stepType)} <span class="badge">${n} finding${n === 1 ? "" : "s"}</span> <span class="src">${esc(cells[0].lessonId)}</span></h2>
      <div class="grid">${cells.map((c) => cellCard(c, c.shot.split("/").slice(-2).join("/"))).join("")}</div>
    </section>`;
  }).join("\n");

  const misrouted = agg.misrouted?.length
    ? `<section class="missing"><h2>Route fell back — not measured (${agg.misrouted.length})</h2>
       <p>The <code>?step=N</code> route did not render a lesson stage (it fell back to /home — typically a course that isn't selectable yet, or a stale step index). Their geometry is some OTHER page and was excluded from findings.</p>
       <div class="chips">${agg.misrouted.map((m) => `<span class="chip">${esc(m.stepType)} <span style="opacity:.6">${esc(m.lessonId)}</span></span>`).join("")}</div></section>`
    : "";

  const missing = agg.missing?.length
    ? `<section class="missing"><h2>Unreachable via lesson deep-link (${agg.missing.length})</h2>
       <p>These step types are dynamic/engine-generated or live in modules past the shipped course, so no static <code>?step=N</code> route reaches them. Follow-up: source them from the practice surfaces or the review builder.</p>
       <div class="chips">${agg.missing.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div></section>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Step-Type UX Pass</title>
<style>
  :root { color-scheme: dark; --bg:#0d1117; --panel:#161b22; --panel2:#1c2230; --ink:#e6edf3; --dim:#8b949e; --line:#2a3441;
    --accent:#7ee787; --warn:#f0883e; --bad:#ff7b72; --taste:#a5a5ff; --font: ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:var(--font); line-height:1.45; }
  header { padding:28px 32px 20px; border-bottom:1px solid var(--line); position:sticky; top:0; background:linear-gradient(180deg,#0d1117,#0d1117f0); backdrop-filter:blur(6px); z-index:5; }
  h1 { margin:0 0 4px; font-size:20px; letter-spacing:-0.01em; }
  .sub { color:var(--dim); font-size:13px; }
  .metrics { display:flex; gap:28px; margin-top:14px; flex-wrap:wrap; }
  .metric { display:flex; flex-direction:column; }
  .metric b { font-size:24px; font-variant-numeric:tabular-nums; }
  .metric span { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--dim); }
  .metric.trust b { color: var(--accent); }
  main { padding:24px 32px 80px; max-width:1500px; }
  section { margin:0 0 34px; }
  h2 { font-size:15px; margin:0 0 12px; display:flex; align-items:center; gap:10px; text-transform:none; }
  .badge { font-size:11px; background:var(--panel2); border:1px solid var(--line); border-radius:20px; padding:2px 9px; color:var(--dim); }
  .src { font-size:11px; color:var(--dim); font-family:ui-monospace,monospace; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
  .card.clean { opacity:.62; }
  .card.misrouted { opacity:.5; border-color:#5a2a2a; }
  .card-h { display:flex; justify-content:space-between; align-items:center; padding:8px 11px; font-size:12px; border-bottom:1px solid var(--line); }
  .vp { color:var(--dim); font-family:ui-monospace,monospace; }
  .ok { color:var(--accent); font-size:11px; }
  .err { color:var(--bad); font-size:11px; }
  .card img { width:100%; display:block; background:#000; max-height:360px; object-fit:contain; object-position:top; }
  ul.findings { list-style:none; margin:0; padding:9px 11px; display:flex; flex-direction:column; gap:7px; }
  li.f { font-size:12.5px; line-height:1.4; padding-left:8px; border-left:2px solid var(--line); }
  li.f.sev-notable { border-left-color:var(--bad); }
  li.f.sev-minor { border-left-color:var(--warn); }
  li.f.sev-polish { border-left-color:var(--line); }
  .kind { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#0d1117; background:var(--warn); border-radius:4px; padding:1px 5px; margin-right:4px; }
  .k-overflow,.k-cta-fold,.k-clipped { background:var(--bad); }
  .k-tap-target,.k-truncation { background:var(--warn); }
  .k-edge-bleed,.k-reflow-on-submit { background:#e3b341; }
  .detail { color:var(--dim); }
  .note { color:var(--ink); opacity:.85; }
  .miss { font-size:10px; color:var(--dim); border:1px solid var(--line); border-radius:4px; padding:0 4px; }
  .taste { padding:0 11px 10px; display:flex; flex-wrap:wrap; gap:5px; align-items:center; }
  .t-h { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--taste); margin-right:2px; }
  .chip { font-size:11px; background:var(--panel2); border:1px solid var(--line); border-radius:6px; padding:2px 7px; color:var(--dim); }
  .taste .chip { border-color:#39395c; color:#b8b8e6; }
  .refuted { padding:6px 11px 10px; font-size:11px; color:var(--dim); }
  .missing p { color:var(--dim); font-size:13px; max-width:70ch; }
  .missing .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
  code { font-family:ui-monospace,monospace; background:var(--panel2); padding:1px 5px; border-radius:4px; font-size:12px; }
  a { color:inherit; }
</style></head>
<body>
<header>
  <h1>Step-Type UX Pass</h1>
  <div class="sub">${esc(agg.stamp)} · ${esc(agg.viewports.join(" · "))} · ${agg.typesRun.length} step types</div>
  <div class="metrics">
    <div class="metric"><b>${totalConfirmed}</b><span>confirmed findings</span></div>
    <div class="metric"><b>${totalTaste}</b><span>taste queue</span></div>
    <div class="metric trust"><b>${fpPct}%</b><span>model false-positive rate</span></div>
    <div class="metric"><b>${agg.trust.falsePositives}/${agg.trust.measurableClaims}</b><span>refuted / measurable claims</span></div>
  </div>
</header>
<main>
${sections}
${misrouted}
${missing}
</main>
</body></html>`;
}
