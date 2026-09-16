/**
 * Preloaded accepted readings for a speaking step (TestFlight #171).
 *
 * Spencer, iPhone 16 Pro Max / build 20: *"I think we need to pre-load the
 * accepted readings onto the lesson so the exact moment they say the word
 * fully it is marked as correct."*
 *
 * Two jobs, both of which have to happen BEFORE the recognizer opens the mic:
 *
 *  1. **Tell the recognizer what to expect.** `SFSpeechAudioBufferRecognitionRequest`
 *     takes `contextualStrings` — a small vocabulary hint that biases the
 *     language model towards phrases it would otherwise rank below a common
 *     homophone. The target phrase is known at mount; not handing it over is
 *     leaving free accuracy on the table, and it is most of why a short
 *     katakana word like テレビ came back as something else entirely.
 *
 *  2. **Decide the verdict on a PARTIAL.** The old flow graded only the final
 *     result, which arrives after our own 1.6 s silence endpoint — so the
 *     learner said the word, watched the mic stay open, and only then saw
 *     "Perfect!". With the accepted set precomputed, an interim hypothesis can
 *     be matched against it synchronously (a `Set` lookup plus a bounded edit
 *     distance) and the step can close the mic the instant the word lands.
 *
 * The critical property is that matching must be SYNCHRONOUS. The Japanese
 * grading path converts kanji→kana through kuroshiro, which is a dynamic
 * import of ~12 MB of kuromoji dictionary and an async call per alternative —
 * far too heavy to run against every partial. It is also unnecessary here: the
 * kanji surface itself is one of the accepted forms, so a kanji transcript
 * matches by string equality without any analyzer in the loop.
 *
 * Everything in this module is ADDITIVE. Each entry is an extra way to spell
 * the SAME target, derived from that one target, so it can only turn a false
 * fail into a pass — it never introduces an equivalence between two different
 * words. (That is the reason long vowels are handled by generating variants of
 * the target rather than by collapsing vowels on both sides: collapsing would
 * merge おばさん and おばあさん, which are different people.)
 */
import {
  normalizeForCompare,
  normalizeGeneric,
  normalizeTarget,
  numbersToKorean,
  numbersToRomance,
} from "./loose-match";

/** Prolonged sound mark. Katakana-only orthography, survives every existing
 *  normalizer (it is outside the U+30A1..U+30F6 fold range and is not
 *  punctuation), so コーヒー and こうひい never met. */
const CHOONPU = "ー";

/**
 * Vowel each hiragana mora ends on — what `ー` stands in for.
 * Small kana are included because a yōon (きょ) carries the vowel of its
 * small partner: きょー is きょお, not きょよ.
 */
const VOWEL_OF: Readonly<Record<string, string>> = (() => {
  const rows: Array<[string, string]> = [
    ["あ", "あかがさざただなはばぱまやゃらわぁゕゎ"],
    ["い", "いきぎしじちぢにひびぴみりゐぃ"],
    ["う", "うくぐすずつづぬふぶぷむゆゅるぅっ"],
    ["え", "えけげせぜてでねへべぺめれゑぇゖ"],
    ["お", "おこごそぞとどのほぼぽもよょろをぉ"],
  ];
  const map: Record<string, string> = {};
  for (const [vowel, members] of rows) {
    for (const ch of members) map[ch] = vowel;
  }
  return map;
})();

/**
 * Expand `ー` to the vowel of the mora before it, so コーヒー → こおひい once
 * katakana has been folded to hiragana.
 *
 * Deterministic and applied to BOTH sides of the comparison, so it cannot
 * merge two distinct words: the only strings it brings together are two
 * spellings of one long vowel.
 */
export function expandChoonpu(kana: string): string {
  if (!kana.includes(CHOONPU)) return kana;
  let out = "";
  for (const ch of kana) {
    if (ch !== CHOONPU) {
      out += ch;
      continue;
    }
    const prev = out.at(-1);
    out += (prev && VOWEL_OF[prev]) || "";
  }
  return out;
}

/**
 * Alternative long-vowel spellings of ONE form.
 *
 * Japanese writes a long /o:/ as おう (とうきょう) and a long /e:/ as えい
 * (せんせい), but a recognizer transcribing speech may render either as the
 * doubled vowel, and our own choonpu expansion produces the doubled form from
 * katakana. Generating both spellings of the target is additive; folding them
 * on the transcript side would not be.
 */
export function longVowelVariants(kana: string): string[] {
  const swap = (s: string, row: string, written: string, doubled: string) =>
    s.replace(new RegExp(`(.)${written}`, "g"), (m, prev: string) =>
      VOWEL_OF[prev] === row ? prev + doubled : m,
    );
  const out = new Set<string>([kana]);
  // The long vowel is spelled <o-row kana> + う (とうきょう), not literally
  // おう — the vowel that is being held belongs to the mora BEFORE the う.
  out.add(swap(kana, "お", "う", "お"));
  out.add(swap(kana, "お", "お", "う"));
  out.add(swap(kana, "え", "い", "え"));
  out.add(swap(kana, "え", "え", "い"));
  return [...out];
}

export type AcceptedFormsInput = {
  /** The authored target — the surface printed on the card. */
  target: string;
  /** Course language: "ja" | "ko" | "es" | "fr" | … */
  lang: string;
  /**
   * Kana reading(s) of the target, when the step carries them. JA speaking
   * steps ship `targetAnnotation`, whose segments hold `reading` per surface;
   * the caller joins those into whole-phrase readings.
   */
  readings?: readonly string[];
  /** Author-listed whole-phrase alternates (`SpeakingStep.alsoAccepted`). */
  alsoAccepted?: readonly string[];
  /** Perfect-tier dial (`?speech-perfect`). Drives the interim edit budget. */
  perfectThreshold?: number;
};

export type AcceptedForms = {
  lang: string;
  target: string;
  /**
   * Raw surfaces handed to the native request as `contextualStrings`.
   * Display forms only — romaji is deliberately absent, because hinting Latin
   * text to a `ja-JP` recognizer biases it towards transcribing in Latin.
   */
  contextual: string[];
  /** Normalized keys, for O(1) interim matching. */
  keys: ReadonlySet<string>;
  /** Maximum edit distance an interim may sit from an accepted key. */
  editBudget: number;
};

export type AcceptedMatch = {
  /** The accepted key that matched. */
  key: string;
  /** 0 for an exact normalized match. */
  distance: number;
};

/**
 * Apple's guidance is "a small number of short phrases"; the list is a bias,
 * and a long one dilutes itself. We never approach this in practice (a target
 * yields 2–6 forms) — it is a ceiling on author-listed alternates.
 */
const MAX_CONTEXTUAL = 12;

/** Never run the DP on pathological input — an interim this long is not a
 *  near-match for a lesson target either way. */
const MAX_DISTANCE_LEN = 96;

/**
 * Edits tolerated on an interim match, derived from the existing perfect-tier
 * dial rather than invented: at the default 0.85 a 10-mora phrase tolerates
 * one substitution, a 20-mora sentence two.
 *
 * Short targets get ZERO. A 2–3 character word is the case where a single edit
 * is another word (かき / かぎ), and it is also the case the founder is asking
 * about — テレビ has to be right, not nearly right, and it is short enough that
 * requiring exactness costs nothing.
 */
export function interimEditBudget(len: number, perfectThreshold: number): number {
  if (len <= 3) return 0;
  return Math.min(2, Math.max(1, Math.floor(len * (1 - perfectThreshold))));
}

/** Levenshtein distance, bailing out once every cell exceeds `budget`. */
export function boundedEditDistance(a: string, b: string, budget: number): number {
  if (a === b) return 0;
  if (budget <= 0) return Infinity;
  const ac = [...a];
  const bc = [...b];
  if (ac.length > MAX_DISTANCE_LEN || bc.length > MAX_DISTANCE_LEN) return Infinity;
  if (Math.abs(ac.length - bc.length) > budget) return Infinity;

  let prev = Array.from({ length: bc.length + 1 }, (_, j) => j);
  for (let i = 1; i <= ac.length; i++) {
    const row = new Array<number>(bc.length + 1);
    row[0] = i;
    let best = row[0];
    for (let j = 1; j <= bc.length; j++) {
      const cost = ac[i - 1] === bc[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > budget) return Infinity;
    prev = row;
  }
  return prev[bc.length];
}

/**
 * Every normalized spelling of one candidate string.
 *
 * JA runs BOTH normalizers on purpose. `normalizeTarget` is the plain fold
 * (katakana→hiragana, punctuation, case) and is what an authored form should
 * key as; `normalizeForCompare` is the transcript-side normalizer (fillers,
 * romaji, inverse-text-normalized numbers) and is what the recognizer's output
 * will key as. Indexing accepted forms under both guarantees a form always
 * matches itself, whichever side it arrived from.
 */
function normalizedKeys(s: string, target: string, lang: string): string[] {
  const trimmed = (s ?? "").trim();
  if (!trimmed) return [];
  if (lang !== "ja") {
    const folded = normalizeGeneric(
      numbersToRomance(numbersToKorean(trimmed, target), target),
    );
    return folded ? [folded] : [];
  }
  const out = new Set<string>();
  for (const base of [normalizeTarget(trimmed), normalizeForCompare(trimmed, target)]) {
    if (!base) continue;
    for (const variant of longVowelVariants(expandChoonpu(base))) {
      if (variant) out.add(variant);
    }
  }
  return [...out];
}

/**
 * Compute the full accepted set for a speaking target. Cheap and synchronous —
 * call it at MOUNT, before the recognizer exists, so both the native request
 * and the first partial already have it.
 */
export function buildAcceptedForms(input: AcceptedFormsInput): AcceptedForms {
  const { target, lang, readings = [], alsoAccepted = [], perfectThreshold = 0.85 } = input;

  // Order matters: the target leads the contextual hint, alternates follow.
  const surfaces: string[] = [];
  const pushSurface = (s: string | undefined | null) => {
    const v = (s ?? "").trim();
    if (v && !surfaces.includes(v)) surfaces.push(v);
  };
  pushSurface(target);
  for (const r of readings) pushSurface(r);
  for (const a of alsoAccepted) pushSurface(a);
  if (lang === "ja") {
    // The kana fold of a katakana target is a legitimate thing to say and a
    // legitimate thing for the recognizer to return (テレビ → てれび), and it is
    // exactly what the founder's #171 screenshot shows under "YOU SAID".
    const folded = normalizeTarget(target);
    if (folded && folded !== target) pushSurface(folded);
  }

  const keys = new Set<string>();
  for (const s of surfaces) {
    for (const k of normalizedKeys(s, target, lang)) keys.add(k);
  }

  // The budget follows the SHORTEST accepted key: a phrase that can be said in
  // three morae must be said exactly, even if a longer polite alternate is
  // also accepted.
  let shortest = Infinity;
  for (const k of keys) shortest = Math.min(shortest, [...k].length);
  const editBudget = Number.isFinite(shortest)
    ? interimEditBudget(shortest, perfectThreshold)
    : 0;

  return {
    lang,
    target,
    contextual: surfaces.slice(0, MAX_CONTEXTUAL),
    keys,
    editBudget,
  };
}

/**
 * Match one hypothesis (interim OR final) against the preloaded set.
 *
 * Returns the matching key, or null. Callers treat a non-null result as
 * `perfect` — the learner said one of the forms the lesson accepts, which is a
 * stronger signal than any char-overlap score, and it is what makes the
 * verdict land mid-utterance instead of after the endpoint timer.
 */
export function matchAcceptedForm(
  transcript: string,
  forms: AcceptedForms,
): AcceptedMatch | null {
  const probes = normalizedKeys(transcript, forms.target, forms.lang);
  if (probes.length === 0) return null;

  for (const probe of probes) {
    if (forms.keys.has(probe)) return { key: probe, distance: 0 };
  }
  if (forms.editBudget <= 0) return null;

  let best: AcceptedMatch | null = null;
  for (const probe of probes) {
    for (const key of forms.keys) {
      const d = boundedEditDistance(probe, key, forms.editBudget);
      if (d <= forms.editBudget && (best === null || d < best.distance)) {
        best = { key, distance: d };
      }
    }
  }
  return best;
}

/**
 * Best accepted match across an N-best list. The native plugin forwards every
 * `SFTranscription`, and the form the learner actually said is regularly the
 * second or third — scoring only the top hypothesis threw those away.
 */
export function matchAcceptedAlternatives(
  alternatives: ReadonlyArray<{ transcript: string }>,
  forms: AcceptedForms,
): { transcript: string; match: AcceptedMatch } | null {
  let best: { transcript: string; match: AcceptedMatch } | null = null;
  for (const alt of alternatives) {
    const match = matchAcceptedForm(alt.transcript, forms);
    if (!match) continue;
    if (best === null || match.distance < best.match.distance) {
      best = { transcript: alt.transcript, match };
    }
    if (match.distance === 0) break;
  }
  return best;
}
