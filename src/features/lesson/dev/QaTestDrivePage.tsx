import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  ALL_STEP_TYPES,
  UNUSED_STEP_TYPES,
  buildStepTypeCoverage,
} from "./qaCatalog";

/**
 * DEV · QA test-drive checklist.
 *
 * One page linking every surface a human needs to exercise to judge the
 * learning path: 1-2 real lessons per step type, placement + per-module
 * test-outs, flashcards/SRS, trainers, and path surfaces — each row with
 * good/issue/broken marks and a critique box. Notes persist to
 * localStorage and export as markdown for handing back to an agent.
 */

type MarkStatus = "" | "good" | "issue" | "broken";
type ItemMark = { status: MarkStatus; note: string };
type QaNotes = { general: string; items: Record<string, ItemMark> };

// v2: notes are namespaced per language — row ids are language-agnostic
// (`step:<type>`), so one shared key would bleed ja verdicts onto the ko
// page. v1 (the 2026-07-12 ja drive) migrates in on first ja load.
const STORAGE_KEY_BASE = "lingo:qa-notes:v2";
const LEGACY_STORAGE_KEY = "lingo:qa-notes:v1";
const storageKeyFor = (lang: string) => `${STORAGE_KEY_BASE}:${lang}`;

function loadNotes(lang: string): QaNotes {
  try {
    const raw =
      localStorage.getItem(storageKeyFor(lang)) ??
      (lang === "ja" ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    if (raw) {
      const parsed = JSON.parse(raw) as QaNotes;
      // Harden against schema drift — export/textarea assume strings.
      const items: QaNotes["items"] = {};
      for (const [id, m] of Object.entries(parsed.items ?? {})) {
        items[id] = { status: m?.status ?? "", note: m?.note ?? "" };
      }
      return { general: parsed.general ?? "", items };
    }
  } catch {
    /* corrupt state falls through to fresh */
  }
  return { general: "", items: {} };
}

type QaLink = { label: string; href: string };
type QaItem = { id: string; title: string; links: QaLink[]; hint?: string };
type QaSection = { id: string; title: string; blurb?: string; items: QaItem[] };

/**
 * Durable verification notes surfaced under step-type rows — findings from
 * live QA that should stay visible on this page (Spencer's "leave a good
 * note here" requests land in this map).
 */
const VERIFIED_NOTES: Record<string, string> = {
  "step:info":
    "ja shipped ZERO info steps as of 2026-07-16 (info-step audit — recap/preview boilerplate cut, 20 teaching cards promoted to grammar_rule). This row is now es/ko-only; judge the info renderer on the es/ko QA pages. Prior finding still holds there: long info bodies scroll INSIDE the step scroller (overflow-y-auto), the window never scrolls even at 480px height.",
  "route:particles":
    "Spencer 2026-07-13: POTENTIAL DEPRECATE — simple particles get enough through-exposure in lessons; the reference page is a weak trainer. Revisit at the next surface cull.",
  "route:kanji":
    "Spencer 2026-07-13: empty today; individual kanji practice likely DEPRECATES too — kanji exposure should ride the course, not a standalone drill page. Same surface cull as particles.",
  "route:reading-speaking":
    "Spencer 2026-07-13: reading/speaking concepts AMAZING, content great — needs a visual refresh, kanji-where-applicable options, maybe longer stories (backlogged). speech-tune verified already dev-only: no user surface links it, URL access only.",
};

/**
 * Test recipes — how to reach states a plain link can't (failure paths,
 * reactive UI). Rendered in the row hint like VERIFIED_NOTES.
 */
const STEP_RECIPES: Record<string, string> = {
  "step:phrase_card":
    "⚠ Zero shipped usage since 2026-07-16 — its only host (survival-phrases sidequest) was deleted with the side-lesson content purge. Decide reintroduce-in-remade-sidequests vs delete the step type.",
  "step:row_test":
    "Recipe: to see the “Not this time” completion, fail items until retries run out, then take the Skip path.",
  "step:listening_build":
    "A silent play button = TTS manifest miss — mark broken and note the lesson id.",
  "step:listening_comprehension":
    "A silent play button = TTS manifest miss — mark broken and note the lesson id. KNOWN (queued, don't re-file): ~31 single-word LCs survive the sentence-first wave (がつ months, はち, に…) — the ratchet regex can't see them yet.",
};

const TESTOUT_MODULES = [
  "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
  "m11", "m12", "m13", "m14", "m15", "m16", "m17",
];

function buildSections(lang: string): QaSection[] {
  const p = (path: string) => `/${lang}${path}`;
  const coverage = buildStepTypeCoverage(lang);

  const stepItems: QaItem[] = coverage
    .filter((c) => c.picks.length > 0)
    .map((c) => ({
      id: `step:${c.type}`,
      title: c.type,
      hint: `${c.totalLessons} lesson${c.totalLessons === 1 ? "" : "s"} use this type`,
      links: [
        // ?step=<type> drops the tester on the FIRST step of this type —
        // no clicking through the lesson to reach the row being judged.
        ...c.picks.map((pick) => ({
          label: `${pick.moduleId} · ${pick.lessonId} (${pick.count}×)`,
          href: p(`/learn/lessons/${pick.lessonId}?step=${c.type}`),
        })),
        { label: "fixture", href: p(`/lesson-preview#step-${c.type}`) },
      ],
    }));

  // Types with zero STATIC lesson usage. Two different stories:
  //  - symbol_production SHIPS via the kana learn flow (alphabetSession
  //    generates it) — the static-lesson scan just can't see it. Link the
  //    real surface, don't call it unused.
  //  - fill_blank is genuinely unused anywhere. Decide: adopt or retire.
  const unusedItems: QaItem[] = ALL_STEP_TYPES.filter((t) =>
    UNUSED_STEP_TYPES.includes(t),
  ).map((t) =>
    t === "symbol_production"
      ? {
          id: `step:${t}`,
          title: `${t} — ships via kana learn flow`,
          hint: "Not in any static lesson, but alphabetSession generates it in /practice/alphabet/:id/learn (invisible to the catalog scan). Judge it there.",
          links: [
            { label: "hiragana learn", href: p("/practice/alphabet/hiragana/learn") },
            { label: "katakana learn", href: p("/practice/alphabet/katakana/learn") },
            { label: "fixture", href: p(`/lesson-preview#step-${t}`) },
          ],
        }
      : t === "dialogue_sim"
      ? {
          id: `step:${t}`,
          title: `${t} — PROTOTYPE, not in any lesson yet`,
          hint: "Simulation dialogue (2026-07-29): the learner IS the second speaker, one scenario per step. Its home is the Travel Sprint side quest, which is comingSoon/blocked on B066, so nothing authors it yet. The driver page frames it at lesson-shell heights and toggles listen-first mode.",
          links: [
            { label: "konbini driver", href: p("/qa/dialogue-sim") },
            { label: "fixture", href: p(`/lesson-preview#step-${t}`) },
          ],
        }
      : t === "info"
      ? {
          id: `step:${t}`,
          title: `${t} — removed from ja, still ships in es/ko`,
          hint: "Purged from the ja curriculum 2026-07-16 (recap/preview boilerplate cut; 20 teaching cards promoted to grammar_rule). es/ko still ship it — judge the renderer on those language QA pages, or the fixture.",
          links: [{ label: "fixture", href: p(`/lesson-preview#step-${t}`) }],
        }
      : {
          id: `step:${t}`,
          title: `${t} — unused in shipped content`,
          hint: "Engine + fixture exist but no static lesson uses it. Decide: adopt or retire.",
          links: [{ label: "fixture", href: p(`/lesson-preview#step-${t}`) }],
        },
  );

  // Append recipe + verified-finding hints to ANY row by id (step rows,
  // unused rows, and route rows all get the same treatment).
  const decorate = (items: QaItem[]): QaItem[] =>
    items.map((i) => {
      const extra = [STEP_RECIPES[i.id], VERIFIED_NOTES[i.id]].filter(Boolean);
      return extra.length
        ? { ...i, hint: [i.hint, ...extra].filter(Boolean).join(" · ") }
        : i;
    });

  const sections: QaSection[] = [
    {
      id: "kanji",
      title: "Kanji rollout — spot checks (2026-07-16)",
      blurb:
        "The script ladder is live: romaji dies entering m7, kanji recognition starts m8 (kanji + furigana), furigana comes off 2 modules after a kanji unlocks (\"production\"), and romaji + kanji can never co-exist. Typed answers in kana always grade correct.",
      items: [
        {
          id: "kanji:m8-furigana-on",
          title: "m8 — kanji WITH furigana (window open)",
          hint: "Numbers show as kanji (一, 七…) with small kana floating above. NO romaji anywhere on kanji. ja-m8-6-1 has the most (4 surfaces).",
          links: [
            { label: "ja-m8-6-1 (一, 七 ×4)", href: p("/learn/lessons/ja-m8-6-1") },
            { label: "ja-m8-1-2 (三)", href: p("/learn/lessons/ja-m8-1-2") },
          ],
        },
        {
          id: "kanji:m9-furigana-on",
          title: "m9 — m8/m9 kanji still inside their window",
          hint: "ja-m9-7-1 carries 6 kanji surfaces (八, 六, 四…), all still with furigana.",
          links: [{ label: "ja-m9-7-1 (6 surfaces)", href: p("/learn/lessons/ja-m9-7-1") }],
        },
        {
          id: "kanji:m10-furigana-off",
          title: "m10 — m8 kanji reads COLD (furigana gone)",
          hint: "八 / 十 unlocked at m8, so at m10 the window is closed: bare kanji, no floating kana, no romaji. If you still see furigana here, mark broken.",
          links: [{ label: "ja-m10-2-1 (八, 十)", href: p("/learn/lessons/ja-m10-2-1") }],
        },
        {
          id: "kanji:review-mix",
          title: "m10 review — bakes m8 (cold) + m9 (furigana) together",
          hint: "One review, two states: m8 vocab bare kanji, m9 vocab still furigana'd. This is the 'reviews bake in production' behavior.",
          links: [{ label: "ja-m10-review-1", href: p("/learn/lessons/ja-m10-review-1") }],
        },
        {
          id: "kanji:late-module",
          title: "m17 — multi-kanji word, ruby layout",
          hint: "後ろ in the speaking step — the ruby-measured spot (clean at 390px–4K). Check it by eye too.",
          links: [{ label: "ja-m17-8-1 speaking (後ろ)", href: p("/learn/lessons/ja-m17-8-1?step=speaking") }],
        },
        {
          id: "kanji:none-pre-m8",
          title: "m7 — ZERO kanji (readable check)",
          hint: "Pre-m8 stays pure kana so you can read everything: no kanji anywhere in this lesson (content-gate tested; verify by eye). Romaji is also off from m7.",
          links: [{ label: "ja-m7-1-1 (pure kana)", href: p("/learn/lessons/ja-m7-1-1") }],
        },
      ],
    },
    {
      id: "n4-pilot-m29",
      title: "N4 pilot — m29 plain form (2026-07-16)",
      blurb:
        "First module of the N4 tier, authored as the exemplar every later N4 module copies. Grammar anchor: plain form (dictionary/ない/た/なかった) taught as the base ます is built from, not as 'casual ます.' NOT registered in mockCourse.ts (would rebalance the live N5 map's 3 geometric zones) — review these lessons directly, not via the learn map. Reviews ja-m29-review-1/2 are derived, not linked here.",
      items: [
        {
          id: "n4:m29-1-1",
          title: "1-1 — Dictionary form, う-verbs I (new: てつだう, いそぐ, つかう)",
          links: [{ label: "ja-m29-1-1", href: p("/learn/lessons/ja-m29-1-1") }],
        },
        {
          id: "n4:m29-1-2",
          title: "1-2 — Dictionary form, う-verbs II (new: さがす, なおす, はこぶ, えらぶ)",
          links: [{ label: "ja-m29-1-2", href: p("/learn/lessons/ja-m29-1-2") }],
        },
        {
          id: "n4:m29-2-1",
          title: "2-1 — Dictionary form, る-verbs + する (new: かたづける, おぼえる)",
          links: [{ label: "ja-m29-2-1", href: p("/learn/lessons/ja-m29-2-1") }],
        },
        {
          id: "n4:m29-2-2",
          title: "2-2 — くる irregular + mixed practice (new: ぜんぶ, blocked)",
          links: [{ label: "ja-m29-2-2", href: p("/learn/lessons/ja-m29-2-2") }],
        },
        {
          id: "n4:m29-3-1",
          title: "3-1 — ない form (plain negative), う-verbs",
          links: [{ label: "ja-m29-3-1", href: p("/learn/lessons/ja-m29-3-1") }],
        },
        {
          id: "n4:m29-3-2",
          title: "3-2 — ない form, る-verbs + irregulars",
          links: [{ label: "ja-m29-3-2", href: p("/learn/lessons/ja-m29-3-2") }],
        },
        {
          id: "n4:m29-4-1",
          title: "4-1 — た form (plain past), leverages known て-form",
          hint: "Carries a kanji_reading spot check on たべる (食べる, unlocked m14).",
          links: [
            { label: "ja-m29-4-1", href: p("/learn/lessons/ja-m29-4-1") },
            { label: "kanji_reading step", href: p("/learn/lessons/ja-m29-4-1?step=kanji_reading") },
          ],
        },
        {
          id: "n4:m29-4-2",
          title: "4-2 — た form II: irregulars + mixed",
          links: [{ label: "ja-m29-4-2", href: p("/learn/lessons/ja-m29-4-2") }],
        },
        {
          id: "n4:m29-5-1",
          title: "5-1 — なかった (plain past negative) I",
          links: [{ label: "ja-m29-5-1", href: p("/learn/lessons/ja-m29-5-1") }],
        },
        {
          id: "n4:m29-5-2",
          title: "5-2 — なかった II + じぶん/ともだち review context",
          links: [{ label: "ja-m29-5-2", href: p("/learn/lessons/ja-m29-5-2") }],
        },
        {
          id: "n4:m29-6-1",
          title: "6-1 — Mixed plain-form interleave I",
          hint: "Carries a kanji_reading spot check on よむ (読む, unlocked m14).",
          links: [
            { label: "ja-m29-6-1", href: p("/learn/lessons/ja-m29-6-1") },
            { label: "kanji_reading step", href: p("/learn/lessons/ja-m29-6-1?step=kanji_reading") },
          ],
        },
        {
          id: "n4:m29-6-2",
          title: "6-2 — Mixed plain-form interleave II (heavier rotation)",
          links: [{ label: "ja-m29-6-2", href: p("/learn/lessons/ja-m29-6-2") }],
        },
        {
          id: "n4:m29-story",
          title: "Story — ゆき and けん make plans (casual plain form in the wild)",
          links: [{ label: "ja-m29-story", href: p("/learn/lessons/ja-m29-story") }],
        },
        {
          id: "n4:m29-7-1",
          title: "7-1 — Comprehension drill (mixed forms)",
          hint: "Carries a kanji_reading spot check on いく (行く, unlocked m15).",
          links: [
            { label: "ja-m29-7-1", href: p("/learn/lessons/ja-m29-7-1") },
            { label: "kanji_reading step", href: p("/learn/lessons/ja-m29-7-1?step=kanji_reading") },
          ],
        },
        {
          id: "n4:m29-7-2",
          title: "7-2 — Final production",
          links: [{ label: "ja-m29-7-2", href: p("/learn/lessons/ja-m29-7-2") }],
        },
      ],
    },
    {
      id: "fixes",
      title: "Tonight's fixes — re-verify (2026-07-12 evening)",
      blurb:
        "Everything the audit/review round changed since your last drive. Judge these first — each row says exactly what changed and what correct looks like.",
      items: [
        {
          id: "fix:quickfix-keyboard",
          title: "Quick Fix modal — keyboard now trapped",
          links: [
            {
              label: "m27 · ja-m27-2-1",
              href: p("/learn/lessons/ja-m27-2-1?step=grammar_rule"),
            },
          ],
          hint: "Was: Enter advanced the lesson BEHIND the open modal and could never dismiss it. Now: miss the drill after the rule card → modal opens; Enter/Esc/Space must CLOSE it, step stays put, nothing advances behind the overlay.",
        },
        {
          id: "fix:placement-gloss",
          title: "Placement/test-out cloze glosses with apostrophes",
          links: [
            { label: "test-out m11", href: p("/learn/test-out/m11") },
            { label: "placement", href: p("/learn/placement-test") },
          ],
          hint: "Was: 9 items truncated at the apostrophe (“I don”, “Let”). Now the full quoted English must show — “I don't eat bread”. (Known cosmetic leftover, don't re-file: occasional leading-space or unnatural-split chips.)",
        },
        {
          id: "fix:translate-punct",
          title: "Translate — trailing period no longer fails",
          links: [
            {
              label: "m11 · ja-m11-7-2",
              href: p("/learn/lessons/ja-m11-7-2?step=translate"),
            },
          ],
          hint: "Type a correct answer ending with “.” — the IME turns it into 。 and it previously graded WRONG. Must grade correct now.",
        },
        {
          id: "fix:romaji-assumed",
          title: "Romaji auto-off now counts ASSUMED modules",
          links: [
            { label: "placement", href: p("/learn/placement-test") },
            { label: "m10 · ja-m10-1-1", href: p("/learn/lessons/ja-m10-1-1") },
          ],
          hint: "Place so m10+ is credited (passed OR “credited from your level”) → open the m10 lesson: hiragana romaji scaffold should be gone. Previously only PASSED modules triggered the fade.",
        },
        {
          id: "fix:content-items",
          title: "Fixed content: m22 いちばん semantics, m13 かおを split, 294 TTS clips",
          links: [
            {
              label: "m22 · ja-m22-5-2",
              href: p("/learn/lessons/ja-m22-5-2?step=listening_comprehension"),
            },
            {
              label: "m22 · ja-m22-7-2",
              href: p("/learn/lessons/ja-m22-7-2?step=listening_comprehension"),
            },
            {
              label: "m13 · ja-m13-5-1",
              href: p("/learn/lessons/ja-m13-5-1?step=listening_build"),
            },
          ],
          hint: "m22: the いちばん items now say みっつの まちのなかで (audio + gloss must match — was “inside this town” × Kyoto). m13: かお|を are separate tiles like シャワー|を. And review-tail audio got a 294-clip backfill — ANY silent play button anywhere is a bug now.",
        },
      ],
    },
    {
      id: "steps",
      title: "Step types in real lessons",
      blurb:
        "Every step type the engine ships, linked to 1-2 real lessons that use it (early + late module). Links land ON the first step of that type. Play at least one lesson per row.",
      items: [...stepItems, ...unusedItems],
    },
    {
      id: "mechanics",
      title: "New mechanics & failure states",
      blurb:
        "States a plain link can't reach — each row says how to trigger it. These are the newest moving parts; judge them hardest.",
      items: [
        {
          id: "mech:microteach",
          title: "Grammar micro-teaching (Quick Fix + spot MCQ)",
          links: [
            {
              label: "m27 · ja-m27-2-1 (verified in tests)",
              href: p("/learn/lessons/ja-m27-2-1?step=grammar_rule"),
            },
            {
              label: "m3 · ja-m3-2-1 (earliest)",
              href: p("/learn/lessons/ja-m3-2-1?step=grammar_rule"),
            },
          ],
          hint: "Read the rule card, then miss the NEXT drill on purpose → the Quick Fix modal (✗ struck wrong / ✓ right / rule again) should flash ONCE per grammar point. At the end of the drill span expect the 2-option spot-the-mistake MCQ — no audio, romaji hidden. KNOWN (agenda §POST-PUSH, don't re-file): a wrong answer on the end-of-lesson recap steps can pop the tip as a non-sequitur; the spot lands at lesson end rather than capping the drills; ja-m17-2-1's first rule (に) loses its spot to the back-to-back card.",
        },
        {
          id: "mech:complete-fail",
          title: "Lesson complete — failed run (+0 XP advisory)",
          links: [
            { label: "short graded lesson", href: p("/learn/lessons/ja-m3-2-1") },
          ],
          hint: "Miss ≥30% of graded steps on purpose. Completion must show +0 XP with the “Score 70%+ to earn XP” advisory — and the server XP total must agree (no phantom XP on refresh).",
        },
        {
          id: "mech:romaji-fade",
          title: "Romaji fade inside lessons (hiragana ≥m10, katakana ≥m17)",
          links: [
            { label: "m10 lesson", href: p("/learn/lessons/ja-m10-1-1?step=build_sentence") },
            { label: "m17 lesson", href: p("/learn/lessons/ja-m17-1-1") },
          ],
          hint: "Requires your placement/progress to have reached the module (romaji auto-off fires on placement). Check: no romaji under tiles/prompts at m10+, katakana romaji also gone at m17+.",
        },
        {
          id: "mech:consent-squeeze",
          title: "Cookie-consent banner + lesson shell squeeze",
          links: [{ label: "any lesson", href: p("/learn/lessons/ja-m3-2-1") }],
          hint: "Run localStorage.removeItem(\"open-lingo-cookie-consent\") in the console, reload a lesson: the banner must SQUEEZE the lesson shell (Continue button stays visible), not overlap it.",
        },
      ],
    },
    {
      id: "testout",
      title: "Placement & test-out",
      items: [
        {
          id: "route:placement",
          title: "Adaptive placement test",
          links: [{ label: "placement-test", href: p("/learn/placement-test") }],
          hint: "JUDGE ON A CLEAN SLATE: dev panel → Clear progress FIRST. Placement only ADDS credit — it never revokes prior completions, so earlier QA rows (romaji-assumed run, test-outs) leave credits that read as false awards on the result screen. FTUE offer appears on Learn at 0 progress.",
        },
        {
          id: "route:testout",
          title: "Per-module test-outs (m3–m17)",
          links: TESTOUT_MODULES.map((m) => ({
            label: m,
            href: p(`/learn/test-out/${m}`),
          })),
          hint: "Compare against docs/placement-testout-derived-2026-07-08.md — derived sets are built but the live route still serves the old bank until spot-check sign-off.",
        },
      ],
    },
    {
      id: "srs",
      title: "Flashcards & SRS",
      items: [
        {
          id: "route:fc-review",
          title: "Flashcard reviewer (course deck)",
          links: [
            { label: "review", href: p("/practice/flashcards/review") },
            { label: "hub", href: p("/practice/flashcards") },
          ],
        },
        {
          id: "route:fc-manage",
          title: "Card / deck managers",
          links: [
            { label: "cards", href: p("/practice/flashcards/cards") },
            { label: "decks", href: p("/practice/flashcards/decks") },
          ],
        },
        {
          id: "route:grammar-deck",
          title: "Grammar review deck",
          links: [
            { label: "hub", href: p("/practice/grammar") },
            { label: "review", href: p("/practice/grammar/review") },
            {
              label: "practice anyway",
              href: p("/practice/grammar/review?practice=1"),
            },
          ],
          hint: "Caught-up empty state should show next-due timing; dev panel has “Make all grammar due”.",
        },
        {
          id: "route:review-lessons",
          title: "SRS review lessons (dynamic)",
          links: [
            { label: "m5 review 1", href: p("/learn/lessons/ja-m5-review-1") },
            { label: "m10 review 2", href: p("/learn/lessons/ja-m10-review-2") },
            { label: "m17 review 1", href: p("/learn/lessons/ja-m17-review-1") },
          ],
        },
      ],
    },
    {
      id: "trainers",
      title: "Trainers",
      items: [
        {
          id: "route:conjugation",
          title: "Conjugation trainer",
          links: [
            { label: "hub", href: p("/practice/grammar/conjugation") },
            { label: "free drill", href: p("/practice/grammar/conjugation/free") },
            {
              // /train redirects to the hub without 2+ valid type ids —
              // preselect a sane pair so the link demos the session.
              label: "combined (masu+te)",
              href: p("/practice/grammar/conjugation/train?types=masu,te-form"),
            },
          ],
        },
        {
          id: "route:counters",
          title: "Counters trainer",
          links: [{ label: "counters", href: p("/practice/counters") }],
        },
        {
          id: "route:particles",
          title: "Particle reference (static guide, not a drill)",
          links: [{ label: "particles", href: p("/practice/grammar/particles") }],
          hint: "Relabeled as a reference on the hub; drilling happens via ParticleCloze in lessons + grammar deck.",
        },
        {
          id: "route:alphabet",
          title: "Alphabet trainers",
          links: [
            { label: "hub", href: p("/practice/alphabet") },
            { label: "hiragana", href: p("/practice/alphabet/hiragana") },
            { label: "katakana", href: p("/practice/alphabet/katakana") },
          ],
        },
        {
          id: "route:kanji",
          title: "Kanji practice",
          links: [{ label: "kanji", href: p("/practice/kanji") }],
        },
        {
          id: "route:reading-speaking",
          title: "Reading / speaking practice",
          links: [
            { label: "stories", href: p("/practice/stories") },
            { label: "cloze", href: p("/practice/cloze") },
            { label: "speaking", href: p("/practice/speaking") },
            { label: "speech-tune", href: p("/speech-tune") },
          ],
        },
      ],
    },
    {
      id: "path",
      title: "Learning path & surfaces",
      items: [
        {
          id: "route:learn",
          title: "Learn map (current-module focus, romaji fade state)",
          links: [
            { label: "learn", href: p("/learn") },
            { label: "course map", href: p("/learn/course") },
          ],
        },
        {
          id: "route:story",
          title: "Story capstones",
          links: [
            { label: "m4 story", href: p("/learn/lessons/ja-m4-story") },
            { label: "m10 story", href: p("/learn/lessons/ja-m10-story") },
            { label: "story library", href: p("/practice/stories") },
          ],
          hint: "The story library is a shipped, unflagged surface (no feature flag gates it anymore). Capstone lessons above route into it as required pathway nodes.",
        },
        {
          id: "route:ftue",
          title: "FTUE → placement offer",
          links: [{ label: "learn (after reset)", href: p("/learn") }],
          hint: "Dev panel → Clear progress (now wipes server too) → FTUE should survive hydration and reach the placement offer.",
        },
        {
          id: "route:journey",
          title: "Progress / journey page",
          links: [{ label: "journey", href: p("/practice/journey") }],
        },
        // route:travel-sprint removed 2026-07-16 — sprint lessons deleted
        // pending content remake; re-add when the hub route returns.
        {
          id: "route:try",
          title: "/try preview funnel (prospective-learner first lesson)",
          links: [{ label: "/try", href: "/try" }],
          hint: "Top-level route, no language prefix. Ends in the signup CTA — judge it as a stranger's first 3 minutes.",
        },
        {
          id: "route:settings",
          title: "Settings that change lessons (romaji master toggle, theme/font)",
          links: [{ label: "settings", href: "/settings" }],
          hint: "Opens the settings modal over /home. Flip Appearance (theme, dyslexia font) and the romaji toggle, then re-open a lesson to verify they land.",
        },
        {
          id: "route:misc",
          title: "Vocab / practice hub / home",
          links: [
            { label: "vocab", href: p("/vocab") },
            { label: "practice hub", href: p("/practice") },
            { label: "home", href: "/home" },
          ],
        },
      ],
    },
  ];
  // "fixes" + "mechanics" + "n4-pilot-m29" carry hardcoded ja lesson links;
  // under another language prefix they'd mint cross-language URLs
  // (/es/learn/lessons/ja-…). Language-specific drive sections stay ja-only.
  const forLang =
    lang === "ja"
      ? sections
      : sections.filter(
          (s) => s.id !== "fixes" && s.id !== "mechanics" && s.id !== "n4-pilot-m29",
        );
  return forLang.map((s) => ({ ...s, items: decorate(s.items) }));
}

const STATUS_META: {
  value: Exclude<MarkStatus, "">;
  label: string;
  active: string;
}[] = [
  { value: "good", label: "✓ good", active: "border-success text-success" },
  { value: "issue", label: "⚠ issue", active: "border-warning text-warning" },
  { value: "broken", label: "✗ broken", active: "border-error text-error" },
];

export default function QaTestDrivePage() {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const sections = useMemo(() => buildSections(langId), [langId]);
  const [notes, setNotes] = useState<QaNotes>(() => loadNotes(langId));
  const [exportState, setExportState] = useState<
    "idle" | "copied" | "downloaded"
  >("idle");
  // True after the FIRST user edit this session (mark, note, or reset) —
  // gates the mirror POST so passive opens never clobber the shared file.
  const dirtyRef = useRef(false);

  // Language switch mid-session: swap to that language's note set.
  useEffect(() => {
    setNotes(loadNotes(langId));
  }, [langId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFor(langId), JSON.stringify(notes));
    } catch {
      /* storage full/unavailable — notes stay in memory */
    }
  }, [notes, langId]);

  // Mirror notes to the dev server so an agent can watch critiques land
  // live while the tester works (vite middleware /__lingo-qa-notes →
  // /tmp/lingo-qa-notes.json — same pattern as the devLog console pipe).
  // Debounced fire-and-forget; failures are irrelevant in prod builds
  // where the middleware doesn't exist. Two guards:
  //  - a session that never EDITED never POSTs (a second browser/incognito
  //    opening the page must not clobber the shared mirror with empties) —
  //    but an explicit Reset counts as an edit, so clearing notes DOES
  //    reach the mirror instead of leaving stale verdicts;
  //  - pagehide flushes via sendBeacon, closing the "typed a verdict and
  //    closed the tab inside the debounce window" loss hole.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const payload = () =>
      JSON.stringify({ savedAt: new Date().toISOString(), ...notes });
    const handle = setTimeout(() => {
      void fetch("/__lingo-qa-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload(),
      }).catch(() => undefined);
    }, 1000);
    const flush = () => {
      try {
        navigator.sendBeacon?.(
          "/__lingo-qa-notes",
          new Blob([payload()], { type: "application/json" }),
        );
      } catch {
        /* no beacon (old browser) — debounced POST already covered most */
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(handle);
      window.removeEventListener("pagehide", flush);
    };
  }, [notes]);

  const allItems = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );
  const markedCount = allItems.filter(
    (i) => notes.items[i.id]?.status || notes.items[i.id]?.note?.trim(),
  ).length;

  const setMark = (id: string, patch: Partial<ItemMark>) => {
    dirtyRef.current = true;
    setNotes((n) => {
      const prev: ItemMark = n.items[id] ?? { status: "", note: "" };
      return { ...n, items: { ...n.items, [id]: { ...prev, ...patch } } };
    });
  };

  const exportMarkdown = () => {
    const lines: string[] = [
      `# Lingo QA test-drive notes`,
      `_Exported ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${markedCount}/${allItems.length} items marked_`,
      "",
    ];
    if (notes.general.trim()) {
      lines.push("## General", notes.general.trim(), "");
    }
    for (const section of sections) {
      const marked = section.items.filter(
        (i) => notes.items[i.id]?.status || notes.items[i.id]?.note?.trim(),
      );
      if (marked.length === 0) continue;
      lines.push(`## ${section.title}`);
      for (const item of marked) {
        const mark = notes.items[item.id];
        lines.push(
          `- **${item.title}** — ${mark.status ? mark.status.toUpperCase() : "(no verdict)"}`,
        );
        if ((mark.note ?? "").trim()) {
          for (const noteLine of mark.note.trim().split("\n")) {
            lines.push(`  - ${noteLine}`);
          }
        }
      }
      lines.push("");
    }
    // Notes whose row left the catalog (type renamed, pick reshuffled)
    // must not silently vanish from the handoff.
    const knownIds = new Set(allItems.map((i) => i.id));
    const orphans = Object.entries(notes.items).filter(
      ([id, m]) => !knownIds.has(id) && (m.status || (m.note ?? "").trim()),
    );
    if (orphans.length > 0) {
      lines.push("## Orphaned notes (row no longer on page)");
      for (const [id, m] of orphans) {
        lines.push(`- **${id}** — ${m.status ? m.status.toUpperCase() : "(no verdict)"}`);
        if ((m.note ?? "").trim()) {
          for (const noteLine of m.note.trim().split("\n")) {
            lines.push(`  - ${noteLine}`);
          }
        }
      }
      lines.push("");
    }
    const md = lines.join("\n");
    void navigator.clipboard?.writeText(md).then(
      () => {
        setExportState("copied");
        setTimeout(() => setExportState("idle"), 2000);
      },
      () => undefined,
    );
    if (!navigator.clipboard) {
      // http-over-LAN (phone testing) has no clipboard API — say so
      // instead of silently only downloading.
      setExportState("downloaded");
      setTimeout(() => setExportState("idle"), 3000);
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qa-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const jumpToFirstUnmarked = () => {
    const first = allItems.find(
      (i) => !notes.items[i.id]?.status && !(notes.items[i.id]?.note ?? "").trim(),
    );
    if (!first) return;
    document
      .getElementById(`row-${first.id}`)
      ?.scrollIntoView({ block: "center" });
  };

  const resetNotes = () => {
    if (window.confirm("Clear all QA notes and verdicts?")) {
      dirtyRef.current = true; // reset must reach the mirror too
      setNotes({ general: "", items: {} });
    }
  };

  return (
    // Dev routes hang directly off LangLayout (no app shell), so this page
    // must paint its own themed background — without it, dark themes render
    // light text on the default white body.
    <div className="min-h-screen bg-background text-text-primary">
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 border-b border-border pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
          DEV · QA test-drive
        </div>
        <h1 className="m-0 mt-1 text-2xl font-bold">
          Learning-path test drive
        </h1>
        <p className="m-0 mt-2 text-sm text-text-secondary">
          Work top to bottom: every link opens in ONE shared play tab (no
          tab pile-up), lesson links land on the exact step, then mark the
          row and drop critiques in the box. Notes persist in this browser
          AND mirror to the dev workshop ~1s after you pause; closing or
          hiding this tab flushes immediately. “Export” still works as the
          offline fallback.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded border border-border bg-surface-muted px-2 py-1 text-xs font-semibold">
            {markedCount}/{allItems.length} marked
          </span>
          <button
            type="button"
            onClick={jumpToFirstUnmarked}
            className="rounded border border-accent px-2 py-1 text-xs font-semibold text-accent hover:bg-surface-muted"
          >
            Jump to first unmarked
          </button>
          <button
            type="button"
            onClick={exportMarkdown}
            className="rounded border border-accent px-2 py-1 text-xs font-semibold text-accent hover:bg-surface-muted"
          >
            {exportState === "copied"
              ? "Copied!"
              : exportState === "downloaded"
                ? "Downloaded (no clipboard)"
                : "Export notes (copy + download)"}
          </button>
          <button
            type="button"
            onClick={resetNotes}
            className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-surface-muted"
          >
            Reset notes
          </button>
        </div>
        <nav className="mt-3 flex flex-wrap gap-2 text-xs">
          {sections.map((s) => {
            const done = s.items.filter(
              (i) =>
                notes.items[i.id]?.status ||
                (notes.items[i.id]?.note ?? "").trim(),
            ).length;
            return (
              <a
                key={s.id}
                href={`#qa-${s.id}`}
                className="rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
              >
                {s.title}
                <span
                  className={
                    done === s.items.length
                      ? "ml-1 font-semibold text-success"
                      : "ml-1 text-text-muted"
                  }
                >
                  {done}/{s.items.length}
                </span>
              </a>
            );
          })}
        </nav>
        {/* Review queue — plain-language decisions/findings waiting on
            Spencer, answerable in place (same notes-mirror pattern). */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-text-muted">
            Feedback
          </span>
          <Link
            to={`/${langId}/qa/review`}
            className="rounded border border-warning px-2 py-0.5 font-semibold text-warning hover:bg-surface-muted"
          >
            review queue — decisions waiting on you
          </Link>
        </div>
        {/* Design galleries — NOT part of the marked walk above, so they have no
            row and no status. They live here because the only other way in was
            typing the URL, and a gallery nobody can find is a gallery nobody
            uses (2026-07-29). */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-text-muted">
            Design galleries
          </span>
          <Link
            to={`/${langId}/qa/kanji-reveal`}
            className="rounded border border-accent px-2 py-0.5 font-semibold text-accent hover:bg-surface-muted"
          >
            kana→kanji reveal animations
          </Link>
          <Link
            to={`/${langId}/qa/kanji-switchover`}
            className="rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            switchover variants
          </Link>
          <Link
            to={`/${langId}/qa/register`}
            className="rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            register variants
          </Link>
          <Link
            to={`/${langId}/qa/review-prefix`}
            className="rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
          >
            dynamic review prefix (B069)
          </Link>
        </div>
      </header>

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          General critiques
        </h2>
        <textarea
          value={notes.general}
          onChange={(e) => {
            dirtyRef.current = true;
            setNotes((n) => ({ ...n, general: e.target.value }));
          }}
          rows={3}
          placeholder="Anything cross-cutting: pacing, monotony, juice, difficulty curve…"
          className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
      </section>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={`qa-${section.id}`} className="scroll-mt-24">
            <h2 className="m-0 text-lg font-bold">{section.title}</h2>
            {section.blurb && (
              <p className="m-0 mt-1 text-xs text-text-secondary">
                {section.blurb}
              </p>
            )}
            <div className="mt-3 space-y-3">
              {section.items.map((item) => {
                const mark = notes.items[item.id] ?? { status: "", note: "" };
                return (
                  <div
                    key={item.id}
                    id={`row-${item.id}`}
                    className="scroll-mt-24 rounded-xl border border-border bg-surface p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold">
                          {item.title}
                        </div>
                        {item.hint && (
                          <div className="mt-0.5 text-xs text-text-muted">
                            {item.hint}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {STATUS_META.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() =>
                              setMark(item.id, {
                                status:
                                  mark.status === s.value ? "" : s.value,
                              })
                            }
                            className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                              mark.status === s.value
                                ? s.active
                                : "border-border text-text-muted hover:bg-surface-muted"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.links.map((link) => (
                        // Named target: every play link reuses ONE tab
                        // instead of piling up dozens. (No rel=noopener —
                        // it would sever the name link and re-spawn tabs.)
                        <a
                          key={link.href + link.label}
                          href={link.href}
                          target="lingo-qa-play"
                          className="rounded border border-border bg-background px-2 py-0.5 text-xs text-accent underline-offset-2 hover:underline"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                    <textarea
                      value={mark.note ?? ""}
                      onChange={(e) =>
                        setMark(item.id, { note: e.target.value })
                      }
                      rows={2}
                      placeholder="Critiques…"
                      className="mt-2 w-full rounded border border-border/60 bg-background px-2 py-1 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
    </div>
  );
}
