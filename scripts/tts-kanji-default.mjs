/**
 * Pure logic for the emit-tts-deck.mjs "kanji-default synthesis" feature —
 * split out so it can be unit-tested without triggering emit-tts-deck.mjs's
 * top-level side effects (it reads the whole curriculum and writes deck
 * JSON to the sibling lingo-data repo the moment it's executed/imported).
 *
 * See emit-tts-deck.mjs's file-header doc for the full design rationale
 * (which key the app hashes, why sentence-level substitution is out of
 * scope here, why homophone resolution is "no-hyphen id wins" and not
 * JA_COURSE_ATOMS_BY_KANA's "last wins").
 */
import { readFileSync } from "node:fs";

// Kanji fields sometimes carry alternates ("川 / 河", "初め / 始め") — take
// the first, documented as a heuristic pick (same "pick one and use it"
// call Spencer already made for はし).
export const KANJI_ALT_SEP = /\s*\/\s*/;

// Words a lead has explicitly picked a kanji for that ISN'T (or wasn't, at
// authoring time) in courseAtoms — currently just はなたば, whose atom is
// `blocked: true` with no `kanji` field (courseAtoms.ts:1546); Spencer's
// pick from the 2026-09-15 TestFlight #93 fix is 花束. Layered OVER the
// courseAtoms-derived map, so a future atom-level kanji field for the same
// word would need to be reconciled here rather than silently ignored.
export const MANUAL_KANJI_OVERRIDES = {
  はなたば: "花束",
};

/**
 * Parse `courseAtoms.ts` source text into a kana → kanji default map, plus
 * a report of every homophone group it had to disambiguate (≥2 non-particle
 * atoms sharing a kana with different kanji).
 *
 * Exported separately from the file-reading wrapper below so a test can
 * feed it a synthetic source string with no filesystem I/O at all.
 */
export function resolveKanjiDefaults(courseAtomsSrc) {
  // Single-line object-literal capture, same constraint as every other
  // pattern in emit-tts-deck.mjs. Order matters: fields can appear in any
  // order within the braces, so this grabs id/kana/kanji/kind independently
  // rather than assuming a fixed field order.
  //
  // LINE-based, not `{[^{}]*}`-object-based: every courseAtoms.ts entry is
  // physically one line, but several entries embed a NESTED brace
  // (`conjugation: { class: "i-adj" }` — aoi, atsui, hayai, toru, hiku,
  // shimeru, … all have one), which makes a naive `[^{}]*` match stop at
  // the inner `}` and silently skip the whole outer atom. Splitting on
  // newlines and scanning each line independently sidesteps the nesting
  // problem entirely (found 2026-09-15: the object-based version resolved
  // only 4 of the 16 homophone groups, dropping あつい/とる/ふく/ひく/
  // はやい/しめる because each has a `conjugation` atom nearby).
  const byKana = new Map(); // kana -> [{id, kanji, kind, order}]
  let order = 0;
  for (const line of courseAtomsSrc.split("\n")) {
    const idM = line.match(/\bid:\s*"([^"]+)"/);
    const kanaM = line.match(/\bkana:\s*"([^"]+)"/);
    if (!idM || !kanaM) continue;
    const kanjiM = line.match(/\bkanji:\s*"([^"]+)"/);
    const kindM = line.match(/\bkind:\s*"([^"]+)"/);
    const kana = kanaM[1];
    if (!byKana.has(kana)) byKana.set(kana, []);
    byKana.get(kana).push({
      id: idM[1],
      kanji: kanjiM ? kanjiM[1] : null,
      kind: kindM ? kindM[1] : null,
      order: order++,
    });
  }

  const map = new Map(); // kana -> kanji (single, disambiguated)
  const report = [];
  for (const [kana, atoms] of byKana) {
    const candidates = atoms.filter((a) => a.kind !== "particle" && a.kanji);
    if (candidates.length === 0) continue;
    let winner;
    if (candidates.length === 1) {
      winner = candidates[0];
    } else {
      // Homophone group: prefer the atom whose id has no hyphen (the
      // "primary" naming convention — hashi vs hashi-bridge, kaze vs
      // kaze-wind, atsui vs atsui-hot/atsui-kind, …), tie-break by source
      // order. Deliberately NOT JA_COURSE_ATOMS_BY_KANA's "last wins" —
      // that would flip はし to 橋 and reverse Spencer's shipped pick.
      const noHyphen = candidates.filter((a) => !a.id.includes("-"));
      const pool = noHyphen.length > 0 ? noHyphen : candidates;
      winner = pool.reduce((best, a) => (a.order < best.order ? a : best));
      report.push({
        kana,
        picked: `${winner.id} → ${winner.kanji}`,
        rejected: candidates
          .filter((a) => a !== winner)
          .map((a) => `${a.id} → ${a.kanji}`),
      });
    }
    map.set(kana, winner.kanji.split(KANJI_ALT_SEP)[0]);
  }

  for (const [kana, kanji] of Object.entries(MANUAL_KANJI_OVERRIDES)) {
    map.set(kana, kanji);
  }

  return { map, report };
}

/** File-reading wrapper for CLI use; also prints the homophone report. */
export function buildKanjiDefaultMap(courseAtomsPath) {
  const src = readFileSync(courseAtomsPath, "utf-8");
  const { map, report } = resolveKanjiDefaults(src);

  if (report.length > 0) {
    console.log(
      `\nKanji-default: resolved ${report.length} homophone group(s) (primary-id, no-hyphen wins; tie-break = source order):`,
    );
    for (const r of report) {
      console.log(`  ${r.kana} → ${r.picked}  (not: ${r.rejected.join(", ")})`);
    }
    console.log(
      "  Review these picks — this is a heuristic, not a semantic judgment. " +
        "Override via MANUAL_KANJI_OVERRIDES in tts-kanji-default.mjs if any is wrong.\n",
    );
  }

  return map;
}

/**
 * Row-shape helper: `front` (kana) stays the hash key; `speech` (kanji) is
 * added ONLY when the kanji-default map resolves one for this exact string.
 * Never mutates `card`.
 */
export function withSpeech(card, kanjiDefaultMap) {
  const kanji = kanjiDefaultMap.get(card.front);
  return kanji ? { ...card, speech: kanji } : card;
}
