/**
 * REGISTER CUES AS DATA, NOT AS PROSE.
 *
 * Japanese production beats are authored with the audience/politeness cue
 * written INSIDE the English string:
 *
 *   { kind: sentence, ja: "いえで たべます。", en: "Say politely: I eat at home", mode: build }
 *
 * The cue is load-bearing on the step the learner is answering — it names
 * which form to produce, and 「いえで たべる」 vs 「いえで たべます」 are both
 * correct English-for-Japanese without it. But it is METADATA, not a gloss.
 * Spencer's standing rule (#76, #15) is that a gloss is "the CLOSEST English
 * 1-1 word translation" with no register note baked in, and the same English
 * is re-presented on half a dozen other surfaces — the listening-build
 * reveal, filler `listening_comprehension` options, flashcards, the
 * lesson-complete list, review and test-out steps — where a directive
 * addressed to the speaker is simply the wrong text. (`stripRegisterCue`
 * below was the 2026-09-10 band-aid for exactly one of those surfaces; its
 * own doc comment says the real fix is a structured field. This is it.)
 *
 * SO: the YAML keeps ONE authoring convention (the cue stays authored as
 * text, which is what four concurrent authoring lanes are writing), and the
 * COMPILER splits it: `parseRegisterCue` lifts the prefix into a structured
 * `RegisterCue` on the step and hands back the clean sentence for the
 * `en`/`prompt`/`meaningEn` field. Views render the cue as a `Badge`
 * eyebrow; every other surface gets the clean gloss for free, because the
 * clean gloss is now the only thing in the field.
 *
 * ## Why an ALLOWLIST and not a general `/^[^:]+:\s/`
 *
 * English sentences contain colons. m19 teaches clock times and authors
 * "The train comes at 8:10" nineteen times; a general rule that ate
 * everything before a colon would gloss that as "10". The table below is
 * the complete set of prefixes the JA corpus actually uses (measured
 * 2026-09-15 over all 41 `ir/*.ir.yaml`, 7,197 English fields, 978
 * cue-shaped hits — every one of them is in this table and nothing else
 * matched). An unrecognized prefix is deliberately LEFT ALONE rather than
 * guessed at, so a new authoring variant shows up as an un-badged prompt
 * that still reads correctly, never as a mangled gloss —
 * `registerCueInventory.test.ts` fails on any cue-shaped prefix the table
 * does not know, which is how a new variant gets noticed.
 */

export type RegisterForm = "polite" | "plain";

/** Who the utterance is addressed to, when the cue names one. */
export type RegisterAudience = "friend" | "teacher" | "staff";

export type RegisterCue = {
  /** The form the learner must produce. */
  form: RegisterForm;
  /** Present only when the cue names an addressee. */
  audience?: RegisterAudience;
  /**
   * Badge text. Carries the SPEECH ACT when the cue named one ("Ask a
   * friend") — dropping the "Ask" would leave a gloss like "How's the rice"
   * with no question mark and nothing to say it is a question. Never
   * re-derived at a call site; the views render this string.
   */
  label: string;
  /**
   * The authored cue verbatim, minus the colon ("Say politely"). Kept so
   * `registerCuedText()` can reconstruct the original authored English
   * byte-for-byte — the i18n content catalogs hash the authored English to
   * detect staleness (`resolveContentString`), and 437 Korean sidecar rows
   * are keyed to the CUED string. Reconstructing for the lookup keeps all
   * 437 resolving instead of silently falling back to English.
   */
  raw: string;
};

type CueSpec = { form: RegisterForm; audience?: RegisterAudience; label: string };

/**
 * prefix (lowercased, verbatim from the corpus) → cue.
 *
 * Counts are the 2026-09-15 measurement over `ir/*.ir.yaml`, for scale when
 * deciding whether a variant is a convention or a one-off. `form` is what
 * the CUE CLAIMS, never what the Japanese does — that is the whole point of
 * `registerCueAgreement.test.ts`, which compares the two. Deriving `form`
 * from the sentence would make that gate vacuous.
 */
const CUE_TABLE: ReadonlyMap<string, CueSpec> = new Map([
  // 487 hits
  ["say politely", { form: "polite", label: "Polite" }],
  // 439 hits
  ["say to a friend", { form: "plain", audience: "friend", label: "To a friend" }],
  // 18 hits
  ["say to a teacher", { form: "polite", audience: "teacher", label: "To a teacher" }],
  // 16 hits
  ["ask a friend", { form: "plain", audience: "friend", label: "Ask a friend" }],
  // 6 hits
  ["say to your teacher", { form: "polite", audience: "teacher", label: "To your teacher" }],
  // 4 hits
  ["ask politely", { form: "polite", label: "Ask politely" }],
  // 3 hits — m7's さま vocative row. Still `polite`; the gate's
  // indeterminate class covers the bare-vocative targets.
  ["say very politely", { form: "polite", label: "Very polite" }],
  // 2 hits
  ["ask your teacher", { form: "polite", audience: "teacher", label: "Ask your teacher" }],
  // 1 hit — m21, 「ちゃを いっぱい ください。」
  ["say to the waiter", { form: "polite", audience: "staff", label: "To the waiter" }],
  // 1 hit — m34. ミカ is a peer character (dialogueSpeakers.json), and the
  // beat's own options prove it: がんばろう is right, がんばります is the
  // teacher's form.
  ["say to mika", { form: "plain", audience: "friend", label: "To Mika" }],
  // 1 hit — m35. The cue names the friend inline; ケン is a peer.
  ["ask ken (a friend)", { form: "plain", audience: "friend", label: "Ask Ken (a friend)" }],
  // Named in the lane brief and in `stripRegisterCue`'s verb list but NOT
  // present in the corpus as of 2026-09-15. Listed so the first authoring
  // lane to use one gets a badge instead of an inventory-gate failure.
  ["say casually", { form: "plain", label: "Casual" }],
  ["ask casually", { form: "plain", label: "Ask casually" }],
]);

/**
 * Longest prefix first, so "say to a teacher" is never shadowed by a
 * shorter entry and the match is unambiguous regardless of Map order.
 */
const CUE_PREFIXES: readonly string[] = [...CUE_TABLE.keys()].sort(
  (a, b) => b.length - a.length,
);

/**
 * Anything shaped like a leading cue — used ONLY by the inventory gate, to
 * catch a new authoring variant the table does not know. Requires
 * whitespace after the colon, which is what keeps "The train comes at 8:10"
 * out (and a digit-led prefix cannot match the leading letter class either).
 */
export const CUE_SHAPED = /^([A-Za-z][^:：]{0,60}?)[:：]\s/;

export type ParsedRegisterCue = {
  /** The sentence with the cue removed — the gloss. */
  text: string;
  /** Absent when the string carried no recognized cue. */
  cue?: RegisterCue;
};

/**
 * Split a leading register cue out of an authored English string.
 *
 * Returns the input unchanged (and no cue) when there is no recognized
 * prefix, or when removing it would leave nothing — "Say:" is not a cue
 * over an empty sentence, it is the whole text.
 */
export function parseRegisterCue(en: string): ParsedRegisterCue {
  if (!en) return { text: en };
  const lower = en.toLowerCase();
  for (const prefix of CUE_PREFIXES) {
    if (!lower.startsWith(prefix)) continue;
    const rest = en.slice(prefix.length);
    // The colon is REQUIRED. Without it "Say it one more time." is a
    // sentence that happens to start with a cue verb, not a cue.
    const m = /^[:：]\s*/.exec(rest);
    if (!m) continue;
    const text = rest.slice(m[0].length).trim();
    if (!text) continue;
    const spec = CUE_TABLE.get(prefix) as CueSpec;
    return {
      text,
      cue: {
        form: spec.form,
        ...(spec.audience ? { audience: spec.audience } : {}),
        label: spec.label,
        raw: en.slice(0, prefix.length),
      },
    };
  }
  return { text: en };
}

/**
 * Rebuild the AUTHORED English (cue included) from a clean string plus its
 * cue. Byte-identical to what the YAML holds for the whole corpus, because
 * the authored separator is always exactly ": " — verified over all 978 hits
 * by `registerCue.test.ts`'s round-trip case.
 *
 * Only one caller should exist: the i18n content lookup. The catalogs were
 * extracted from the cued English and carry `enSourceHash` of it, so the
 * hash must be computed over the cued form or every cue-bearing row goes
 * stale. NEVER render this.
 */
export function registerCuedText(text: string, cue: RegisterCue | undefined): string {
  return cue ? `${cue.raw}: ${text}` : text;
}

/**
 * Remove a leading cue from a string that came back from the i18n content
 * lookup, in whatever language that lookup returned.
 *
 * This is the one place a GENERAL "everything before the first `: `" rule is
 * safe, and it is safe because the caller has already proved the step
 * carries a cue (`step.registerCue` is set) and has already reconstructed
 * the cued English to do the lookup. The translated string therefore starts
 * with the translated cue — Korean sidecars hold "친구에게 말하세요: 응,
 * 먹을게." — and an English-anchored regex cannot possibly match it
 * (the failure `stripRegisterCue`'s doc comment describes).
 *
 * Bounded so a mis-keyed catalog row can't be truncated: the prefix must be
 * short and must not contain sentence-ending punctuation.
 */
export function stripResolvedCue(
  resolved: string,
  cue: RegisterCue | undefined,
): string {
  // The cue is a REQUIRED argument, not an optional guard a call site can
  // forget. Without it this rule eats the "Build: " framing off every
  // un-cued build prompt in the course — which is exactly what it would
  // have done the first time someone wired it in one line.
  if (!cue) return resolved;
  const m = /^[^:：.?!。？！]{1,40}[:：]\s+/.exec(resolved);
  if (!m) return resolved;
  const rest = resolved.slice(m[0].length).trim();
  return rest || resolved;
}

/**
 * Legacy verbs `stripRegisterCue` accepts but the structured table does
 * not. Kept because the two functions have DIFFERENT jobs and therefore
 * different failure postures:
 *
 *   - `parseRegisterCue` PROMOTES a cue to a badge, so it must be certain:
 *     an unrecognized prefix is left in the prompt (reads fine, un-badged)
 *     rather than guessed at and rendered as a label.
 *   - `stripRegisterCue` DEMOTES a prompt to a gloss on a re-use surface,
 *     where under-stripping is the actual bug (inv 8: a directive shown as
 *     the answer to "what does this sentence mean?" is both wrong and a
 *     giveaway) and over-stripping is harmless.
 *
 * So the strip stays permissive for the five verbs it has always accepted.
 * Nothing in the JA corpus uses these — they exist so a hand-authored
 * ES/FR/KO prompt of that shape still gets demoted.
 */
const LEGACY_CUE = /^(?:Say|Ask|Answer|Reply|Tell)\b[^:]{0,40}:\s*/i;

/**
 * "The meaning, with no directive in it" — for a surface that re-presents a
 * production prompt as a gloss (filler `listening_comprehension`, the
 * listening-build reveal).
 *
 * Callers that need the cue itself should use `parseRegisterCue`; this is
 * the lossy form, and it is the right one where the cue must simply be
 * gone.
 */
export function stripRegisterCue(en: string): string {
  const parsed = parseRegisterCue(en);
  if (parsed.cue) return parsed.text;
  return en.replace(LEGACY_CUE, "").trim() || en;
}

// ───────────────────────────── agreement ─────────────────────────────

/**
 * What the AUTHORED Japanese actually is, independent of what its cue
 * claims. Three-valued on purpose: `indeterminate` is not a polite/plain
 * coin flip.
 */
export type DerivedForm = RegisterForm | "indeterminate";

/**
 * Trailing sentence-final particles and punctuation to look past.
 *
 * The leading `\s*` inside the particle group is load-bearing: the course
 * writes sentences with spaces between words, so a final particle is usually
 * space-separated — 「いく よ。」, 「たべる ね。」 — and without it those read
 * as predicate-less.
 */
const TAIL = String.raw`(?:\s*(?:よね|[かねよなのわぞ]))*\s*[。、，．？！?!"'”’」』\s]*$`;

/**
 * Polite predicate endings. です/ます and their inflections, plus the
 * polite imperative ください and the polite existentials. Anchored at the
 * end (past the tail particles), so 「たべますか？」 and 「たべません。」 both
 * land here.
 */
const POLITE_TAIL = new RegExp(
  String.raw`(?:です|でした|ます|ました|ません|ませんでした|ましょう|ください|でしょう|ございます|ありません|いません)` +
    TAIL,
);

/**
 * Plain predicate endings: dictionary form, past た/だ, negative ない,
 * い-adjective and its inflections, plain copula だ, volitional よう/おう/ろう.
 *
 * A target that matches NEITHER list is `indeterminate`, not plain — a bare
 * vocative (m7's 「たなかさま」, cued "Say very politely") has no predicate to
 * be polite or plain, and calling it plain would manufacture a disagreement
 * out of a sentence that never claimed one.
 */
const PLAIN_TAIL = new RegExp(
  String.raw`(?:` +
    // …explicit multi-kana forms first, longest first within each family.
    String.raw`じゃない|ではない|なかった|くない|かった|ない|` +
    // volitional
    String.raw`よう|おう|ろう|` +
    // colloquial registers the course actually teaches: m8's て-form request
    // (「これを みて」), m25's かな / でしょ, m28's なきゃ / なくちゃ,
    // m29's じゃん / っけ, and だめ as a predicate.
    String.raw`でしょ|かな|じゃん|っけ|なきゃ|なくちゃ|だめ|[てで]|` +
    // dictionary form, past た/だ, い-adjective, plain copula だ
    String.raw`[うくぐすつぬぶむるいた]|だ` +
    String.raw`)` +
    TAIL,
);

/**
 * BACKCHANNELS AND BARE YES/NO carry the register themselves — that pair IS
 * m10's `aizuchi` / `yes-no-register` lesson (はい to a teacher, うん to a
 * friend), and 「はい、はい。」 cued "Say politely" is correct Japanese.
 *
 * Handled before the tail tests because the tail tests get it WRONG: はい
 * ends in い, which the plain rule reads as an い-adjective, so this one
 * sentence was the entire course-wide disagreement count until the
 * interjection case existed. Matched only when the sentence is NOTHING but
 * interjections — 「はい、たべます。」 falls through to the predicate rules
 * where it belongs.
 */
const POLITE_INTERJECTION = /^(?:(?:はい|いいえ|ええ)[、。\s]*)+$/;
const PLAIN_INTERJECTION = /^(?:(?:うん|ううん|ん)[、。\s]*)+$/;

/** Derive polite/plain from the Japanese the learner is asked to produce. */
export function derivePoliteness(ja: string): DerivedForm {
  const s = ja.trim();
  if (!s) return "indeterminate";
  if (POLITE_INTERJECTION.test(s)) return "polite";
  if (PLAIN_INTERJECTION.test(s)) return "plain";
  if (POLITE_TAIL.test(s)) return "polite";
  if (PLAIN_TAIL.test(s)) return "plain";
  return "indeterminate";
}
