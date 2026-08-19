import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";
import { REGISTER_AUDIENCES } from "@/features/languages/ja/registerAudiences";

/**
 * THE SCENE VOCABULARY GATE.
 *
 * Every other Japanese surface a learner meets is gated. Lesson beats go
 * through `moduleConformance`; grammar-review pool steps go through the
 * comprehensibility gate in `grammarReviewPools.test.ts`; build tiles go
 * through `kanaWordIntroOrder`. A **scene** — the drawn rule card that
 * replaces a paragraph of prose — went through none of them, because it
 * reaches the screen down its own path: IR `diagram:` → `moduleCompiler`
 * → `GrammarRuleStepView`, never touching the beat pipeline.
 *
 * So a scene was the one place in the course where an author could put an
 * untaught word in front of a learner and nothing would say a word about it.
 * This test closes that.
 *
 * It reads the **IR YAML directly** rather than the compiled output or a
 * registry of specs. That is deliberate: authoring a new scene means adding a
 * `diagram:` block to a module's YAML, so a scene cannot be added without
 * landing inside this test's sweep. There is no way to opt in and therefore
 * no way to forget to.
 *
 * ── What is gated, and what is not ──────────────────────────────────────
 *
 * Only fields that render as JAPANESE TO THE LEARNER. A scene also carries
 * English — `gloss`, `note`, `en`, `why` — and that English legitimately
 * quotes Japanese ("…because くれる can only point at me"). Gating it would
 * flag the very word the card exists to teach. Those fields are prose about
 * the language rather than the language, so they are skipped, and the field
 * lists below are per-kind rather than a blind walk of the object.
 *
 * The awkward case worth stating: `label` is JAPANESE on a transfer party and
 * a scale item, and ENGLISH on a register audience (which carries its Japanese
 * in `ja` and keeps `label` as an accessible name). Same key, opposite
 * meaning — which is exactly why this reads per-kind.
 */

const IR_DIR = "src/features/languages/ja/curriculum/ir";

/** Bare grammatical markers. Not course atoms, taught as grammar points. */
const PARTICLES = ["は", "が", "を", "に", "へ", "で", "と", "も", "の", "や",
  "から", "まで", "より", "か", "ね", "よ"];

/**
 * Endings a scene may print on a verb, matching the review gate's list.
 *
 * `てから` earns its place for a reason worth writing down: m15's own IR notes
 * specify that 「たべてから」 tiles as たべて / から, so てから is never a word —
 * it is the て-form the learner got in m8 plus a particle they have had since
 * m16. A timeline chip has to print the connective with no verb in front of
 * it, which is the one place that decomposition has nothing to decompose.
 * Bare `て` is deliberately NOT listed: it would strip a て off the end of any
 * word and blind the gate to real misses.
 *
 * This list is module-BLIND, like `PARTICLES` — `ください` strips at m3 as
 * happily as at m8. That is the same documented limitation the test at the
 * bottom of this file pins: the gate catches untaught VOCABULARY, and leans on
 * `moduleConformance` for whether a form is reachable yet.
 */
const TAUGHT_ENDINGS = ["ます", "ません", "ました", "ませんでした", "です",
  "でした", "じゃない", "じゃありません", "ください", "でしょう", "てから"];

const PUNCT_RE = /[。、？！「」『』〜ー・…\s]/g;

const str = (v: unknown): v is string => typeof v === "string" && v.length > 0;

function moduleOrder(m: string): number {
  const x = /^m(\d+)$/.exec(m);
  return x ? +x[1] : Infinity;
}

/** Split "/"、"、"-separated kana/kanji variants (moduleConformance pattern). */
function surfaceVariants(atom: { kana: string; kanji?: string }): string[] {
  const out = atom.kana.split(/[/、]/).map((s) => s.trim());
  if (atom.kanji) out.push(...atom.kanji.split(/[/、]/).map((s) => s.trim()));
  return out.filter(Boolean);
}

/**
 * Every word introduced by an IR module, keyed by module.
 *
 * `courseAtoms.ts` is NOT sufficient on its own and it is worth being precise
 * about why, because it looks like the obvious source. It is the older
 * registry, and the neo modules restamp into it lazily: m31 `introduces` 37
 * words in its IR and `courseAtoms` carries 5 of them with `fromModule: m31`.
 * A gate reading only `courseAtoms` therefore flags くれる and もらう — the two
 * verbs the module exists to teach — as untaught vocabulary.
 *
 * The IR is the authoring front door, so `introduces:` is the record of what
 * a module teaches. This unions the two: the IR for what is taught now,
 * `courseAtoms` for everything that predates the neo spine.
 */
function introducedByModule(): Map<number, string[]> {
  const byModule = new Map<number, string[]>();
  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.yaml"))) {
    const doc = parse(readFileSync(join(IR_DIR, file), "utf8"));
    const n = moduleOrder(doc.module ?? file.replace(".ir.yaml", ""));
    const words: string[] = [];
    for (const lesson of doc.lessons ?? []) {
      for (const w of lesson?.introduces ?? []) if (str(w)) words.push(w);
    }
    byModule.set(n, (byModule.get(n) ?? []).concat(words));
  }
  return byModule;
}

const IR_INTRODUCES = introducedByModule();

/**
 * Greedy longest-match residual. "" means every character is explained by
 * something the learner owns at `ceiling`. Same shape as the grammar-review
 * gate so the two agree on what "comprehensible" means.
 */
function residual(text: string, ceiling: string): string {
  const cap = moduleOrder(ceiling);
  const taught: string[] = [];
  for (const [n, words] of IR_INTRODUCES) if (n <= cap) taught.push(...words);
  const allowed = JA_COURSE_ATOMS.filter(
    (a) => moduleOrder(a.fromModule) <= cap,
  )
    .flatMap(surfaceVariants)
    .concat(taught, PARTICLES, TAUGHT_ENDINGS)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  let rest = text.replace(PUNCT_RE, "");
  for (const surface of allowed) rest = rest.split(surface).join("");
  return rest;
}

type Bag = { field: string; text: string };

/** Pull the learner-facing Japanese out of one diagram, by kind. */
function japaneseIn(d: Record<string, any>): Bag[] {
  const out: Bag[] = [];
  const add = (field: string, v: unknown) => {
    if (str(v)) out.push({ field, text: v });
  };
  // `kind` is absent on the diagrams authored before scenes were a family;
  // those are all transfers, which is what the compiler assumed too.
  const kind: string = d.kind ?? "transfer";

  if (kind === "transfer") {
    add("insideLabel", d.insideLabel);
    add("outsideLabel", d.outsideLabel);
    for (const side of ["left", "right"]) add(`${side}.label`, d[side]?.label);
    add("object.label", d.object?.label);
    add("object.particle", d.object?.particle);
    for (const [i, r] of (d.rows ?? []).entries()) {
      add(`rows[${i}].verb`, r?.verb);
      add(`rows[${i}].leftParticle`, r?.leftParticle);
      add(`rows[${i}].rightParticle`, r?.rightParticle);
    }
  } else if (kind === "journey") {
    add("traveller.label", d.traveller?.label);
    add("verb", d.verb);
    for (const slot of ["origin", "means", "limit", "destination"]) {
      add(`${slot}.label`, d[slot]?.label);
      add(`${slot}.particle`, d[slot]?.particle);
    }
    add("destinationAlt.particle", d.destinationAlt?.particle);
  } else if (kind === "timeline") {
    for (const m of ["early", "late"]) add(`${m}.label`, d[m]?.label);
    for (const [i, f] of (d.frames ?? []).entries()) {
      add(`frames[${i}].connective`, f?.connective);
      add(`frames[${i}].first.text`, f?.first?.text);
      add(`frames[${i}].second.text`, f?.second?.text);
      for (const m of ["early", "late"]) {
        add(`frames[${i}].moments.${m}.label`, f?.moments?.[m]?.label);
      }
    }
  } else if (kind === "scale") {
    add("dimension", d.dimension);
    for (const [i, it] of (d.items ?? []).entries()) {
      add(`items[${i}].label`, it?.label);
    }
    for (const [i, f] of (d.frames ?? []).entries()) {
      add(`frames[${i}].pattern`, f?.pattern);
      add(`frames[${i}].ja`, f?.ja);
    }
  } else if (kind === "register") {
    for (const k of ["1", "2", "3"]) add(`forms.${k}`, d.forms?.[k]);
    // NOTE: `label` here is the ENGLISH accessible name. The Japanese the
    // learner reads is `ja`.
    for (const [i, a] of (d.audiences ?? []).entries()) {
      add(`audiences[${i}].ja`, a?.ja);
    }
    // The IR does NOT author audiences inline — it names them by id in
    // `cast:`, and the compiler resolves each id through REGISTER_AUDIENCES
    // on the way to RegisterScene, which prints `a.ja` (RegisterScene.tsx:163).
    // Reading only `audiences[].ja` therefore gated NOTHING on a real scene
    // (2026-08-19): `cast: [friend, teacher]` has no `audiences` key at all.
    // Two of the four roster audiences carry vocabulary the course does not
    // teach — てんいん is taught nowhere, おばあさん not until m19 — so casting
    // one before its module is exactly the miss this file exists to catch.
    for (const id of (d.cast ?? []) as string[]) {
      add(`cast.${id}.ja`, REGISTER_AUDIENCES[id]?.ja);
    }
  } else {
    throw new Error(`unknown scene kind "${kind}" — add its field list here`);
  }
  return out;
}

type Scene = { module: string; pointId: string; kind: string; bags: Bag[] };

function collectScenes(): Scene[] {
  const scenes: Scene[] = [];
  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.yaml"))) {
    const doc = parse(readFileSync(join(IR_DIR, file), "utf8"));
    const module: string = doc.module ?? file.replace(".ir.yaml", "");
    const points = doc.grammarPoints ?? [];
    for (const gp of Array.isArray(points) ? points : []) {
      if (!gp?.diagram) continue;
      scenes.push({
        module,
        pointId: gp.id ?? "(unnamed)",
        kind: gp.diagram.kind ?? "transfer",
        bags: japaneseIn(gp.diagram),
      });
    }
  }
  return scenes;
}

describe("scene vocabulary gate", () => {
  const scenes = collectScenes();

  it("finds the scenes actually authored in the IR", () => {
    // Guards the instrument, not the content. Every gate in this repo has at
    // some point silently matched nothing and reported a clean sweep — the
    // `ー`-as-punctuation bug and the unquoted-`for` bug both looked like a
    // pass. If this ever reads 0, the sweep is broken, not the course clean.
    expect(scenes.length).toBeGreaterThan(0);
  });

  it("every scene uses only vocabulary taught by its own module", () => {
    const failures: string[] = [];
    for (const s of scenes) {
      for (const b of s.bags) {
        const left = residual(b.text, s.module);
        if (left) {
          failures.push(
            `${s.module} · ${s.pointId} (${s.kind}) · ${b.field}: ` +
              `"${b.text}" leaves "${left}" unexplained at ${s.module}`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("every scene declares a kind this gate knows how to read", () => {
    // japaneseIn() throws on an unknown kind, so a new scene type cannot ship
    // with no field list — it fails here rather than passing vacuously.
    expect(() => scenes.forEach(() => {})).not.toThrow();
    for (const s of scenes) {
      expect(["transfer", "journey", "timeline", "scale", "register"]).toContain(
        s.kind,
      );
    }
  });

  it("NEGATIVE CONTROL — the gate rejects a word the course never teaches", () => {
    // Without this, "0 failures" is indistinguishable from "the sweep matched
    // nothing". Four gates in this project have silently passed while matching
    // nothing; every one looked exactly like a clean run.
    expect(residual("ともだちに プレゼントを あげる", "m31")).toBe("");
    // 経済 is covered by no atom surface anywhere in the course. (The first
    // draft of this control used 図書館, which the gate correctly passed —
    // it is a taught atom from m6. The instrument was right and the example
    // was wrong, which is the failure mode this whole test exists to catch.)
    expect(residual("経済", "m51")).not.toBe("");
    // Taught LATER than the ceiling is still a failure, not a pass — this is
    // the assertion that makes the module ordering load-bearing.
    expect(residual("あげる", "m30")).not.toBe("");
    expect(residual("あげる", "m31")).toBe("");
  });

  it("DOCUMENTED LIMITATION — the gate is blind to fragment assembly", () => {
    // きかい ("opportunity") is taught nowhere, and strips to NOTHING: き and
    // かい are both taught surfaces, so a greedy tokenizer eats it one piece
    // at a time and reports it as fully understood. Same class of hole as the
    // taught-word residual check that passed unusable Japanese.
    expect(residual("きかい", "m51")).toBe("");
    // The blindness is partial, not total, and the difference matters: a word
    // whose pieces are NOT all taught still leaves a residual, so the gate
    // catches most of this class rather than none of it.
    expect(residual("べんごし", "m51")).toBe("べん");
    // Tolerable HERE specifically because scene fields are short, closed and
    // hand-authored — a label, one verb, one connective — not free prose, and
    // an author who types きかい into a scene meant to teach まえに has made a
    // mistake this gate is not the last line against. If scenes ever carry
    // GENERATED sentences, this is not sufficient on its own and needs the
    // structural floors the beat pipeline already has.
  });

  it("no scene is empty of Japanese", () => {
    // A scene whose fields are all English is a prose card wearing a picture's
    // clothes, and would pass the vocabulary test vacuously.
    for (const s of scenes) {
      expect(
        s.bags.length,
        `${s.module} · ${s.pointId} carries no Japanese`,
      ).toBeGreaterThan(0);
    }
  });
});
