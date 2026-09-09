/**
 * Formation-distractor generator (Task 5) — extracted from trainerSession.ts
 * into a PURE leaf module (imports only the conjugation tables/engine) so the
 * lesson-side `conjugationCloze` factory (grammarHelpers.ts) can use it
 * without the trainer's SRS/localStorage dependency chain — importing
 * trainerSession there closed an import cycle (grammarHelpers →
 * trainerSession → grammarSrs → lessonAtomIndex → language registry →
 * curriculum → grammarHelpers) that left the factory undefined at runtime.
 *
 * Still the SINGLE source: trainerSession re-exports it, and every consumer
 * (trainer sessions, ConjugationPracticePage, conjugationCloze) shares this
 * one implementation. Do not duplicate.
 */
import { VERB_ENTRIES, ADJ_ENTRIES, type VerbGroup } from "../conjugationTables";
import {
  conjugateVerb,
  conjugateIAdj,
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";

// Distractors are SAME-VERB, SAME-ENDING-FAMILY rule misapplications: every
// option shares the verb's stem AND the target form's ending shape, so only
// formation knowledge (not surface pattern-matching) separates them. The old
// same-form-OTHER-verb path is retired for verbs — it let learners solve by
// elimination ("the only one starting with み and ending in ない").

/** う → あ *without* the う → わ exception — the classic beginner nai error. */
const U_TO_A_NAIVE: Record<string, string> = {
  う: "あ",
  く: "か",
  ぐ: "が",
  す: "さ",
  つ: "た",
  ぬ: "な",
  ぶ: "ば",
  む: "ま",
  る: "ら",
};

/** う-row → え-row, for the potential's double-conjugation slip (のめられる). */
const U_TO_E_ROW: Record<string, string> = {
  う: "え",
  く: "け",
  ぐ: "げ",
  す: "せ",
  つ: "て",
  ぬ: "ね",
  ぶ: "べ",
  む: "め",
  る: "れ",
};

/** The stacked members that share a target form's ending family. */
function verbFamilyMembers(form: ChainForm): ChainForm[] {
  switch (form) {
    case "masu":
    case "masu-neg":
    case "masu-past":
    case "masu-past-neg":
      return ["masu", "masu-neg", "masu-past", "masu-past-neg"];
    case "nai":
    case "nai-past":
      return ["nai", "nai-past"];
    case "tai":
    case "tai-neg":
    case "tai-past":
    case "tai-neg-past":
      return ["tai", "tai-neg", "tai-past", "tai-neg-past"];
    case "te":
      return ["te"];
    case "ta":
      return ["ta"];
    case "volitional":
      return ["volitional"];
    case "ba":
      return ["ba"];
    case "potential":
      return ["potential"];
    case "tara":
      return ["tara"];
    case "imperative":
      return ["imperative"];
    case "prohibitive":
      return ["prohibitive"];
    case "causative":
      return ["causative"];
    case "passive":
      return ["passive"];
  }
}

/** The plain suffix bolted onto a stem — also the attach-to-dictionary tail. */
const CHAIN_SUFFIX: Record<ChainForm, string> = {
  masu: "ます",
  "masu-neg": "ません",
  "masu-past": "ました",
  "masu-past-neg": "ませんでした",
  te: "て",
  ta: "た",
  nai: "ない",
  tai: "たい",
  "nai-past": "なかった",
  "tai-neg": "たくない",
  "tai-past": "たかった",
  "tai-neg-past": "たくなかった",
  // Not the real godan ending (おう varies by row) — same simplification as
  // て/た above: this is only the attach-to-dictionary error shape (のむよう),
  // which also happens to be the classic godan-as-ichidan mistake.
  volitional: "よう",
  // Naive attach: ば bolted straight onto the dictionary form (のむば),
  // skipping the え-row shift entirely — same simplification as て/た/volitional.
  ba: "ば",
  // Naive attach: られる bolted onto the dictionary form (のむられる) — the
  // godan-as-ichidan error m24 L1 warns about; same simplification as ば.
  potential: "られる",
  // Naive attach: たら on the dictionary form (のむたら), skipping the た-form
  // sound change entirely.
  tara: "たら",
  // Naive attach: ろ bolted onto the dictionary form (のむろ) — the
  // godan-as-ichidan error, same shape as potential's られる.
  imperative: "ろ",
  // The correct answer already IS "dictionary + な" for every class, so this
  // naive-attach candidate always collides with `correct` and drops out —
  // prohibitive's distractors come entirely from wrongSoundChangeCandidates'
  // wrong-STEM (not wrong-suffix) slips below.
  prohibitive: "な",
  // Naive attach: させる bolted onto the dictionary form (のむさせる).
  causative: "させる",
  // Naive attach: られる bolted onto the dictionary form (のむられる) — same
  // shape as potential's naive attach, and deliberately the same string (both
  // are "skip the stem change, keep られる"); the two forms' distractor pools
  // stay separate because this map is only ever read for its own `form` key.
  passive: "られる",
};

/** Wrong sound-change candidates (te/ta/nai/volitional families, godan/ichidan verbs). */
function wrongSoundChangeCandidates(
  dictionary: string,
  group: VerbGroup,
  form: ChainForm,
): string[] {
  // ba / potential / tara / prohibitive / passive irregular slips are
  // hand-authored below. imperative/causative don't need a branch here —
  // する/くる already get 3 distinct candidates from the wrong-class +
  // attach-to-dictionary steps in generateFormationDistractors, so an early
  // return for those two forms costs nothing. Every other form has no
  // irregular sound-change candidates today.
  if (
    group === "irregular" &&
    form !== "ba" &&
    form !== "potential" &&
    form !== "tara" &&
    form !== "prohibitive" &&
    form !== "passive"
  )
    return [];
  const base = dictionary.slice(0, -1);
  const masuStem = conjugateVerb(dictionary, group, "masu").slice(0, -2); // drop ます
  const out: string[] = [];
  if (form === "te" || form === "ta" || form === "tara") {
    const tail = form === "tara" ? "ら" : "";
    if (group === "irregular") {
      // くる → きた／したら is suppletive; the slips keep the wrong stem.
      const prefix = dictionary === "くる" ? "" : dictionary.slice(0, -2);
      if (dictionary === "くる") out.push("くったら", "くたら", "こたら");
      else out.push(prefix + "すったら", prefix + "すたら", prefix + "しったら");
      return out;
    }
    const rows = form === "te" ? ["って", "んで", "いて", "いで", "して"] : ["った", "んだ", "いた", "いだ", "した"];
    for (const r of rows) out.push(base + r + tail);
    out.push(masuStem + (form === "te" ? "て" : "た") + tail); // のむ → のみて／のみたら
  } else if (form === "potential") {
    if (dictionary === "くる") {
      out.push("これる"); // ら抜き — the れる shortcut applied to こ-
      out.push("きられる"); // ます-stem confused for the potential stem
      out.push("くられる"); // dictionary stem kept (godan-as-ichidan style)
    } else if (group === "irregular") {
      const prefix = dictionary.slice(0, -2);
      out.push(prefix + "しられる"); // ます-stem + られる (する has no potential; it's できる)
      out.push(prefix + "すれる"); // え-row slide applied to する as if godan
      out.push(prefix + "される"); // passive confused for the potential
    } else if (group === "godan") {
      const last = dictionary.slice(-1);
      out.push(base + (U_TO_E_ROW[last] ?? last) + "られる"); // のめられる — double-conjugated
      out.push(masuStem + "れる"); // のみれる — ます-stem confused for the え-row stem
      out.push(masuStem + "られる"); // のみられる — ます-stem + ichidan ending
    } else {
      out.push(base + "れる"); // たべれる — ら抜き (the え-row rule applied to a る-verb)
      out.push(base + "られれる"); // たべられれる — double-conjugated
      out.push(base + "える"); // たべえる — え-row bolted on after dropping る
    }
  } else if (form === "nai" || form === "nai-past") {
    const tail = form === "nai-past" ? "なかった" : "ない";
    if (group === "godan") {
      const last = dictionary.slice(-1);
      out.push(base + (U_TO_A_NAIVE[last] ?? last) + tail); // かう → かあない
    }
    out.push(masuStem + tail); // のむ → のみない
  } else if (form === "volitional") {
    if (group === "godan") {
      const last = dictionary.slice(-1);
      out.push(base + (U_TO_A_NAIVE[last] ?? last) + "う"); // のむ → のまう (ない-row, wrong row)
    } else {
      out.push(base + "おう"); // たべる → たべおう (godan's おう ending mistakenly kept)
    }
    out.push(masuStem + "よう"); // のむ → のみよう (ます-stem confused for the volitional stem)
  } else if (form === "ba") {
    if (group === "godan") {
      out.push(dictionary + "れば"); // のむ → のむれば (godan-as-ichidan: れば bolted onto the whole word)
      out.push(masuStem + "れば"); // のむ → のみれば (ます-stem confused for the ば-stem)
    } else if (group === "ichidan") {
      out.push(base + "ば"); // たべる → たべば (ichidan-as-godan: drop る, skip the え-row change)
      out.push(base + "らば"); // たべる → たべらば (ない-row mistakenly carried into ば)
    } else if (dictionary === "くる") {
      out.push(masuStem + "れば"); // くる → きれば (ichidan's れば ending kept on the wrong stem)
      out.push(base + "ば"); // くる → くば (drop る, skip the え-row change, godan-as-ichidan style)
    } else {
      // する family: even a plain-する compound keeps this shape (prefix + し／す).
      out.push(masuStem + "ば"); // する → しば (ます-stem naive attach)
      out.push(base + "ば"); // する → すば (drop る, skip the え-row change)
    }
  } else if (form === "imperative") {
    // Wrong-class (godan/ichidan cross-application, in the caller) plus
    // attach-to-dictionary already give irregular verbs 3 distinct
    // candidates — nothing to hand-add here.
    if (group === "godan") {
      out.push(masuStem + "ろ"); // のみろ — ichidan's ろ bolted onto the ます-stem
    } else if (group !== "irregular") {
      // ichidan
      out.push(base + "え"); // たべえ — bare え-row shift, missing the extra ろ
    }
  } else if (form === "prohibitive") {
    // Correct = dictionary + な for every class, so wrong-class and
    // attach-to-dictionary (both in the caller) always recompute the exact
    // same string and drop out silently. Every candidate here is instead a
    // wrong-STEM attach — な bolted onto a stem other than the plain
    // dictionary form.
    out.push(masuStem + "な"); // のみな／たべな — ます-stem + な
    out.push(conjugateVerb(dictionary, group, "imperative") + "な"); // のめな／たべろな — imperative-stem + な
    out.push(conjugateVerb(dictionary, group, "ta") + "な"); // のんだな／たべたな — た-stem + な
  } else if (form === "causative") {
    // Irregular (する family, くる) already gets 3 distinct candidates from
    // wrong-class + attach-to-dictionary — nothing to hand-add here.
    if (group === "godan") {
      out.push(masuStem + "せる"); // のみせる — ます-stem confused for the causative stem
      // Robust even for す-ending verbs (けす, かす), where the wrong-class
      // candidate coincidentally EQUALS correct — さ + せる is literally the
      // string "させる", so base+"させる" (wrong-class, ichidan-shaped) and
      // base+U_TO_A["す"]+"せる" (correct) collide and drop out.
      out.push(conjugateVerb(dictionary, "godan", "potential")); // けせる-shaped confusion
    } else if (group !== "irregular") {
      // ichidan
      out.push(base + "せる"); // たべせる — godan's せる suffix wrongly applied, dropping さ
    }
  } else if (form === "passive") {
    // Potential and passive are BYTE-IDENTICAL for ichidan verbs and for
    // くる (both reduce to stem + られる) — pushing `potential`'s own value
    // here is deliberate: when it differs (godan, する) it's a genuine
    // formation-confusion distractor; when it's identical to `correct` the
    // caller's dedupe (seen.has(correct)) drops it silently, so a passive
    // question can never offer its own correct answer as a decoy, and the
    // reverse holds for `generateFormationDistractors(..., "potential", ...)`
    // — it never reaches for the passive value at all.
    if (group === "irregular") {
      out.push(masuStem + "られる"); // しられる／きられる — ます-stem + られる
      out.push(conjugateVerb(dictionary, group, "potential")); // できる (real slip) / こられる (= correct, auto-dropped)
    } else if (group === "godan") {
      out.push(masuStem + "られる"); // のみられる — ます-stem + られる
      out.push(conjugateVerb(dictionary, "godan", "potential")); // のめる-shaped confusion; always ≠ base+あ-row+られる
    } else {
      // ichidan: wrong-class (in the caller) collides with `correct` — both
      // reduce to base + られる — so hand-add both slips directly.
      out.push(base + "れる"); // たべれる — ら抜き
      out.push(base + "える"); // たべえる — え-row bolted on after dropping る
    }
  }
  return out;
}

/**
 * Same-verb, same-ending-family rule misapplications (Task 5). Returns up to 3
 * distinct distractors, none equal to `correct`; never falls back to another
 * verb. Ordered so the most confusable errors come first.
 */
/**
 * Distractor picker for the TRANSFORM CARD's stage-1/2 MCQ (Fable sweep
 * 2026-07-24). Differs from the trainer/cloze ordering in two ways:
 *  - ATTACH-TO-DICTIONARY ranks FIRST (たべるない) — it's the exact error
 *    the rule card's anti-pattern warns about, and the general ordering
 *    buried it below family-tense forms (なかった) whose tense can never
 *    match the card's gloss, letting learners meta-game by elimination.
 *  - `exclude` filters candidates that are REAL registered words: いない
 *    was served as a WRONG option in L2 (いく → ×いない), training an
 *    error against the very word L6 then teaches as correct.
 */
export function transformDrillDistractors(
  dictionary: string,
  group: VerbGroup,
  form: ChainForm,
  correct: string,
  exclude: ReadonlySet<string>,
): string[] {
  const ranked = [
    dictionary + CHAIN_SUFFIX[form],
    ...(group === "irregular"
      ? [conjugateVerb(dictionary, "godan", form), conjugateVerb(dictionary, "ichidan", form)]
      : [conjugateVerb(dictionary, group === "godan" ? "ichidan" : "godan", form)]),
    ...generateFormationDistractors(dictionary, group, form, correct),
  ];
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  for (const c of ranked) {
    if (!c || seen.has(c) || exclude.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 2) break;
  }
  return out;
}

/** Plain い-adjective suffix — also the attach-to-dictionary error shape. */
const ADJ_SUFFIX: Record<IAdjForm, string> = {
  negative: "くない",
  past: "かった",
  "past-negative": "くなかった",
  ba: "ければ",
};

/**
 * い-adjective formation distractors — misapplied くない/かった rules on the
 * SAME adjective (attach-to-dictionary たかいくない, wrong polarity/tense).
 * Same anti-elimination guarantees as the verb generator.
 *
 * Lives here, in the PURE leaf, for the same reason the verb generator does:
 * `grammarHelpers.conjugationTransform` needs it for the m12 い-adjective
 * ramp, and importing `trainerSession` there closes an import cycle back
 * into the curriculum. `trainerSession` re-exports it — still ONE source.
 */

/** Same rule as `collidesWithAnotherVerb`, over the adjective table. */
let foreignAdjForms: Map<string, Set<string>> | null = null;
function collidesWithAnotherAdj(surface: string, dictionary: string): boolean {
  if (!foreignAdjForms) {
    foreignAdjForms = new Map();
    for (const entry of ADJ_ENTRIES) {
      for (const s of [entry.dictionary, ...Object.values(entry.forms)]) {
        if (!s) continue;
        const set = foreignAdjForms.get(s) ?? new Set<string>();
        set.add(entry.dictionary);
        foreignAdjForms.set(s, set);
      }
    }
  }
  const owners = foreignAdjForms.get(surface);
  if (!owners) return false;
  for (const owner of owners) if (owner !== dictionary) return true;
  return false;
}

/**
 * The sibling members that share a target form's ending family. Mirrors
 * `verbFamilyMembers`: negative/past/past-negative form one closed family
 * (all "drop い, add a plain suffix"); ば is a SEPARATE singleton family — its
 * formation looks the same shape (drop い, add a suffix) but nothing sibling
 * to it should leak into the negative/past/past-negative distractor pool (or
 * vice versa), same posture as `volitional` staying out of the masu/nai/tai
 * families.
 */
function iAdjFamilyMembers(form: IAdjForm): IAdjForm[] {
  switch (form) {
    case "negative":
    case "past":
    case "past-negative":
      return ["negative", "past", "past-negative"];
    case "ba":
      return ["ba"];
  }
}

export function generateIAdjFormationDistractors(
  dictionary: string,
  form: IAdjForm,
  correct: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const push = (s: string | undefined) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  const siblings = iAdjFamilyMembers(form);

  // (4) wrong polarity/tense within the family (real sibling forms).
  for (const sib of siblings) if (sib !== form) push(conjugateIAdj(dictionary, sib));
  // (2) attach-to-dictionary: たかい + くない → たかいくない (たかい + ければ → たかいければ).
  push(dictionary + ADJ_SUFFIX[form]);
  for (const sib of siblings) if (sib !== form) push(dictionary + ADJ_SUFFIX[sib]);
  // Fallback: stem + every family ending (dedup drops correct + sibling repeats).
  const stem = dictionary.slice(0, -1);
  for (const sib of siblings) push(stem + ADJ_SUFFIX[sib]);
  // ば-specific naive attach/sound-change: skip the けれ infix entirely (same
  // simplification as the verb-side CHAIN_SUFFIX.ba dropping the え-row shift)
  // — たかい → たかば; or keep the け but drop れ — たかい → たかけば.
  if (form === "ba") {
    push(stem + "ば");
    push(stem + "けば");
  }

  // Prefer options that are not a real form of some other adjective —
  // stable, so the priority order above survives inside each half. Same
  // rule as the verb generator (Spencer: prefer it not, never ban it).
  const clean = out.filter((c) => !collidesWithAnotherAdj(c, dictionary));
  const colliding = out.filter((c) => collidesWithAnotherAdj(c, dictionary));
  return [...clean, ...colliding].slice(0, 3);
}

/**
 * Transform-card picker for い-adjectives — the adjective twin of
 * `transformDrillDistractors`. ATTACH-TO-DICTIONARY ranks FIRST (たかいくない
 * is exactly the error the rule card's anti-pattern warns about), then the
 * regular-stem misapplication for the suppletive いい (いくない beside the
 * correct よくない), then the family siblings. `exclude` drops candidates that
 * are REAL registered words, so a wrong option can never be a word the course
 * teaches as correct somewhere else.
 */
export function transformDrillIAdjDistractors(
  dictionary: string,
  form: IAdjForm,
  correct: string,
  exclude: ReadonlySet<string>,
): string[] {
  const ranked = [
    dictionary + ADJ_SUFFIX[form],
    // いい's stem is suppletive (よ-); applying the REGULAR rule to it is the
    // one formation error the family-sibling list can't produce.
    dictionary.slice(0, -1) + ADJ_SUFFIX[form],
    ...generateIAdjFormationDistractors(dictionary, form, correct),
  ];
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  for (const c of ranked) {
    if (!c || seen.has(c) || exclude.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 2) break;
  }
  return out;
}


/**
 * Every surface that is a real form of some OTHER verb, mapped to the
 * dictionary forms that own it.
 *
 * Most distractors here are real forms ON PURPOSE — the sibling-form family
 * (のみたかった against のみたい) is the whole point, and those belong to the
 * SAME verb, so they read as "wrong cell", which is the confusion being
 * tested. A collision with a DIFFERENT verb is a different thing: しる drilled
 * to しりたい offered したい, which is する's たい form — a right answer to a
 * question nobody asked, and it teaches nothing about しる. Spencer
 * 2026-07-28: "fine if the distractor is accidentally a real word but prefer
 * it not", so these sink to the back of the candidate list rather than being
 * banned — a short verb with few candidates still gets three options.
 */
let foreignForms: Map<string, Set<string>> | null = null;
function ownersOf(surface: string): Set<string> {
  if (!foreignForms) {
    foreignForms = new Map();
    for (const entry of VERB_ENTRIES) {
      const surfaces = [entry.dictionary, ...Object.values(entry.forms)];
      for (const s of surfaces) {
        if (!s) continue;
        const set = foreignForms.get(s) ?? new Set<string>();
        set.add(entry.dictionary);
        foreignForms.set(s, set);
      }
    }
  }
  return foreignForms.get(surface) ?? new Set();
}

/** True when `surface` is a real form of a verb OTHER than `dictionary`. */
function collidesWithAnotherVerb(surface: string, dictionary: string): boolean {
  const owners = ownersOf(surface);
  for (const owner of owners) if (owner !== dictionary) return true;
  return false;
}

export function generateFormationDistractors(
  dictionary: string,
  group: VerbGroup,
  form: ChainForm,
  correct: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const push = (s: string | undefined) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  const conjugateAsOtherClass = (f: ChainForm): string[] =>
    group === "irregular"
      ? [conjugateVerb(dictionary, "godan", f), conjugateVerb(dictionary, "ichidan", f)]
      : [conjugateVerb(dictionary, group === "godan" ? "ichidan" : "godan", f)];

  // (3) wrong sound-change (the hardest to catch by elimination).
  for (const c of wrongSoundChangeCandidates(dictionary, group, form)) push(c);
  // (1) wrong-class: apply the other class's rule to the same form.
  for (const c of conjugateAsOtherClass(form)) push(c);
  // (4) wrong tense/polarity WITHIN the family (real sibling forms are fair game).
  for (const sib of verbFamilyMembers(form)) {
    if (sib !== form) push(conjugateVerb(dictionary, group, sib));
  }
  // Fallbacks for short verbs — never other-verb options, only more of the same.
  for (const sib of verbFamilyMembers(form)) {
    if (sib !== form) for (const c of conjugateAsOtherClass(sib)) push(c);
  }
  // (2) attach-to-dictionary: bolt the plain suffix on the dictionary form.
  push(dictionary + CHAIN_SUFFIX[form]);
  for (const sib of verbFamilyMembers(form)) {
    if (sib !== form) push(dictionary + CHAIN_SUFFIX[sib]);
  }

  // Prefer options that are not a real form of some other verb — stable, so
  // the priority order above is preserved within each half.
  const clean = out.filter((c) => !collidesWithAnotherVerb(c, dictionary));
  const colliding = out.filter((c) => collidesWithAnotherVerb(c, dictionary));
  return [...clean, ...colliding].slice(0, 3);
}
