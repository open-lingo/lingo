import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { JA_COURSE_ATOMS } from "../courseAtoms";

/**
 * THE REVERSE ARROW.
 *
 * `moduleConformance` enforces one direction: every ATOM must be introduced
 * before it is exercised. Nothing enforced the other, and that is how m30 and
 * m31 came to teach 29 words that had no `courseAtoms` row — so no flashcard,
 * no FSRS state, and no way back. The module titled あげる・くれる・もらう
 * shipped with あげる registered and the other two not.
 * (docs/issues/n4-vocab-never-reaches-srs-2026-08-18.md)
 *
 * ── Why registration is not automatic, and must not be ──────────────────
 *
 * A `courseAtoms` row joins the COURSE-WIDE tokenizer, so adding one can
 * re-tokenize sentences in modules that have nothing to do with it. That is a
 * real, load-bearing hazard with its own name in this repo — the m16-ので
 * regression class — and it is why m22 and m25 each dumped every compiled tile
 * in the whole course before and after adding rows and checked the diff was
 * empty. So this test does NOT auto-register anything. It fails, loudly, and a
 * human does the registration with the tile diff in hand.
 *
 * ── What counts as needing a row ────────────────────────────────────────
 *
 * LEMMAS only. The IR already draws this line itself — `kind: verb-form` /
 * `adj-form` / `tai-form` carry `derivedFrom`, and たべました must NOT get a
 * row: registering an inflection regresses the flashcard importer (食べました
 * stops mapping back to たべる) and the annotator (のみました stops splitting
 * into stem + ました). Those are shipped behaviours with their own tests.
 *
 * So the rule is: a word the IR declares as a NEW LEMMA must be registered.
 * A form derived from one must not be.
 */

const IR_DIR = "src/features/languages/ja/curriculum/ir";

/** IR `kind` values that mark a DERIVED form rather than a new lemma. */
const DERIVED_KINDS = new Set([
  "verb-form",
  "adj-form",
  "tai-form",
  "adjective-form",
]);

function moduleOrder(m: string): number {
  const x = /^m(\d+)$/.exec(m);
  return x ? +x[1] : Infinity;
}

/**
 * Frozen debt, m1–m29. Every entry is a lemma-kind `newAtom` with no registry
 * row that predates this gate. The ratchet is one-directional: this list may
 * SHRINK, never grow, and nothing may be added to it — a new module's word
 * belongs in `courseAtoms`, not here.
 *
 * These are not all the same kind of thing, which is why they are frozen
 * rather than fixed in one pass:
 *   - んだ / んです / なんだ / なんです (m27) are the explanatory-の
 *     construction, arguably grammar rather than vocabulary.
 *   - すぎる and its seven ready-made compounds (m27) are a productive suffix
 *     plus its outputs — registering たかすぎる would put a derived form in
 *     the deck as though it were a word.
 *   - ならない / なりません (m28) are the bound half of なければならない.
 *   - よ / ね (m29) are sentence-final particles already taught as grammar.
 *   - しましょう (m24) is a form of する.
 * Each deserves its own ruling; none is an accident of the kind m30/m31 hit.
 */
const FROZEN_UNREGISTERED: ReadonlySet<string> = new Set([
  // だけ (m35) cannot join the global longest-match registry: unspaced だけど
  // (だ + けど, m16) appears in ~30 shipped build/listening tiles across nine
  // modules, and a global だけ atom shatters every one of them into a bogus
  // だけ＋ど split (verified by course-wide tile dump, m35 landing 2026-08-25).
  // m35's own tokenizer sees だけ through its IR newAtoms, so the module's
  // guards and lessons are fully covered — the cost is no global flashcard,
  // which is the smaller, contained loss. Revisit only with a tokenizer that
  // can prefer だ+けど over だけ+ど by context.
  "だけ",
  "しましょう",
  "んだ", "なんだ", "んです", "なんです",
  "すぎる", "すぎた", "たかすぎる", "おおきすぎる", "ちいさすぎる",
  "さむすぎる", "むずかしすぎる", "しずかすぎる", "ながすぎる", "なった",
  "ならない", "なりません",
  "よ", "ね",
  // じゃん / っけ / さ / わ (m29-neo-14, the 2026-08-26 F18 ender insert) —
  // bound sentence-final enders, the same ruling as よ/ね: registering them
  // would put a decoration in the flashcard deck as though it were a word.
  // じゃん additionally shatters nothing but IS じゃない-derived (じゃない with
  // the ない worn off); it is declared without `derivedFrom` on purpose so
  // its ruling lives HERE beside よ/ね instead of vanishing from the audit.
  "じゃん", "っけ", "さ", "わ",
  // m30's two 〜とく contractions. The IR tags them `kind: vocab`, but かっとく
  // is かって + おく contracted — a derived form wearing a lemma's tag. They
  // are listed here rather than registered, because registering them would put
  // a contraction in the flashcard deck as if it were a word. The IR mis-tag
  // is the thing to fix; see the issue doc.
  "かっとく", "しとく",
]);

type Missing = { module: string; kana: string; kind: string; gloss: string };

function unregisteredLemmas(): Missing[] {
  const registered = new Set<string>();
  for (const a of JA_COURSE_ATOMS) {
    for (const s of [
      ...a.kana.split(/[/、]/),
      ...((a.kanji ?? "").split(/[/、]/)),
    ]) {
      if (s.trim()) registered.add(s.trim());
    }
  }

  const out: Missing[] = [];
  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.yaml"))) {
    const doc = parse(readFileSync(join(IR_DIR, file), "utf8"));
    const module: string = doc.module ?? file.replace(".ir.yaml", "");
    for (const atom of doc.newAtoms ?? []) {
      if (!atom?.kana) continue;
      if (DERIVED_KINDS.has(atom.kind) || atom.derivedFrom) continue;
      if (registered.has(atom.kana)) continue;
      out.push({
        module,
        kana: atom.kana,
        kind: String(atom.kind),
        gloss: String(atom.gloss ?? ""),
      });
    }
  }
  return out;
}

describe("IR atom registration — every new lemma reaches the deck", () => {
  const missing = unregisteredLemmas();

  it("finds lemma atoms to check at all", () => {
    // Instrument guard. If `newAtoms` is ever renamed or the kinds change,
    // this test would otherwise report a clean course while checking nothing.
    const doc = parse(
      readFileSync(join(IR_DIR, "m31.ir.yaml"), "utf8"),
    ) as { newAtoms?: unknown[] };
    expect(doc.newAtoms?.length ?? 0).toBeGreaterThan(0);
  });

  it("m30+ registers every lemma it introduces", () => {
    // The N4 tier and everything after it. No exemption list — a word taught
    // here must be reviewable, and the fix is a registry row plus the tile
    // diff, not an entry in a set.
    const offenders = missing
      .filter((m) => moduleOrder(m.module) >= 30)
      .filter((m) => !FROZEN_UNREGISTERED.has(m.kana))
      .map((m) => `${m.module} ${m.kana} (${m.kind}) — "${m.gloss}"`)
      .sort();
    expect(offenders).toEqual([]);
  });

  it("pre-N4 debt is frozen and only shrinks", () => {
    const stale = missing
      .filter((m) => moduleOrder(m.module) < 30)
      .map((m) => m.kana)
      .filter((k) => !FROZEN_UNREGISTERED.has(k));
    expect(stale, "new unregistered lemma in a pre-N4 module").toEqual([]);
  });

  it("the frozen list contains nothing already fixed", () => {
    // Keeps the ratchet honest in the other direction: once a word IS
    // registered, its entry here is dead weight that would hide a regression.
    const stillMissing = new Set(missing.map((m) => m.kana));
    const dead = [...FROZEN_UNREGISTERED].filter((k) => !stillMissing.has(k));
    expect(dead, "registered now — remove from FROZEN_UNREGISTERED").toEqual([]);
  });
});
