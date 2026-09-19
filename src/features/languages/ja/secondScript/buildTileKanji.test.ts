/**
 * Build-tile kanji derivation (Spencer 2026-07-17 ruling) — gate order:
 * in-lesson (moduleIndex != null) → `resolveEligibleKanjiAtomId`
 * (homograph/eligibility) → rollout unlock module. Anything failing a
 * gate stays kana (null). Expectations are derived from the live rollout
 * catalog so a schedule move can't stale-fail these tests.
 */
import { describe, expect, it } from "vitest";
import {
  auxiliarySuppressedTiles,
  resolveBuildTileKanji,
} from "./buildTileKanji";
import { KANJI_ELIGIBLE_ATOMS } from "./applyKanjiSurfaces";
import { resolveEligibleKanjiAtomId } from "../grammarHelpers";
import { JA_COURSE_ATOMS } from "../courseAtoms";
import { ADJ_ENTRIES } from "../conjugationTables";
import { conjugateIAdj } from "../conjugationEngine";
import { getCompiledCourseFor } from "@/test/fixtures/compiledCourse";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";

// atomId → kana lookup for the round-trip test.
const atomIdKana = new Map(JA_COURSE_ATOMS.map((a) => [a.id, a.kana]));

/** A known-eligible tile word (店 — used by the match-pairs kanji tests). */
const MISE = "みせ";
const miseAtomId = resolveEligibleKanjiAtomId(MISE)!;
const miseEntry = KANJI_ELIGIBLE_ATOMS.get(miseAtomId)!;

describe("resolveBuildTileKanji", () => {
  it("unlocked at the lesson's module → kanji surface + kana reading + atomId", () => {
    expect(miseAtomId).toBeTruthy();
    expect(resolveBuildTileKanji(MISE, miseEntry.unlockModule)).toEqual({
      surface: miseEntry.kanji,
      reading: MISE,
      atomId: miseAtomId,
    });
    // Later modules keep it unlocked.
    expect(resolveBuildTileKanji(MISE, miseEntry.unlockModule + 5)).toEqual({
      surface: miseEntry.kanji,
      reading: MISE,
      atomId: miseAtomId,
    });
  });

  it("below the unlock module → null (kana as today)", () => {
    expect(resolveBuildTileKanji(MISE, miseEntry.unlockModule - 1)).toBeNull();
    expect(resolveBuildTileKanji(MISE, 1)).toBeNull();
  });

  it("outside a lesson (moduleIndex null) → null", () => {
    expect(resolveBuildTileKanji(MISE, null)).toBeNull();
  });

  it("homograph-ineligible kana stays kana at any module", () => {
    // はな = 花/鼻 (homograph), に = 二/particle (homograph + number),
    // した = 下/する-past (inflection collision) — all refused by the
    // shared resolver, so no module can kanji-fy them.
    for (const kana of ["はな", "に", "した"]) {
      expect(resolveEligibleKanjiAtomId(kana)).toBeUndefined();
      expect(resolveBuildTileKanji(kana, 99)).toBeNull();
    }
  });

  it("single-kana tiles (character-granularity content) never resolve", () => {
    // Character builds are excluded by the caller, but the derivation is
    // also structurally safe for their tiles: single kana are homographs /
    // non-atoms and never map to a kanji surface.
    for (const kana of ["あ", "い", "す", "ん"]) {
      expect(resolveBuildTileKanji(kana, 99)).toBeNull();
    }
  });

  describe("inflected forms (Spencer QA 2026-07-17 — のまない stayed kana while のむ kanji-fied)", () => {
    const NOMU = "のむ";
    const nomuAtomId = resolveEligibleKanjiAtomId(NOMU)!;
    const nomuEntry = KANJI_ELIGIBLE_ATOMS.get(nomuAtomId)!; // 飲む

    it("real conjugated forms of an eligible verb resolve to kanji stem + inflected tail", () => {
      expect(nomuEntry.kanji).toBe("飲む");
      for (const [kana, surface] of [
        ["のまない", "飲まない"],
        ["のみます", "飲みます"], // a taught kanji-less atom → SRS keys IT
        ["のんだ", "飲んだ"],
        ["のんで", "飲んで"],
      ] as const) {
        // Pure inflections bind the dictionary atom; kana that IS a taught
        // kanji-less sibling atom (のみます) binds the REAL atom instead so
        // the furigana mastery gate tracks what the learner actually drills.
        const boundAtomId =
          JA_COURSE_ATOMS.find((a) => a.kana === kana)?.id ?? nomuAtomId;
        expect(resolveBuildTileKanji(kana, nomuEntry.unlockModule)).toEqual({
          surface,
          reading: kana,
          atomId: boundAtomId,
        });
        // Same unlock gate as the citation form.
        expect(resolveBuildTileKanji(kana, nomuEntry.unlockModule - 1)).toBeNull();
      }
    });

    it("invented mutations never resolve (only REAL engine-generated forms enumerate)", () => {
      for (const kana of ["のみる", "のむる", "のまなさい"]) {
        expect(resolveBuildTileKanji(kana, 99)).toBeNull();
      }
    });

    it("an eligible い-adjective's conjugated forms resolve the same way", () => {
      const adj = ADJ_ENTRIES.find(
        (a) =>
          a.type === "i-adj" &&
          a.kanji &&
          resolveEligibleKanjiAtomId(a.dictionary) !== undefined &&
          KANJI_ELIGIBLE_ATOMS.has(resolveEligibleKanjiAtomId(a.dictionary)!),
      );
      expect(adj, "at least one kanji-eligible い-adjective").toBeDefined();
      const atomId = resolveEligibleKanjiAtomId(adj!.dictionary)!;
      const entry = KANJI_ELIGIBLE_ATOMS.get(atomId)!;
      const past = conjugateIAdj(adj!.dictionary, "past"); // e.g. たかかった
      const resolved = resolveBuildTileKanji(past, entry.unlockModule);
      // Derived expectation: kanji stem + inflected tail. The stem is the
      // catalog surface minus the okurigana tail it shares with the kana
      // dictionary form (longest common suffix).
      const dict = adj!.dictionary;
      const kanji = entry.kanji;
      let suf = 0;
      while (
        suf < dict.length &&
        suf < kanji.length &&
        dict[dict.length - 1 - suf] === kanji[kanji.length - 1 - suf]
      ) {
        suf++;
      }
      expect(resolved).toEqual({
        surface: kanji.slice(0, kanji.length - suf) + past.slice(dict.length - suf),
        reading: past,
        atomId,
      });
    });

    it("inflected kana that collides with a real course atom stays kana", () => {
      // した is する's past — and 下's kana. Real-atom kana is owned by the
      // citation resolver (which refuses it as a homograph), never the
      // inflected map.
      expect(resolveBuildTileKanji("した", 99)).toBeNull();
    });

    describe("kanji-less collision with an independently conjugatable verb (TestFlight #124b, 2026-09-15)", () => {
      // 書ける (potential of 書く) used to bind to the UNRELATED かける
      // "to make a phone call" atom, because the old guard only refused a
      // collision when the colliding atom HAD a stored `kanji` field —
      // かける has none. courseAtoms.ts ~:1413 documents all three of these
      // pairs as potential forms authors deliberately never registered for
      // exactly this reason; the inflected map must independently agree,
      // since it derives potentials programmatically rather than reading
      // that curated list.
      it("かく → かける collides with the unrelated かける 'to call' atom (no kanji) — stays kana", () => {
        const kakuAtomId = resolveEligibleKanjiAtomId("かく")!;
        expect(kakuAtomId).toBeTruthy();
        const kakeruAtom = JA_COURSE_ATOMS.find((a) => a.kana === "かける");
        expect(kakeruAtom?.kanji).toBeUndefined(); // the exact bug precondition
        expect(kakeruAtom?.conjugation).toBeTruthy(); // — but it's its OWN verb
        expect(resolveBuildTileKanji("かける", 99)).toBeNull();
      });

      it("つける ('to turn on', no kanji, its own conjugation) never resolves as an inflected surface", () => {
        // courseAtoms.ts ~:1413 names つく → つける as a rejected potential
        // (collides with this atom). つく (着く, "to arrive") is itself
        // gated off `resolveEligibleKanjiAtomId` for an unrelated reason
        // (a `reservedInflections` collision), so this course's data can't
        // actually exercise "つく enumerates つける" today — but the
        // GUARD's job is the same regardless of which verb's potential
        // would land on this kana: つける must never bind to anything, the
        // same behavior as the かける case above.
        const tsukeruAtom = JA_COURSE_ATOMS.find((a) => a.kana === "つける");
        expect(tsukeruAtom?.kanji).toBeUndefined();
        expect(tsukeruAtom?.conjugation).toBeTruthy();
        expect(resolveBuildTileKanji("つける", 99)).toBeNull();
      });

      it("かう → かえる collides with the unrelated かえる 'to go back' atom (owns kanji, and — since the KANJICAT lane, 2026-09-18 — is itself catalog-eligible)", () => {
        // Pre-KANJICAT this stayed null for TWO independent reasons at
        // once: the collision guard (かえる "owns" its own kanji field, so
        // the inflected-surface map must never claim it for かう) AND
        // catalog incompleteness (帰 had no N5_KANJI entry, so かえる's own
        // kanji couldn't render at ANY module either). The KANJICAT lane
        // catalogued 帰 (introducedAtModule 20, anchored on this very
        // atom), so that second reason is gone — at module 99 (far past
        // unlock) かえる now correctly resolves to its OWN surface, 帰る.
        // What this test still pins is the FIRST reason: that surface must
        // be かえる's own resolution, never かう's borrowed one — i.e. the
        // collision guard, not the catalog gate, is what's under test now.
        const kauAtomId = resolveEligibleKanjiAtomId("かう")!;
        expect(kauAtomId).toBeTruthy();
        const kaeruAtom = JA_COURSE_ATOMS.find((a) => a.kana === "かえる");
        expect(kaeruAtom?.kanji).toBe("帰る");
        expect(resolveBuildTileKanji("かえる", 99)).toEqual(
          expect.objectContaining({ surface: "帰る", reading: "かえる" }),
        );
        // The actual guard: かう's OWN resolution must never be the thing
        // that produces かえる's surface — i.e. かう and かえる don't
        // cross-contaminate just because they share a kana prefix.
        const kauResolved = resolveBuildTileKanji("かう", 99);
        expect(kauResolved?.surface).not.toBe("帰る");
      });

      it("no regression: the genuinely kanji-less sibling forms (no conjugation of their own) still resolve", () => {
        // のまない/のめる/のみます are registered SURFACE forms of のむ with
        // no independent `conjugation` link — the fix must not block them.
        for (const kana of ["のまない", "のめる", "のみます"]) {
          const atom = JA_COURSE_ATOMS.find((a) => a.kana === kana);
          expect(atom, `${kana} should be a registered atom`).toBeTruthy();
          expect(atom?.conjugation).toBeUndefined();
          expect(resolveBuildTileKanji(kana, 99)).not.toBeNull();
        }
      });
    });
  });

  describe("auxiliary-position suppression (Spencer prod QA 2026-08-21 — 見る on m30's てみる helper tile)", () => {
    const REPRO_SENT = "この りょうりを たべてみる。";
    const REPRO_ORDER = ["この", "りょうり", "を", "たべて", "みる"];

    it("suppresses the helper tile glued behind its て-form — which WOULD kanji-fy", () => {
      const s = auxiliarySuppressedTiles(REPRO_SENT, REPRO_ORDER);
      expect([...s]).toEqual(["みる"]);
      // The hazard is real: unsuppressed, the resolver kanji-fies the helper.
      expect(resolveBuildTileKanji("みる", 30)?.surface).toBe("見る");
    });

    it("covers the helper's whole inflection family (the inflected-map path)", () => {
      for (const [form, sent, order] of [
        ["みた", "りょうりを たべてみた。", ["りょうり", "を", "たべて", "みた"]],
        ["みない", "りょうりを たべてみない？", ["りょうり", "を", "たべて", "みない"]],
        ["みたい", "りょうりを たべてみたい。", ["りょうり", "を", "たべて", "みたい"]],
      ] as const) {
        expect(auxiliarySuppressedTiles(sent, [...order]).has(form)).toBe(true);
        expect(
          resolveBuildTileKanji(form, 30),
          `${form} would kanji-fy unsuppressed`,
        ).not.toBeNull();
      }
    });

    it("a SPACED verb after a て-form clause is sequential, not auxiliary — keeps kanji", () => {
      const order = ["あさごはん", "を", "たべて", "がっこう", "に", "いく"];
      expect(
        auxiliarySuppressedTiles("あさごはんを たべて がっこうに いく。", order)
          .size,
      ).toBe(0);
    });

    it("suppression is orthography-driven, not catalog-driven (〜ておく / んで-glue)", () => {
      // おく never resolves today (置 absent from anchorVocab) — suppression
      // still names it, so a future catalog add cannot regress 〜ておく.
      expect(
        auxiliarySuppressedTiles("でんきを つけておく。", [
          "でんき",
          "を",
          "つけて",
          "おく",
        ]).has("おく"),
      ).toBe(true);
      // で-glued te-forms (のんでみる) are the same slot.
      expect(
        auxiliarySuppressedTiles("おちゃを のんでみる。", [
          "おちゃ",
          "を",
          "のんで",
          "みる",
        ]).has("みる"),
      ).toBe(true);
    });

    it("the て-form MAIN verb itself still kanji-fies", () => {
      expect(auxiliarySuppressedTiles(REPRO_SENT, REPRO_ORDER).has("たべて")).toBe(
        false,
      );
      expect(resolveBuildTileKanji("たべて", 30)?.surface).toBe("食べて");
    });

    it("live-course sweep: suppression engages on every glued-helper bank", () => {
      // Counts, not tautologies: how many build/listening steps carry a glued
      // helper, and how many of those tiles the resolver WOULD kanji-fy. m30
      // alone authors ~50 build + ~7 listening てみる/てみた/てみない steps,
      // so both floors prove the guard is live, not vacuous.
      let gluedHelperSteps = 0;
      let wouldHaveKanjified = 0;
      for (const { content: lesson } of getCompiledCourseFor("ja")) {
        const m = /^m(\d+)$/.exec(lesson.moduleId);
        const moduleIndex = m ? parseInt(m[1], 10) : parseModuleIndex(lesson.id);
        for (const step of lesson.steps) {
          if (step.type !== "build_sentence" && step.type !== "listening_build")
            continue;
          if (step.granularity !== "word") continue;
          const suppressed = auxiliarySuppressedTiles(
            step.targetSentence,
            step.correctOrder,
          );
          if (suppressed.size === 0) continue;
          gluedHelperSteps++;
          for (const kana of suppressed) {
            if (resolveBuildTileKanji(kana, moduleIndex)) wouldHaveKanjified++;
          }
        }
      }
      expect(gluedHelperSteps).toBeGreaterThan(40);
      expect(wouldHaveKanjified).toBeGreaterThan(30);
    });
  });

describe("suru-verb sibling parity (TestFlight #194 class)", () => {
  // The four courseAtoms.ts noun+する compounds with `conjugation.class:
  // "irregular"` (excluding bare する and 来る, which have single-kanji or
  // no-kanji surfaces and were never part of this gap — see
  // n5Kanji.ts's "M34 / M45" backfill comment for the full history: the
  // rollout catalog stopped growing at m27 and never added 練/習/掃/除/
  // 勉/強/散/歩, so every one of these atoms was structurally unable to
  // kanji-substitute anywhere, regardless of module).
  const SURU_COMPOUND_VERBS = [
    "benkyousuru",
    "soujisuru",
    "sanposuru",
    "renshuusuru",
  ] as const;
  // Atoms that are actually reachable by a learner today (real fromModule).
  // benkyousuru/sanposuru carry `fromModule: "future"` — unscheduled
  // backlog, never shown in any live lesson — so they are EXPECTED to stay
  // ungated-but-inert until someone schedules them; asserting them here
  // would be inventing a module this fix doesn't own.
  const LIVE_SURU_COMPOUND_VERBS = ["soujisuru", "renshuusuru"] as const;

  it("every suru-compound-verb atom is registered and has a kanji field", () => {
    for (const id of SURU_COMPOUND_VERBS) {
      const atom = JA_COURSE_ATOMS.find((a) => a.id === id);
      expect(atom, `${id} missing from courseAtoms.ts`).toBeTruthy();
      expect(atom!.kanji, `${id} has no kanji field`).toBeTruthy();
    }
  });

  it("both LIVE suru-compound verbs are catalog-eligible (KANJI_ELIGIBLE_ATOMS)", () => {
    for (const id of LIVE_SURU_COMPOUND_VERBS) {
      const entry = KANJI_ELIGIBLE_ATOMS.get(id);
      expect(entry, `${id} is not in KANJI_ELIGIBLE_ATOMS`).toBeTruthy();
    }
  });

  it("both LIVE suru-compound verbs kanji-fy on the tile surface at their own module, identically to a sibling like 学校/店", () => {
    for (const id of LIVE_SURU_COMPOUND_VERBS) {
      const kana = atomIdKana.get(id)!;
      const entry = KANJI_ELIGIBLE_ATOMS.get(id)!;
      const resolved = resolveBuildTileKanji(kana, entry.unlockModule);
      expect(resolved, `${id} (${kana}) did not kanji-fy at m${entry.unlockModule}`).toEqual({
        surface: entry.kanji,
        reading: kana,
        atomId: id,
      });
      // Stays kana below unlock — same contract as every other eligible atom.
      expect(resolveBuildTileKanji(kana, entry.unlockModule - 1)).toBeNull();
    }
  });

  it("れんしゅうする specifically resolves to 練習する (TestFlight #194's exact case)", () => {
    const entry = KANJI_ELIGIBLE_ATOMS.get("renshuusuru")!;
    expect(entry.kanji).toBe("練習する");
    expect(entry.unlockModule).toBe(34);
    expect(resolveBuildTileKanji("れんしゅうする", 34)).toEqual({
      surface: "練習する",
      reading: "れんしゅうする",
      atomId: "renshuusuru",
    });
  });

  it("the two unscheduled siblings (benkyousuru/sanposuru) are excluded by the 'future' gate, not a missing atom or a missing kanji field", () => {
    for (const id of SURU_COMPOUND_VERBS) {
      if ((LIVE_SURU_COMPOUND_VERBS as readonly string[]).includes(id)) continue;
      const atom = JA_COURSE_ATOMS.find((a) => a.id === id)!;
      expect(
        atom.fromModule,
        `${id} is expected to still be unscheduled ("future") — if this now fails, ` +
          `it has been scheduled and this test's LIVE_SURU_COMPOUND_VERBS list (and ` +
          `n5Kanji.ts's 勉/強/散/歩 entries) need to be added, same as れんしゅうする/そうじする`,
      ).toBe("future");
      // resolveEligibleKanjiAtomId's fromModule==="future" gate fires before
      // KANJI_ELIGIBLE_ATOMS membership is even consulted — confirm that's
      // really why these two stay kana today (not a registry gap this test
      // would otherwise miss).
      expect(resolveEligibleKanjiAtomId(atom.kana)).toBeUndefined();
    }
  });
});

describe("suru-verb dual noun/verb registration renders consistently across every tile surface", () => {
  // #194's screenshot is a `listening_build` step; #104/#110 (b13) were the
  // flashcard reviewer. This sweeps every LIVE build/listening_build step in
  // the compiled course and asserts the two live suru-compound verbs never
  // appear as a bare, un-kanji-fied tile once their module is reached — i.e.
  // the fix holds on the actual shipped content, not just in isolation.
  it("live-course sweep: れんしゅうする/そうじする tiles kanji-fy on every build/listening_build step that reaches their module", () => {
    const targets = new Map([
      ["れんしゅうする", KANJI_ELIGIBLE_ATOMS.get("renshuusuru")!],
      ["そうじする", KANJI_ELIGIBLE_ATOMS.get("soujisuru")!],
    ]);
    let sitesChecked = 0;
    for (const { content: lesson } of getCompiledCourseFor("ja")) {
      const m = /^m(\d+)$/.exec(lesson.moduleId);
      const moduleIndex = m ? parseInt(m[1], 10) : parseModuleIndex(lesson.id);
      if (moduleIndex == null) continue;
      for (const step of lesson.steps) {
        if (step.type !== "build_sentence" && step.type !== "listening_build")
          continue;
        if (step.granularity !== "word") continue;
        for (const [kana, entry] of targets) {
          if (!step.tiles.includes(kana)) continue;
          if (moduleIndex < entry.unlockModule) continue; // not unlocked yet here — fine
          sitesChecked++;
          expect(
            resolveBuildTileKanji(kana, moduleIndex),
            `${lesson.id}/${step.id}: ${kana} tile stayed kana at m${moduleIndex} (unlocked at m${entry.unlockModule})`,
          ).not.toBeNull();
        }
      }
    }
    expect(sitesChecked, "no live れんしゅうする/そうじする build tile found — fixture drifted").toBeGreaterThan(0);
  });
});

describe("resolveBuildTileKanji — catalog round-trip", () => {
  it("every eligible-catalog word round-trips through the tile derivation at its unlock", () => {
    // Sanity over the whole catalog: for each eligible atom whose kana the
    // conservative resolver accepts, the tile derivation agrees with the
    // catalog surface at unlock and refuses one module earlier.
    let checked = 0;
    for (const [atomId, entry] of KANJI_ELIGIBLE_ATOMS) {
      const kana = atomIdKana.get(atomId);
      if (!kana || resolveEligibleKanjiAtomId(kana) !== atomId) continue;
      checked++;
      expect(resolveBuildTileKanji(kana, entry.unlockModule)).toEqual({
        surface: entry.kanji,
        reading: kana,
        atomId,
      });
      expect(resolveBuildTileKanji(kana, entry.unlockModule - 1)).toBeNull();
    }
    expect(checked).toBeGreaterThan(20); // the layer is live, not vacuous
  });
});
});
