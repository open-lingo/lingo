// classify.mjs — the confirm/refute core of the step-type UX pass.
//
// DOCTRINE (same law as the doc-hygiene loop): the OBJECTIVE SIGNAL decides,
// the model never does. Here the objective signal is a DOM measurement
// (getBoundingClientRect geometry), and the vision model is a generator whose
// quotes are only allowed to:
//   - CORROBORATE a measured fact (attaches a human-readable description), or
//   - be REFUTED as a false positive when it names a MEASURABLE defect that no
//     measurement backs, or
//   - drop into the TASTE queue when it names something no measurement can
//     adjudicate (hierarchy, contrast, ...), for a frontier model to judge.
//
// A measured fact the model never mentioned is still a finding (a model MISS).
// Net: every confirmed finding is measurement-true; the model's contribution is
// description + taste, and we get a per-model false-positive rate for free.

// Kinds a DOM probe can adjudicate from a single static render.
export const MEASURABLE_KINDS = [
  "edge-bleed", // element flush against / past a screen edge
  "clipped", // element cut off by an ancestor or the viewport
  "tap-target", // interactive element under 24x24 CSS px
  "truncation", // text clipped with no scroll affordance
  "overflow", // the lesson stage scroller scrolls vertically
  "cta-fold", // primary CTA sits below the fold
];

// Kinds we cannot yet adjudicate mechanically — routed to the human/frontier
// taste queue rather than confirmed or refuted. reflow-on-submit lives here for
// now: measuring it faithfully needs each step type ANSWERED correctly first
// (per-step interaction), which a single static render can't do — clicking a
// raw CTA in an unanswered state produces phantom deltas (a scroll or a step
// advance read as a shift). Kept as an informational number in the probe.
export const TASTE_KINDS = [
  "reflow-on-submit",
  "hierarchy",
  "contrast",
  "spacing",
  "alignment",
  "consistency",
  "copy",
  "other",
];

// Ordered synonym table: first hit wins, so put the specific phrases first.
const KIND_PATTERNS = [
  ["tap-target", /tap[\s-]?target|hit area|tap area|too small to tap|touch target/i],
  ["cta-fold", /below[\s-]?(the[\s-]?)?fold|off[\s-]?screen cta|cta.*(cut|hidden|fold)/i],
  ["reflow-on-submit", /reflow|shifts?|moves? (on|when)|jumps? (on|when)|layout shift/i],
  ["clipped", /clip|cut ?off|cropped|cut by|hidden by (the )?edge|overlap(ped)? by|behind the (notch|island)/i],
  ["edge-bleed", /flush|bleed|touch(ing|es)? the (edge|border|screen)|against the (edge|border)|no margin|hugs the edge/i],
  ["truncation", /truncat|ellipsis|…|text (is )?cut|overflow(s|ing)? (its )?(box|container|line)/i],
  ["overflow", /overflow|scrolls? vertically|content (is )?too tall|spills? below|does ?n.?t fit|exceeds the (stage|screen|card)/i],
  // taste
  ["hierarchy", /hierarch|primary action|unclear (which|what)|emphasis|prominence/i],
  ["contrast", /contrast|hard to read|legibilit|washed out|faint/i],
  ["spacing", /spacing|cramped|too (tight|loose)|padding|whitespace|breathing room/i],
  ["alignment", /align|misaligned|off[\s-]?center|centering|uneven margin/i],
  ["consistency", /inconsistent|mismatch(ed)?|different (radius|size|corner)|radii/i],
  ["copy", /wording|copy|label text|typo|phrasing/i],
];

export function canonicalizeKind(raw = "", issueText = "") {
  const hay = `${raw} ${issueText}`;
  if (MEASURABLE_KINDS.includes(raw)) return raw;
  if (TASTE_KINDS.includes(raw)) return raw;
  for (const [kind, re] of KIND_PATTERNS) if (re.test(hay)) return kind;
  return "other";
}

// severity buckets from a raw magnitude, per measurable kind.
function severityFor(kind, m) {
  switch (kind) {
    case "tap-target": {
      const small = Math.min(m.w ?? 24, m.h ?? 24);
      return small < 16 ? "notable" : small < 22 ? "minor" : "polish";
    }
    case "edge-bleed":
      return (m.gap ?? 0) <= 0 ? "notable" : (m.gap ?? 0) < 4 ? "minor" : "polish";
    case "clipped":
      return (m.overBy ?? 0) >= 8 ? "notable" : (m.overBy ?? 0) >= 2 ? "minor" : "polish";
    case "truncation":
      return (m.over ?? 0) >= 24 ? "notable" : (m.over ?? 0) >= 6 ? "minor" : "polish";
    case "overflow":
      return m >= 120 ? "notable" : m >= 24 ? "minor" : "polish";
    case "cta-fold":
      return "notable";
    case "reflow-on-submit":
      return m >= 8 ? "notable" : m >= 2 ? "minor" : "polish";
    default:
      return "minor";
  }
}

// Turn a raw DOM probe result into a flat list of normalized findings.
export function factsFromMeasurement(mo = {}) {
  const facts = [];
  for (const t of mo.smallTapTargets ?? [])
    facts.push({ kind: "tap-target", label: t.label || "(button)", detail: `${t.w}×${t.h}px`, severity: severityFor("tap-target", t), magnitude: Math.min(t.w, t.h) });
  for (const e of mo.edgeBleed ?? [])
    facts.push({ kind: "edge-bleed", label: e.label || "(element)", detail: `${e.gap}px from ${e.edge} edge`, severity: severityFor("edge-bleed", e), magnitude: -(e.gap ?? 0) });
  for (const c of mo.clipped ?? [])
    facts.push({ kind: "clipped", label: c.label || "(element)", detail: `${c.overBy}px past its bounds`, severity: severityFor("clipped", c), magnitude: c.overBy });
  for (const t of mo.truncations ?? [])
    facts.push({ kind: "truncation", label: t.label || "(text)", detail: `+${t.over}px clipped`, severity: severityFor("truncation", t), magnitude: t.over });
  if ((mo.stageOverflow ?? 0) > 0)
    facts.push({ kind: "overflow", label: "lesson stage", detail: `scrolls ${mo.stageOverflow}px`, severity: severityFor("overflow", mo.stageOverflow), magnitude: mo.stageOverflow });
  if (mo.ctaBelowFold)
    facts.push({ kind: "cta-fold", label: "primary CTA", detail: "below the fold", severity: "notable", magnitude: 1 });
  // reflow-on-submit is NOT emitted as a confirmed fact — see TASTE_KINDS. The
  // raw number rides along in the probe JSON for reference only.
  return facts;
}

const STOP = new Set(["the", "a", "an", "of", "is", "its", "it", "on", "to", "and", "with", "in", "at", "by", "too", "that", "this", "looks"]);
const tokens = (s = "") =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));

// Fuzzy area match: token overlap between the claim's area+issue and a fact's
// label. Deliberately lax — the same defect gets named many ways ("gems pill",
// "the gems counter"); a single shared content token is enough to link them.
function areaMatches(claim, fact) {
  const a = new Set([...tokens(claim.area), ...tokens(claim.issue)]);
  const b = tokens(fact.label);
  if (b.length === 0) return true; // unlabeled fact (e.g. stage/CTA) — kind match carries it
  return b.some((w) => a.has(w));
}

// A claim that says nothing actionable: a reassurance that something is FINE,
// the kind-name dumped into the issue field, or an empty issue. These are model
// output noise, not false positives — dropped before scoring so the trust
// metric reflects real over-claims, not filler.
const REASSURANCE_RE = /\b(large enough|big enough|looks? fine|no (issue|problem|margin|concern)|comfortabl|adequate|sufficient|acceptable|well[-\s]spaced|appropriately|not? (an? )?(issue|problem)|is fine|are fine)\b/i;
export function isVacuousClaim(claim) {
  const issue = (claim.issue || "").trim();
  if (issue.length < 6) return true;
  if ([...MEASURABLE_KINDS, ...TASTE_KINDS].includes(issue.toLowerCase())) return true;
  return REASSURANCE_RE.test(issue);
}

export function classify({ claims = [], measurement = {} }) {
  const facts = factsFromMeasurement(measurement);
  const kept = claims.filter((c) => !isVacuousClaim(c));
  const vacuous = claims.length - kept.length;
  const canon = kept.map((c) => ({ ...c, kind: canonicalizeKind(c.claim_kind, c.issue) }));

  const measurableClaims = canon.filter((c) => MEASURABLE_KINDS.includes(c.kind));
  const tasteClaims = canon.filter((c) => TASTE_KINDS.includes(c.kind));

  const usedClaims = new Set();
  const confirmed = facts.map((fact) => {
    // best corroborating claim: same kind AND area overlap, not already used
    const claim = measurableClaims.find(
      (c) => !usedClaims.has(c) && c.kind === fact.kind && areaMatches(c, fact),
    );
    if (claim) usedClaims.add(claim);
    return { ...fact, corroborated: !!claim, claim: claim ?? null };
  });

  const refuted = measurableClaims.filter((c) => !usedClaims.has(c));

  const corroboratedCount = confirmed.filter((f) => f.corroborated).length;
  const stats = {
    measuredFindings: facts.length,
    measurableClaims: measurableClaims.length,
    corroborated: corroboratedCount,
    modelMisses: facts.length - corroboratedCount,
    falsePositives: refuted.length,
    falsePositiveRate: measurableClaims.length ? refuted.length / measurableClaims.length : 0,
    tasteCount: tasteClaims.length,
    vacuous,
  };

  return { confirmed, refuted, taste: tasteClaims, stats };
}
