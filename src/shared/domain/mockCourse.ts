import type { Course, SideQuest } from "./course";
import { getLanguageConfig } from "./languageConfig";
import {
  HIRAGANA_ROWS,
  DAKUTEN_ROWS,
  YOON_ROWS,
  type RowDef,
} from "@/features/lesson/data/hiraganaCurriculum";
import { MODULE_RECAP_LESSON_IDS } from "@/features/lesson/data/generatedHiraganaLessons";
import { KO_M1_ROWS } from "@/features/languages/ko/curriculum/m1-rows";
import { KO_M2_ROWS } from "@/features/languages/ko/curriculum/m2";
import { buildSpanishCourse } from "@/features/languages/es/curriculum";
export const ALPHABET_LESSON_ID = "m1-l0-alphabet";

// `reviewModuleEntry` helper removed 2026-05-18 alongside the standalone
// inter-module Review pseudo-modules. The M3-M7 density rebuild now bakes
// compounding review into every sub-lesson tail (per
// docs/m3-m7-rebuild-spec-2026-05-18.md §3) so the separate pathway
// entries were dead weight. The lesson-data registration in
// `mockLessons.ts` was retired in the same edit.

export function getMockCourse(languageId: string): Course {
  const config = getLanguageConfig(languageId);
  const langName = config?.name ?? "Language";

  const alphabetLesson = config?.alphabet
    ? [
        {
          id: ALPHABET_LESSON_ID,
          title: `Learn the ${langName} Alphabet`,
          status: "available" as const,
          kind: "alphabet" as const,
          alphabetId: config.alphabet.id,
        },
      ]
    : [];

  const introLesson = config?.introLessonTitle
    ? [
        {
          id: "m1-l0",
          title: config.introLessonTitle,
          status: "available" as const,
        },
      ]
    : [];

  const isJapanese = languageId === "ja";

  if (isJapanese) {
    // Curriculum-restructure (2026-05-15; per-row row-tests retired
    // 2026-07-20):
    //   M1 = pure hiragana only (3 vowels + 9 base rows × 3 content +
    //        recap = 31 lessons).
    //   M2 = dakuten block (g/z/d/b/p, 3 content each) then yōon block
    //        (yoon-intro / yoon-sh-ch / yoon-voiced / yoon-rare each 3
    //        content) then recap = 28 lessons. The recap absorbs
    //        cross-yōon coverage (Hannah audit, 2026-05-17: standalone
    //        yoon-capstone removed) and is now the module's ★ mastery gate
    //        (row-tests removed — the recap is the only graded checkpoint).
    //
    // Yōon prereq: every yōon row carries `prerequisites: ["ya"]` which
    // `isLessonLocked` honors — yōon stays locked until the full ya-row
    // is complete, even when M2 itself is unlocked.

    // Emit one lesson per sub-lesson. Each sub-lesson becomes its own
    // pathway node; ModulePathway groups them into a row cluster by
    // parsing the id prefix.
    const rowToLessons = (row: RowDef | undefined) => {
      if (!row) return []; // defensive — yōon ids may transition during HMR
      const subs = row.subLessons ?? [];
      if (subs.length === 0) {
        return [
          {
            id: `ja-m1-${row.id}`,
            title: row.title,
            status: "available" as const,
          },
        ];
      }
      return subs.map((sub) => ({
        id: `ja-m1-${row.id}-${sub.suffix}`,
        title: `${row.title.split(":")[0]} — ${sub.label}`,
        status: "available" as const,
      }));
    };

    // Module 1 — pure hiragana. Vowels stub + 9 HIRAGANA_ROWS + recap.
    // The legacy "Learn the Alphabet" + "Intro to Japanese" lessons are
    // skipped for JA — learners go straight into vowels.
    const m1Lessons: {
      id: string;
      title: string;
      status: "available";
      kind?: "recap";
    }[] = [
      {
        id: "ja-m1-l1-1",
        title: "Vowels — あ い う",
        status: "available" as const,
      },
      {
        id: "ja-m1-l1-2",
        title: "Vowels — え お",
        status: "available" as const,
      },
      {
        id: "ja-m1-l1-3",
        title: "Vowels — Full Review",
        status: "available" as const,
      },
    ];
    for (const row of HIRAGANA_ROWS) {
      m1Lessons.push(...rowToLessons(row));
    }
    // Phase 2: module-recap node — final lesson, amber styling, ~15 items.
    const m1RecapId = MODULE_RECAP_LESSON_IDS["m1"];
    if (m1RecapId) {
      m1Lessons.push({
        id: m1RecapId,
        title: "Module 1 — Recap",
        status: "available" as const,
        kind: "recap" as const,
      });
    }

    // Module 2 — dakuten (g/z/d/b/p, 3 sub-lessons per row) +
    // yōon (4 rows × 3 sub-lessons) + recap.
    const m2Lessons: {
      id: string;
      title: string;
      status: "available";
      kind?: "recap";
    }[] = [];
    for (const row of DAKUTEN_ROWS) {
      m2Lessons.push(...rowToLessons(row));
    }
    for (const row of YOON_ROWS) {
      m2Lessons.push(...rowToLessons(row));
    }
    const m2RecapId = MODULE_RECAP_LESSON_IDS["m2"];
    if (m2RecapId) {
      m2Lessons.push({
        id: m2RecapId,
        title: "Module 2 — Recap",
        status: "available" as const,
        kind: "recap" as const,
      });
    }

    const sideQuests: SideQuest[] = [
      // Survival Phrasebook — PULLED from the map 2026-07-12 (Spencer QA
      // note: "I don't like the survival phrases quest for now"). Its
      // lessons were then DELETED 2026-07-16 with the rest of the
      // side-lesson content (all to be remade), so restoring this tile
      // now also needs a new ja-sidequest-survival-phrases lesson.
      // Original rationale: pinned day-1 unlock per curriculum-design-v2
      // §6, audio-driven, romaji-first (the Priya traveler persona).
      // {
      //   id: "ja-survival-phrasebook",
      //   emoji: "🗺️",
      //   title: "Survival Phrasebook",
      //   meta: "15 essentials · ~5 min · travel-ready",
      //   progress: 0,
      // },
      {
        id: "anime-vocab",
        emoji: "🌸",
        title: "Anime Vocab",
        meta: "12 words · senpai, kawaii…",
        progress: 0,
        comingSoon: true,
      },
      // Travel Sprint — lesson content DELETED 2026-07-16 (Spencer: side
      // lessons will be remade). comingSoon keeps the loop + 4 stop dots
      // on the transit map but makes every entry point inert.
      {
        id: "ja-travel-sprint",
        emoji: "✈️",
        title: "Travel Sprint",
        meta: "4 lessons · listen & speak · Pimsleur-style",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "festivals-culture",
        emoji: "⛩️",
        title: "Festivals & Culture",
        meta: "8 words · 桜, 祭, 神社",
        unlockAfter: "ja-m2-complete",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "gaming-vocab",
        emoji: "🎮",
        title: "Gaming Vocab",
        meta: "14 words · attack, level up, boss",
        unlockAfter: "ja-m2-complete",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "daily-challenge",
        emoji: "⚡",
        title: "Daily Challenge",
        meta: "+20 XP · 60s timer",
        progress: 0,
        isDaily: true,
        comingSoon: true,
      },
    ];

    // Placement test — the old shallow kana-only builder was removed;
    // the adaptive 2-stage placement engine (src/features/placement/)
    // superseded it.


    // ── REWRITE SPINE (draft-3, 2026-07-19) ──────────────────────────────
    // The dict-form-first big-bang rewrite replaced the old m3-m28 map with
    // the spine in src/features/lesson/dev/spinePlan.ts (SPINE_UNITS array
    // order IS module order; the locked `thr1` thread tile is not a module).
    // m3 = tile s03, already authored as the m3-neo pilot (7 lessons in
    // mockLessons.ts). Every later tile is a comingSoon placeholder module:
    // visible on the map as a locked station, zero lessons until authored.
    //
    // The OLD m3-m28 modules were removed from the MAP only — their lessons
    // stay registered in mockLessons.ts (deep-linkable via /ja/qa and
    // learn/lessons/:id) and their curriculum files are untouched.
    //
    // Module ids MUST stay sequential `mN`: the module NUMBER drives the
    // romaji/kanji ladders via parseModuleIndex, and the spine is engineered
    // so the register module lands on m7 (hiragana-romaji cutoff holds) and
    // navigation on m19 (katakana cutoff re-anchors there).
    // ── THE SPINE IS FULLY AUTHORED (2026-07-27, m29) ────────────────────
    // `SPINE_COMING_SOON` lived here and mapped the not-yet-authored tail of
    // the spine into placeholder modules. It is GONE because there is no tail
    // left: m29 (tile s25, the N5 capstone) is the last N5 module, so every
    // one of the spine's 24 tiles — n06a s07 n02 n03 n15 n04 s09 n05 s11 n06b
    // s13 n07 n08 s15 n09 s19 s17 s22 s21 n13 n14 s23 s24 s25 — is now a LIVE
    // module built by the compiler pipeline, and slicing an empty tail off an
    // array to spread nothing is worse than deleting it. The N5 map therefore
    // carries ZERO comingSoon modules; the N4 runway tile (s26) is
    // deliberately not a module, because the N5 map stops at the capstone.
    // The spine itself still lives in src/features/lesson/dev/spinePlan.ts.

    return {
      id: "mock-1",
      title: `${langName} for Beginners`,
      languageId,
      modules: [
        {
          id: "m1",
          title: "The first 46 sounds",
          eyebrow: "Module 1 · Hiragana",
          summary: "Foundation kana for reading anything written in Japanese.",
          lessons: m1Lessons,
          accent: { from: "#059669", to: "#047857" },
        },
        {
          id: "m2",
          title: "Dakuten · Handakuten · Yōon dakuten",
          eyebrow: "Module 2 · Voicing",
          summary: "Voiced consonants and yōon dakuten variations.",
          lessons: m2Lessons,
          accent: { from: "#6366f1", to: "#8b5cf6" },
        },
        // M3 — tile s03: the authored m3-neo pilot (dict-form-first rewrite).
        // Lessons live in features/languages/ja/curriculum/m3-neo.ts and are
        // registered in mockLessons.ts as ja-m3-neo-*.
        {
          id: "m3",
          title: "🧱 Plain sentences: だ, は, も",
          eyebrow: "Module 3 · Rewrite pilot",
          summary: "だ state-of-being from sentence one; は topic / も also; casual questions by intonation; survival sounds; です for recognition.",
          lessons: [
            { id: "ja-m3-neo-1", title: "It's a cat — だ", status: "available" as const },
            { id: "ja-m3-neo-2", title: "は — the spotlight", status: "available" as const },
            { id: "ja-m3-neo-3", title: "も — me too", status: "available" as const },
            { id: "ja-m3-neo-4", title: "Asking without か", status: "available" as const },
            { id: "ja-m3-neo-5", title: "Survival sounds", status: "available" as const },
            { id: "ja-m3-neo-6", title: "Story: meeting someone", status: "available" as const },
            { id: "ja-m3-neo-review", title: "Plain sentences — review", status: "available" as const },
          ],
          accent: { from: "#ec4899", to: "#db2777" },
        },
        // M4 — tile s04: possession & pointing (first at-scale rewrite
        // module, 12 lessons). curriculum/m4-neo-{a,b}.ts via m4-neo.ts.
        {
          id: "m4",
          title: "👉 Possession & pointing: の + これ/それ/あれ",
          eyebrow: "Module 4 · Rewrite",
          summary: "Point at the world: これ/それ/あれ/どれ; ask 何 and だれ; own things with の — possession, origin, and the ケンのだ short answer.",
          lessons: [
            { id: "ja-m4-neo-1", title: "これ — point and name", status: "available" as const },
            { id: "ja-m4-neo-2", title: "それ・あれ — the distance system", status: "available" as const },
            { id: "ja-m4-neo-3", title: "これ、なに？ — the pointer question", status: "available" as const },
            { id: "ja-m4-neo-4", title: "Objects II", status: "available" as const },
            { id: "ja-m4-neo-5", title: "の — possession", status: "available" as const },
            { id: "ja-m4-neo-6", title: "だれ — who (and whose)", status: "available" as const },
            { id: "ja-m4-neo-7", title: "Story: whose bag?", status: "available" as const },
            { id: "ja-m4-neo-8", title: "の — where things are from", status: "available" as const },
            { id: "ja-m4-neo-9", title: "どれ — which one", status: "available" as const },
            { id: "ja-m4-neo-10", title: "Objects III + こ/そ/あ/ど", status: "available" as const },
            { id: "ja-m4-neo-11", title: "Story: Tanaka's classroom", status: "available" as const },
            { id: "ja-m4-neo-review", title: "Pointing & owning — review", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        // M5 — tile s05: VERBS I (dictionary form as THE verb; を + SOV).
        // curriculum/m5-neo-{a,b}.ts via m5-neo.ts.
        {
          id: "m5",
          title: "⚙️ Verbs I: the dictionary form",
          eyebrow: "Module 5 · Rewrite",
          summary: "A bare dictionary verb is a whole casual sentence: たべる。 Add を to say what you act on; meet the CEJC seed verbs and the もの word family.",
          lessons: [
            { id: "ja-m5-neo-1", title: "たべる・みる — your first verbs", status: "available" as const },
            { id: "ja-m5-neo-2", title: "を — marking what you act on", status: "available" as const },
            { id: "ja-m5-neo-3", title: "のむ・かう — drink it, buy it", status: "available" as const },
            { id: "ja-m5-neo-4", title: "いく・くる — off and coming", status: "available" as const },
            { id: "ja-m5-neo-5", title: "する・やる — do", status: "available" as const },
            { id: "ja-m5-neo-6", title: "Story: at the shop", status: "available" as const },
            { id: "ja-m5-neo-7", title: "きく・わかる", status: "available" as const },
            { id: "ja-m5-neo-8", title: "そう おもう — I think so", status: "available" as const },
            { id: "ja-m5-neo-9", title: "もの — the thing-family", status: "available" as const },
            { id: "ja-m5-neo-10", title: "Verb drills + ごはん", status: "available" as const },
            { id: "ja-m5-neo-11", title: "Story: dinner plans", status: "available" as const },
            { id: "ja-m5-neo-review", title: "Verbs I — review", status: "available" as const },
          ],
          accent: { from: "#10b981", to: "#059669" },
        },
        // M6 — tile n06a: NEGATIVES & EXISTENCE. FIRST compiler-pipeline module
        // (ir/m6.ir.yaml → moduleCompiler). curriculum/m6-neo.ts.
        {
          id: "m6",
          title: "🚫 Negatives & Existence",
          eyebrow: "Module 6 · Rewrite",
          summary: "Say no with ない by verb class; announce what exists with ある / いる + が; point with ここ/そこ/あそこ/どこ; place things with に and で.",
          lessons: [
            { id: "ja-m6-neo-1", title: "ない — saying no (る-verbs)", status: "available" as const },
            { id: "ja-m6-neo-2", title: "ない — う-verbs", status: "available" as const },
            { id: "ja-m6-neo-3", title: "ない — する・くる", status: "available" as const },
            { id: "ja-m6-neo-4", title: "ある — there is (things)", status: "available" as const },
            { id: "ja-m6-neo-5", title: "いる — there is (living things)", status: "available" as const },
            { id: "ja-m6-neo-6", title: "Nothing there — ない・いない", status: "available" as const },
            { id: "ja-m6-neo-7", title: "ここ・そこ・あそこ・どこ", status: "available" as const },
            { id: "ja-m6-neo-8", title: "に — where things are", status: "available" as const },
            { id: "ja-m6-neo-9", title: "で — where you do things", status: "available" as const },
            { id: "ja-m6-neo-10", title: "うえ・なか — spatial relations", status: "available" as const },
            { id: "ja-m6-neo-11", title: "どこに…？ — asking where", status: "available" as const },
            { id: "ja-m6-neo-challenge", title: "Challenge — put it all together", status: "available" as const },
            { id: "ja-m6-neo-review", title: "Negatives & Existence — review", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          // m7-neo (spine tile s07) — POLITENESS AS A LAYER. First module on
          // the 2026-07-26 shape (inv 25): 11 teaching + 3 review + 1
          // challenge, reviews at the beginning/middle/end thirds, challenge
          // LAST. Two teaching slots are katakana rows (ア, カ).
          // Authored in ir/m7.ir.yaml → moduleCompiler. curriculum/m7-neo.ts.
          id: "m7",
          title: "Politeness as a layer",
          eyebrow: "Module 7 · ます and です",
          summary: "The polite skin: ます, ません, です, か — and choosing your form by audience. Katakana ア and カ rows.",
          lessons: [
            { id: "ja-m7-neo-kata-a", title: "Katakana — ア row", status: "available" as const },
            { id: "ja-m7-neo-1", title: "Talking up — ます", status: "available" as const },
            { id: "ja-m7-neo-2", title: "Every verb, politely", status: "available" as const },
            { id: "ja-m7-neo-3", title: "Politely saying no — ません", status: "available" as const },
            { id: "ja-m7-neo-review-1", title: "Review — polite verbs", status: "available" as const },
            { id: "ja-m7-neo-4", title: "です — the noun's polite finish", status: "available" as const },
            { id: "ja-m7-neo-5", title: "Asking politely — か", status: "available" as const },
            { id: "ja-m7-neo-6", title: "Who are you talking to?", status: "available" as const },
            { id: "ja-m7-neo-kata-ka", title: "Katakana — カ row", status: "available" as const },
            { id: "ja-m7-neo-review-2", title: "Review — です, か and audience", status: "available" as const },
            { id: "ja-m7-neo-7", title: "Work and school", status: "available" as const },
            { id: "ja-m7-neo-8", title: "Names carry register too", status: "available" as const },
            { id: "ja-m7-neo-9", title: "Switching skins", status: "available" as const },
            { id: "ja-m7-neo-review-3", title: "Review — the whole polite layer", status: "available" as const },
            { id: "ja-m7-neo-challenge", title: "Challenge — put it all together", status: "available" as const },
          ],
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          // m8-neo (spine tile n02) — て-form + ください, pulled early for
          // traveler utility. Katakana サ and タ rows ride along.
          id: "m8",
          title: "Asking for things",
          eyebrow: "Module 8 · て-form and ください",
          summary: "The connector form and the request formula: て, てください, and the casual bare-て friends use. Katakana サ and タ rows.",
          lessons: [
            { id: "ja-m8-neo-kata-sa", title: "Katakana — サ row", status: "available" as const },
            { id: "ja-m8-neo-1", title: "The connector — て", status: "available" as const },
            { id: "ja-m8-neo-2", title: "The sound-change table", status: "available" as const },
            { id: "ja-m8-neo-3", title: "The rebels — いって, して, きて", status: "available" as const },
            { id: "ja-m8-neo-review-1", title: "Review — the て table", status: "available" as const },
            { id: "ja-m8-neo-4", title: "Please — てください", status: "available" as const },
            { id: "ja-m8-neo-5", title: "Food and meals", status: "available" as const },
            { id: "ja-m8-neo-6", title: "At the shop", status: "available" as const },
            { id: "ja-m8-neo-kata-ta", title: "Katakana — タ row", status: "available" as const },
            { id: "ja-m8-neo-review-2", title: "Review — requests in context", status: "available" as const },
            { id: "ja-m8-neo-7", title: "Please tell me — おしえて", status: "available" as const },
            { id: "ja-m8-neo-8", title: "Friends don't say ください", status: "available" as const },
            { id: "ja-m8-neo-9", title: "Asking your way through a day", status: "available" as const },
            { id: "ja-m8-neo-review-3", title: "Review — the whole request kit", status: "available" as const },
            { id: "ja-m8-neo-challenge", title: "Challenge — put it all together", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          // m9-neo (spine tile n03) — numbers 1-10 + the first purchase.
          // ONE generic counter (〜つ); every other counter drips in later.
          id: "m9",
          title: "Numbers and purchases",
          eyebrow: "Module 9 · Counting and buying",
          summary: "The number line, the all-purpose 〜つ counter, and a whole shop exchange: いくらですか, 〜えん, ください. Katakana ナ and ハ rows.",
          lessons: [
            { id: "ja-m9-neo-kata-na", title: "Katakana — ナ row", status: "available" as const },
            { id: "ja-m9-neo-1", title: "One to five", status: "available" as const },
            { id: "ja-m9-neo-2", title: "Six to ten", status: "available" as const },
            { id: "ja-m9-neo-3", title: "Counting things — 〜つ", status: "available" as const },
            { id: "ja-m9-neo-review-1", title: "Review — the number line", status: "available" as const },
            { id: "ja-m9-neo-4", title: "Yen and how much", status: "available" as const },
            { id: "ja-m9-neo-5", title: "Cheap and expensive", status: "available" as const },
            { id: "ja-m9-neo-6", title: "Buying and selling", status: "available" as const },
            { id: "ja-m9-neo-kata-ha", title: "Katakana — ハ row", status: "available" as const },
            { id: "ja-m9-neo-review-2", title: "Review — the shop exchange", status: "available" as const },
            { id: "ja-m9-neo-7", title: "How many do you want?", status: "available" as const },
            { id: "ja-m9-neo-8", title: "Too expensive", status: "available" as const },
            { id: "ja-m9-neo-9", title: "A whole purchase", status: "available" as const },
            { id: "ja-m9-neo-review-3", title: "Review — numbers, prices, purchases", status: "available" as const },
            { id: "ja-m9-neo-challenge", title: "Challenge — put it all together", status: "available" as const },
          ],
          accent: { from: "#10b981", to: "#059669" },
        },
        {
          // m10-neo (spine tile n15) — the DEEPEN beat of m7's register
          // mechanic: the words that actually carry register in speech.
          id: "m10",
          title: "Register in the wild",
          eyebrow: "Module 10 · Yes, no and softening",
          summary: "Three yeses and three noes by audience, はい as aizuchi, ちょっと as the refusal that never says no, and pronoun register. Katakana マ and ヤ rows.",
          lessons: [
            { id: "ja-m10-neo-kata-ma", title: "Katakana — マ row", status: "available" as const },
            { id: "ja-m10-neo-1", title: "Three ways to say yes", status: "available" as const },
            { id: "ja-m10-neo-2", title: "Three ways to say no", status: "available" as const },
            { id: "ja-m10-neo-3", title: "はい isn't always yes", status: "available" as const },
            { id: "ja-m10-neo-review-1", title: "Review — yes and no by audience", status: "available" as const },
            { id: "ja-m10-neo-4", title: "Softening with ちょっと", status: "available" as const },
            { id: "ja-m10-neo-5", title: "No thank you — だめ and けっこう", status: "available" as const },
            { id: "ja-m10-neo-6", title: "Who's I? — わたし, ぼく", status: "available" as const },
            { id: "ja-m10-neo-kata-ya", title: "Katakana — ヤ row", status: "available" as const },
            { id: "ja-m10-neo-review-2", title: "Review — softening and refusing", status: "available" as const },
            { id: "ja-m10-neo-7", title: "Knowing and now — しる, いま", status: "available" as const },
            { id: "ja-m10-neo-8", title: "Hedging — まあ and よく", status: "available" as const },
            { id: "ja-m10-neo-9", title: "A conversation that sounds real", status: "available" as const },
            { id: "ja-m10-neo-review-3", title: "Review — the whole register kit", status: "available" as const },
            { id: "ja-m10-neo-challenge", title: "Challenge — put it all together", status: "available" as const },
          ],
          accent: { from: "#ec4899", to: "#db2777" },
        },
        {
          // m11-neo (spine tile n04) — Time I + plain past た. Compound
          // numbers land compositionally; the m8 sound-change table pays a
          // second time; ました/でした arrive beside た/だった.
          id: "m11",
          title: "Time I and the plain past",
          eyebrow: "Module 11 \u00b7 Clock, calendar, た",
          summary: "Numbers 11-99 as arithmetic, 〜じ hours and 〜じに, いつ, plain past た/だった off the て table, and the polite past ました/でした beside it. Katakana ラ and ワ rows.",
          lessons: [
            { id: "ja-m11-neo-kata-ra", title: "Katakana \u2014 \u30e9 row", status: "available" as const },
            { id: "ja-m11-neo-1", title: "Eleven to ninety-nine", status: "available" as const },
            { id: "ja-m11-neo-2", title: "Telling the hour \u2014 \u301cじ", status: "available" as const },
            { id: "ja-m11-neo-3", title: "At three o'clock \u2014 \u301cじに", status: "available" as const },
            { id: "ja-m11-neo-review-1", title: "Review \u2014 numbers and the clock", status: "available" as const },
            { id: "ja-m11-neo-4", title: "た \u2014 the same table, a second payout", status: "available" as const },
            { id: "ja-m11-neo-5", title: "The rebels \u2014 した, きた, いった", status: "available" as const },
            { id: "ja-m11-neo-6", title: "だった \u2014 it was", status: "available" as const },
            { id: "ja-m11-neo-kata-wa", title: "Katakana \u2014 \u30ef row", status: "available" as const },
            { id: "ja-m11-neo-review-2", title: "Review \u2014 the past you speak to friends", status: "available" as const },
            { id: "ja-m11-neo-7", title: "ました \u2014 the polite past", status: "available" as const },
            { id: "ja-m11-neo-8", title: "でした \u2014 was, politely", status: "available" as const },
            { id: "ja-m11-neo-9", title: "いつ \u2014 asking when", status: "available" as const },
            { id: "ja-m11-neo-review-3", title: "Review \u2014 clock, calendar and past", status: "available" as const },
            { id: "ja-m11-neo-challenge", title: "Challenge \u2014 put it all together", status: "available" as const },
          ],
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          // m12-neo (spine tile s09) — adjectives as mini-predicates. い-adj
          // conjugates on its own (four cells, no だ); な-adj is a noun that
          // borrows the copula, and な shows up only in front of a noun.
          // No katakana rows: the katakana programme ended at m11.
          id: "m12",
          title: "Adjectives as mini-predicates",
          eyebrow: "Module 12 \u00b7 \u3044-adjectives + \u306a-adjectives",
          summary: "たかい already means 'is-expensive': the four-cell い-adjective table (くない・かった・くなかった) drilled against な-adjectives, which are nouns borrowing だ/じゃない/だった. です is the politeness coat that never conjugates, and どう？ asks for the answer.",
          lessons: [
            { id: "ja-m12-neo-1", title: "たかい already says \"is\"", status: "available" as const },
            { id: "ja-m12-neo-2", title: "くない \u2014 the adjective says no", status: "available" as const },
            { id: "ja-m12-neo-3", title: "かった \u2014 how it was", status: "available" as const },
            { id: "ja-m12-neo-review-1", title: "Review \u2014 the い-adjective, three cells in", status: "available" as const },
            { id: "ja-m12-neo-4", title: "くなかった \u2014 the fourth cell", status: "available" as const },
            { id: "ja-m12-neo-5", title: "な-adjectives \u2014 a noun doing an adjective's job", status: "available" as const },
            { id: "ja-m12-neo-6", title: "じゃない \u2014 the noun's no", status: "available" as const },
            { id: "ja-m12-neo-review-2", title: "Review \u2014 い against な", status: "available" as const },
            { id: "ja-m12-neo-7", title: "だった / じゃなかった \u2014 the な-adjective's past", status: "available" as const },
            { id: "ja-m12-neo-8", title: "です \u2014 the coat that never conjugates", status: "available" as const },
            { id: "ja-m12-neo-9", title: "どう？ \u2014 asking what something is like", status: "available" as const },
            { id: "ja-m12-neo-review-3", title: "Review \u2014 both classes, all four cells", status: "available" as const },
            { id: "ja-m12-neo-challenge", title: "Challenge \u2014 describe it, then describe it in the past", status: "available" as const },
          ],
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          // m13-neo (spine tile n05) — wanting. たい rides the ます-stem and
          // then conjugates as the い-adjective m12 just taught; ほしい hangs
          // off a NOUN with が; すき/きらい are な-adjectives with the same が.
          // たい stays first-person (〜たがる is N4).
          id: "m13",
          title: "Wanting: たい and ほしい",
          eyebrow: "Module 13 · たい + ほしい",
          summary: "たべたい is an い-adjective wearing a verb stem, so its four cells (たくない・たかった・たくなかった) cost no new machinery. ほしい wants a THING and marks it が; すき/きらい mark the same が; and 〜のが すき turns a whole verb into something you can like.",
          lessons: [
            { id: "ja-m13-neo-1", title: "たべたい — what I want to do", status: "available" as const },
            { id: "ja-m13-neo-2", title: "たくない — the wish, turned down", status: "available" as const },
            { id: "ja-m13-neo-3", title: "たかった — what I wanted", status: "available" as const },
            { id: "ja-m13-neo-review-1", title: "Review — たい, three cells in", status: "available" as const },
            { id: "ja-m13-neo-4", title: "たくなかった — the fourth cell", status: "available" as const },
            { id: "ja-m13-neo-5", title: "が or を — both are right", status: "available" as const },
            { id: "ja-m13-neo-6", title: "ほしい — wanting a thing", status: "available" as const },
            { id: "ja-m13-neo-review-2", title: "Review — the four cells, and ほしい beside them", status: "available" as const },
            { id: "ja-m13-neo-7", title: "すき / きらい — が, one more time", status: "available" as const },
            { id: "ja-m13-neo-8", title: "たべるのが すき — liking to do something", status: "available" as const },
            { id: "ja-m13-neo-9", title: "なにが したい？ — asking what someone wants", status: "available" as const },
            { id: "ja-m13-neo-review-3", title: "Review — wanting, liking, doing", status: "available" as const },
            { id: "ja-m13-neo-challenge", title: "Challenge — say what you want, then say what you like", status: "available" as const },
          ],
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        {
          // m14-neo (spine tile n06b) — the て-form's second half. ている is
          // て + いる ("exists in the state of having done X"), which is one
          // fact covering both the ongoing and the resultative reading; the
          // permission family (てもいい / てはいけません / ないでください)
          // arrives pairwise on the same frame.
          id: "m14",
          title: "て-form II: ている and permission",
          eyebrow: "Module 14 · ている + may/must not",
          summary: "ください asks for a thing, てください for an action, and ている hangs いる on the て-form: you exist in the state the action left you in — eating right now, or knowing, or living somewhere. Then the same frame turns into permission (ても いい), prohibition (ては いけません) and requests not to (ないで ください), and て finally links whole clauses.",
          lessons: [
            { id: "ja-m14-neo-1", title: "ください — please give me, please do", status: "available" as const },
            { id: "ja-m14-neo-2", title: "ている — て plus いる", status: "available" as const },
            { id: "ja-m14-neo-3", title: "しっている — the state you are already in", status: "available" as const },
            { id: "ja-m14-neo-review-1", title: "Review — asking for it, and what's going on", status: "available" as const },
            { id: "ja-m14-neo-4", title: "もう と まだ — already, and not yet", status: "available" as const },
            { id: "ja-m14-neo-5", title: "なにを している？ — asking what someone is doing", status: "available" as const },
            { id: "ja-m14-neo-6", title: "〜ても いい — may I?", status: "available" as const },
            { id: "ja-m14-neo-review-2", title: "Review — what's happening, and what's allowed", status: "available" as const },
            { id: "ja-m14-neo-7", title: "〜ては いけません — when the answer is no", status: "available" as const },
            { id: "ja-m14-neo-8", title: "〜ないで ください — please don't", status: "available" as const },
            { id: "ja-m14-neo-9", title: "たべて、いく — one thing, then the next", status: "available" as const },
            { id: "ja-m14-neo-review-3", title: "Review — the whole て family", status: "available" as const },
            { id: "ja-m14-neo-challenge", title: "Challenge — say what's happening, then say what's allowed", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          // m15-neo (spine tile s11) — the relative clause. A Japanese
          // relative clause is a whole sentence parked in front of a noun:
          // no "that/which/who", no change to the verb, and the verb stays
          // PLAIN. こと/の name an action so it can be liked or talked
          // about; とき is the same shape with the noun "time"; まえに and
          // てから put two actions in order.
          id: "m15",
          title: "Relative clauses + こと / とき",
          eyebrow: "Module 15 · clauses in front of nouns",
          summary: "Japanese has no relative pronoun — you park a whole sentence in front of a noun and the verb does not change: ほんを みる ひと is the person who reads books. The clause verb stays plain, its own subject takes が, and the same shape then gives you こと (naming an action), とき (saying when) and the ordering pair まえに / てから.",
          lessons: [
            { id: "ja-m15-neo-1", title: "ほんを みる ひと — a sentence in front of a noun", status: "available" as const },
            { id: "ja-m15-neo-2", title: "きのう かった ほん — clauses in the past", status: "available" as const },
            { id: "ja-m15-neo-3", title: "ミカが かった ほん — who did it, inside the clause", status: "available" as const },
            { id: "ja-m15-neo-review-1", title: "Review — sentences in front of nouns", status: "available" as const },
            { id: "ja-m15-neo-4", title: "たべる こと — turning an action into a thing", status: "available" as const },
            { id: "ja-m15-neo-5", title: "いく とき — saying when", status: "available" as const },
            { id: "ja-m15-neo-6", title: "じかんが ある とき — spending とき", status: "available" as const },
            { id: "ja-m15-neo-review-2", title: "Review — things and times", status: "available" as const },
            { id: "ja-m15-neo-7", title: "たべる まえに — before doing", status: "available" as const },
            { id: "ja-m15-neo-8", title: "たべてから — after doing", status: "available" as const },
            { id: "ja-m15-neo-9", title: "まえに と てから — putting two actions in order", status: "available" as const },
            { id: "ja-m15-neo-review-3", title: "Review — clauses, things, times and order", status: "available" as const },
            { id: "ja-m15-neo-challenge", title: "Challenge — say what, say when, say in what order", status: "available" as const },
          ],
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          // m16-neo (spine tile s13) — clause linking. から marks the REASON
          // and the reason clause comes FIRST in Japanese; ので is its softer
          // twin (な, never だ, after a noun or な-adjective); けど is the
          // contrast in the same slot. から's other job is ORIGIN, まで closes
          // the span it opens, and ませんでした / なかった fill the last cells
          // of the polite and plain paradigms.
          id: "m16",
          title: "Connecting: から / ので / けど",
          eyebrow: "Module 16 · reasons, spans and past negatives",
          summary: "In Japanese the reason comes FIRST and から closes it: さむいから うちに いる. ので says the same thing more softly, けど turns it into a contrast, and から's other sense — \"from\" — pairs with まで to mark a span of time, months or distance. The module closes the paradigm with ませんでした and なかった, and counts flat things with 〜まい.",
          lessons: [
            { id: "ja-m16-neo-1", title: "いそがしいから うちに いる — the reason comes first", status: "available" as const },
            { id: "ja-m16-neo-2", title: "だれが くる？ — は と が", status: "available" as const },
            { id: "ja-m16-neo-3", title: "しずかなので — the softer reason", status: "available" as const },
            { id: "ja-m16-neo-review-1", title: "Review — saying why", status: "available" as const },
            { id: "ja-m16-neo-4", title: "たかいけど かいたい — saying but", status: "available" as const },
            { id: "ja-m16-neo-5", title: "にほんから くる — the other から", status: "available" as const },
            { id: "ja-m16-neo-6", title: "くじから ごじまで — from here to there", status: "available" as const },
            { id: "ja-m16-neo-review-2", title: "Review — but, from, and until", status: "available" as const },
            { id: "ja-m16-neo-7", title: "たべませんでした — the last polite cell", status: "available" as const },
            { id: "ja-m16-neo-8", title: "いかなかった — didn't, and why", status: "available" as const },
            { id: "ja-m16-neo-9", title: "きっぷを さんまい — counting flat things", status: "available" as const },
            { id: "ja-m16-neo-review-3", title: "Review — reasons, spans, and what didn't happen", status: "available" as const },
            { id: "ja-m16-neo-challenge", title: "Challenge — say why, say how long, say what didn't happen", status: "available" as const },
          ],
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          // m17-neo (spine tile n07) — Family I. Japanese has TWO sets of
          // family words and the choice tracks WHOSE family it is: your own
          // side is うち ("inside") and takes the humble set ちち / はは /
          // あに / あね / おとうと / いもうと. The others'-side honorific set
          // waits for Family II (m21) so a learner never holds two words for
          // "mother" at once. 〜にん counts people (ひとり / ふたり irregular),
          // 〜さい counts years, and この / その / あの / どの complete the
          // ko-so-a-do table the learner already half owns.
          id: "m17",
          title: "Family I: your side (うち)",
          eyebrow: "Module 17 · うち and そと",
          summary: "Japanese has two sets of family words, and which one you use depends on whose family it is. Your own side is うち — \"inside\" — and takes the humble set: ちち, はは, あに, あね, おとうと, いもうと. With them come the counters family talk needs immediately — 〜にん for people (with the irregular ひとり / ふたり) and 〜さい for age — plus この / その / あの / どの, the row of the ko-so-a-do table that has to lean on a noun.",
          lessons: [
            { id: "ja-m17-neo-1", title: "ちちと はは — the words for your own family", status: "available" as const },
            { id: "ja-m17-neo-2", title: "あにの じてんしゃ — whose is whose", status: "available" as const },
            { id: "ja-m17-neo-3", title: "おとうとが いる — saying who you have", status: "available" as const },
            { id: "ja-m17-neo-review-1", title: "Review — your side of the family", status: "available" as const },
            { id: "ja-m17-neo-4", title: "かぞくは よにんだ — counting people", status: "available" as const },
            { id: "ja-m17-neo-5", title: "あねは はたちだ — how old", status: "available" as const },
            { id: "ja-m17-neo-6", title: "じゅうななさい — ages past ten", status: "available" as const },
            { id: "ja-m17-neo-review-2", title: "Review — how many, how old", status: "available" as const },
            { id: "ja-m17-neo-7", title: "この ほん — pointing at a named thing", status: "available" as const },
            { id: "ja-m17-neo-8", title: "これ と この — standing alone or attached", status: "available" as const },
            { id: "ja-m17-neo-9", title: "あの ひとは だれ？ — asking about people", status: "available" as const },
            { id: "ja-m17-neo-review-3", title: "Review — うちの かぞく, start to finish", status: "available" as const },
            { id: "ja-m17-neo-challenge", title: "Challenge — introduce your family", status: "available" as const },
          ],
          accent: { from: "#e11d48", to: "#be123c" },
        },
        {
          // m18-neo (spine tile n08) — Saying & thinking. と is a QUOTATION
          // particle: it closes a complete PLAIN sentence and hands it to a
          // verb of thinking or saying. 「あした いくと おもう」 reorders
          // nothing and adds nothing, and the quoted clause stays plain
          // however polite the outer sentence gets — the payoff of teaching
          // plain form first. 〜と いう names things (「トムと いう ひと」),
          // and kanji-set-1 lands as a READING ladder over eight glyphs the
          // learner has been seeing since m8.
          id: "m18",
          title: "Saying & thinking: とおもう + という",
          eyebrow: "Module 18 · Quotation",
          summary: "と is the quotation particle: it closes a whole plain sentence and hands it to a verb of thinking or saying. 「あした いくと おもう」 = \"I think I'll go tomorrow\" — nothing is reordered and nothing is added, and the clause in front of と stays PLAIN however polite the rest of the sentence gets. The same と names things with いう (「トムと いう ひと」, a person called Tom), and the first kanji reading set asks you to read the glyphs you have been seeing since module 8.",
          lessons: [
            { id: "ja-m18-neo-1", title: "「あした いくと おもう」 — handing a sentence to おもう", status: "available" as const },
            { id: "ja-m18-neo-2", title: "「たべますと おもう」 は ✗ — the quote stays plain", status: "available" as const },
            { id: "ja-m18-neo-3", title: "「こないと おもう」 — where the ない goes", status: "available" as const },
            { id: "ja-m18-neo-review-1", title: "Review — と おもう, positive and negative", status: "available" as const },
            { id: "ja-m18-neo-4", title: "「がくせいだと おもう」 — quoting nouns and adjectives", status: "available" as const },
            { id: "ja-m18-neo-5", title: "「トムと いう ひと」 — naming things", status: "available" as const },
            { id: "ja-m18-neo-6", title: "「もう たべたと おもう」 — the quote keeps its own tense", status: "available" as const },
            { id: "ja-m18-neo-review-2", title: "Review — という, and what the quote carries", status: "available" as const },
            { id: "ja-m18-neo-7", title: "「ミカに いう」 と 「ミカと はなす」 — who the words go to", status: "available" as const },
            { id: "ja-m18-neo-8", title: "人 · 水 · 行く — reading the kanji you already know", status: "available" as const },
            { id: "ja-m18-neo-9", title: "「どう おもう？」 — asking for an opinion", status: "available" as const },
            { id: "ja-m18-neo-review-3", title: "Review — saying, thinking and asking", status: "available" as const },
            { id: "ja-m18-neo-challenge", title: "Challenge — say what you think", status: "available" as const },
          ],
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          // m19-neo (spine tile s15) — Getting around. Almost nothing here is
          // new: destination is に's THIRD job, means is で's other job, and
          // clock-から is から's third. The one genuinely new surface is へ,
          // which is written he and READ e — the single most confusing
          // spelling a beginner meets, so the lesson opens on the reading.
          // 〜に いく (「たべに いく」) lands here at last: it attaches to the
          // ます-stem, which no lexicon in the repo knew until the stem fix.
          id: "m19",
          title: "Getting around: motion particles",
          eyebrow: "Module 19 · Motion",
          summary: "Where you go, how you get there and when. に marks the place you arrive at, へ points at the direction you head — and へ is written he but READ e, the one spelling in the language that catches everybody. で marks the vehicle (「バスで いく」), the ます-stem plus に いく says why you are going (「たべに いく」), and から, まで and までに hang the whole journey on the clock, minutes and all.",
          lessons: [
            { id: "ja-m19-neo-1", title: "「えきに いく」 — に marks where you arrive", status: "available" as const },
            { id: "ja-m19-neo-2", title: "「にほんへ いく」 — written he, said e", status: "available" as const },
            { id: "ja-m19-neo-3", title: "「バスで いく」 — で is how you get there", status: "available" as const },
            { id: "ja-m19-neo-review-1", title: "Review — に, へ, で: where you go and how", status: "available" as const },
            { id: "ja-m19-neo-4", title: "「たべに いく」 — going in order to do something", status: "available" as const },
            { id: "ja-m19-neo-5", title: "「はちじ じゅっぷん」 — counting minutes", status: "available" as const },
            { id: "ja-m19-neo-6", title: "「くじから はたらく」 — から starts the clock", status: "available" as const },
            { id: "ja-m19-neo-review-2", title: "Review — purpose, minutes and start times", status: "available" as const },
            { id: "ja-m19-neo-7", title: "「ごじまでに かえる」 — by five, not until five", status: "available" as const },
            { id: "ja-m19-neo-8", title: "「どこへ いく？」 — asking about a journey", status: "available" as const },
            { id: "ja-m19-neo-9", title: "「えきは どこですか」 — asking a stranger", status: "available" as const },
            { id: "ja-m19-neo-review-3", title: "Review — getting around, start to finish", status: "available" as const },
            { id: "ja-m19-neo-challenge", title: "Challenge — plan the whole trip", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          // m20-neo (spine tile n09) — Comparisons I. Japanese leads with the
          // WINNER: 「Aの ほうが Bより 〜」. ほう is an ordinary noun ("the ~
          // one"), より is one more particle, and — the good news English
          // speakers need told out loud — nothing inflects. There is no
          // comparative ending in the language. どっち asks it, どちら is the
          // polite twin, and the ledger's numbers 100-10000 and 〜こ pay for
          // the prices and counts a comparison actually runs on. いちばん waits
          // for m26: n09 is the intro beat of the spiral, n14 the deepen.
          id: "m20",
          title: "Comparisons I: のほうが…より",
          eyebrow: "Module 20 · Comparing",
          summary: "Saying one thing beats another. Japanese leads with the WINNER — 「でんしゃの ほうが バスより たかい」 — with ほうが on the one that wins and より on the one that loses, and the adjective never changes shape, because Japanese has no comparative ending at all. Ask with 「AとBと どっちが〜？」 (どちら to a stranger), and pay for it with the numbers and counters a real comparison needs: ひゃく, せん, まん and the generic 〜こ.",
          lessons: [
            { id: "ja-m20-neo-1", title: "「でんしゃの ほうが たかい」 — the winner goes first", status: "available" as const },
            { id: "ja-m20-neo-2", title: "「バスより やすい」 — より on its own", status: "available" as const },
            { id: "ja-m20-neo-3", title: "「どっちが たかい？」 — asking which of two", status: "available" as const },
            { id: "ja-m20-neo-review-1", title: "Review — ほうが, より, どっち", status: "available" as const },
            { id: "ja-m20-neo-4", title: "「さんびゃくえん」 — hundreds, and the three that change sound", status: "available" as const },
            { id: "ja-m20-neo-5", title: "「いくら？」 — thousands, and what things cost", status: "available" as const },
            { id: "ja-m20-neo-6", title: "「たまごが さんこ」 — counting small things", status: "available" as const },
            { id: "ja-m20-neo-review-2", title: "Review — hundreds, prices and 〜こ", status: "available" as const },
            { id: "ja-m20-neo-7", title: "「としょかんの ほうが しずかだ」 — な-adjectives compare too", status: "available" as const },
            { id: "ja-m20-neo-8", title: "「どっちも たかいけど」 — both are, but one is more", status: "available" as const },
            { id: "ja-m20-neo-9", title: "「どちらが やすいですか」 — asking a stranger which", status: "available" as const },
            { id: "ja-m20-neo-review-3", title: "Review — comparing anything, in either register", status: "available" as const },
            { id: "ja-m20-neo-challenge", title: "Challenge — pick one and say why", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          // m21 = spine tile s19. A Japanese list tells you whether it is
          // FINISHED: と closes it, や leaves it open, and English has one
          // word for both — so the contrast IS the lesson. 〜たり 〜たり する
          // does the same job to verbs. Family II (the そと honorifics) lands
          // here, deferred from m17 by the spine so the learner never holds
          // two words for "mother" at once, and the cup counter 〜はい drips
          // through the drinks the module orders.
          id: "m21",
          title: "Listing & describing: や, たり",
          eyebrow: "Module 21 · Listing",
          summary: "Two words for \u2018and\u2019, and the difference is whether you have finished. \u300Cいぬと ねこが いる\u300D names every animal there is; \u300Cいぬや ねこが いる\u300D names two of them and leaves the rest unsaid, with など to say so out loud. 〜たり 〜たり する does the same for what you DO. Family II arrives beside it — おかあさん / おとうさん for other people\u2019s families against m17\u2019s はは / ちち for your own — and the cup counter 〜はい (いっぱい, さんばい, ろっぱい) counts the drinks you order.",
          lessons: [
            { id: "ja-m21-neo-1", title: "\u300Cうみや やまが すきだ\u300D — the list that isn\u2019t finished", status: "available" as const },
            { id: "ja-m21-neo-2", title: "\u300Cいぬと ねこが いる\u300D — the list that is", status: "available" as const },
            { id: "ja-m21-neo-3", title: "\u300Cミカの おかあさん\u300D — the other family words", status: "available" as const },
            { id: "ja-m21-neo-review-1", title: "Review — や, と, and whose family", status: "available" as const },
            { id: "ja-m21-neo-4", title: "\u300Cミカの おにいさん\u300D — の decides whose", status: "available" as const },
            { id: "ja-m21-neo-5", title: "\u300Cコーヒーを さんばい\u300D — counting what\u2019s in the cup", status: "available" as const },
            { id: "ja-m21-neo-6", title: "\u300Cさんにんで よんはい\u300D — people take にん, cupfuls take はい", status: "available" as const },
            { id: "ja-m21-neo-review-2", title: "Review — the family sets and the cup counter", status: "available" as const },
            { id: "ja-m21-neo-7", title: "\u300Cみたり きいたり する\u300D — listing what you do", status: "available" as const },
            { id: "ja-m21-neo-8", title: "\u300Cえいがや おんがくが すきだ\u300D — listing what you like", status: "available" as const },
            { id: "ja-m21-neo-9", title: "\u300Cコーヒーを いっぱい ください\u300D — ordering", status: "available" as const },
            { id: "ja-m21-neo-review-3", title: "Review — open lists, closed lists and everything in the cup", status: "available" as const },
            { id: "ja-m21-neo-challenge", title: "Challenge — say what you do and who you do it with", status: "available" as const },
          ],
          accent: { from: "#ec4899", to: "#db2777" },
        },
        {
          // m22 = spine tile s17. Japanese does not let you OWN a pain: the
          // body part is the thing that IS painful and it takes が, and いたい
          // is an adjective, so を does not parse. Put a person in front and
          // both particles work at once — 「わたしは あたまが いたい」. Health
          // is also where register is load-bearing, so the second half runs the
          // clinic and the pharmacy in です・ます: ください, ないでください
          // (the spine's named spend) and 〜ても いい. The 本 counter drips
          // through as ordinary vocabulary.
          id: "m22",
          title: "Body, health & help",
          eyebrow: "Module 22 · Health",
          summary: "\u300Cあたまが いたい\u300D — the head is painful. Japanese makes the body part the SUBJECT, so が carries every symptom you will ever need, and 「わたしは あたまが いたい」 puts は and が to work in one clause. 「ねつが ある」 says a fever is simply there. Then the register turns: you tell a doctor 「あたまが いたいです」, ask a pharmacist 「くすりを ください」, hear 「おさけを のまないで ください」 and ask back 「のんでも いいですか」. いつも / よく / ときどき / あまり / ぜんぜん say how often, and 〜ほん counts anything longer than it is wide.",
          lessons: [
            { id: "ja-m22-neo-1", title: "\u300Cあたまが いたい\u300D — the part that hurts takes が", status: "available" as const },
            { id: "ja-m22-neo-2", title: "\u300Cわたしは あたまが いたい\u300D — は says who, が says which part", status: "available" as const },
            { id: "ja-m22-neo-3", title: "\u300Cねつが ある\u300D — a symptom is something that EXISTS", status: "available" as const },
            { id: "ja-m22-neo-review-1", title: "Review — what hurts, whose it is, and what you have", status: "available" as const },
            { id: "ja-m22-neo-5", title: "\u300Cときどき あたまが いたい\u300D — how often", status: "available" as const },
            { id: "ja-m22-neo-6", title: "\u300Cあたまが いたいです\u300D — telling the doctor", status: "available" as const },
            { id: "ja-m22-neo-7", title: "\u300Cえんぴつを さんぼん\u300D — counting long thin things", status: "available" as const },
            { id: "ja-m22-neo-review-2", title: "Review — how often, how politely, how many", status: "available" as const },
            { id: "ja-m22-neo-9", title: "\u300Cくすりを ください\u300D — at the pharmacy", status: "available" as const },
            { id: "ja-m22-neo-10", title: "\u300Cのまないで ください\u300D — what the doctor tells you not to do", status: "available" as const },
            { id: "ja-m22-neo-11", title: "\u300Cたべても いい？\u300D — asking whether you may", status: "available" as const },
            { id: "ja-m22-neo-review-3", title: "Review — the pharmacy, the don'ts and the may-I's", status: "available" as const },
            { id: "ja-m22-neo-challenge", title: "Challenge — say what hurts, and ask what you may do about it", status: "available" as const },
          ],
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          // m23 = spine tile s22. Neither construction is a tense. 「にほんに
          // いった ことが ある」 says the EXPERIENCE exists — こと + が + ある,
          // which is why its negative is 「ことが ない」 and never a past
          // negative — and 「いく つもりだ」 is a DECISION, not a future and not
          // a wish, which is why 「いきたいけど いく つもりは ない」 is a
          // coherent sentence. It is also the deepen beat on subordinate
          // clauses (spiral partner of s11/m15): the 「いく とき」/「いった とき」
          // relative-tense flip, 〜てから against 〜まえに, and a whole つもり
          // clause quoted under と おもう. する's plain past appears nowhere —
          // した is the atom for 下 "below".
          id: "m23",
          title: "Experience & intent",
          eyebrow: "Module 23 · Travel",
          summary: "\u300Cにほんに いった ことが ある\u300D — I have been to Japan, ever, at some point. That is not the past tense: it says the EXPERIENCE exists, so it is built from こと, が and ある, and 「ことが ない」 is how you say never. 「いく つもりだ」 is the other half — a plan you have made, hanging off the plain dictionary form, and 「いきたいけど いく つもりは ない」 is why wanting and deciding are different words. Then the clauses get harder: 「いく とき」 against 「いった とき」, 〜てから against 〜まえに, and a whole plan quoted under と おもう. Reading set 2 lands along the way: 山 川 海 上 下 小さい 足 来る.",
          lessons: [
            { id: "ja-m23-neo-1", title: "\u300Cにほんに いった ことが ある\u300D — ever, not yesterday", status: "available" as const },
            { id: "ja-m23-neo-2", title: "\u300Cのった ことが ない\u300D — never, and have you ever", status: "available" as const },
            { id: "ja-m23-neo-3", title: "\u300Cいく つもりだ\u300D — the plan you have made", status: "available" as const },
            { id: "ja-m23-neo-review-1", title: "Review — what you have done, and what you mean to do", status: "available" as const },
            { id: "ja-m23-neo-5", title: "\u300Cいきたいけど いく つもりは ない\u300D — wanting is not deciding", status: "available" as const },
            { id: "ja-m23-neo-6", title: "\u300Cのまない つもりだ\u300D — deciding NOT to", status: "available" as const },
            { id: "ja-m23-neo-7", title: "山, 川, 海 — reading set 2", status: "available" as const },
            { id: "ja-m23-neo-review-2", title: "Review — wanting, deciding not to, and reading cold", status: "available" as const },
            { id: "ja-m23-neo-9", title: "\u300Cいく とき\u300D と \u300Cいった とき\u300D — which side of the when", status: "available" as const },
            { id: "ja-m23-neo-10", title: "\u300Cかってから のる\u300D — putting a trip in order", status: "available" as const },
            { id: "ja-m23-neo-11", title: "\u300Cいく つもりだと おもう\u300D — quoting a whole plan", status: "available" as const },
            { id: "ja-m23-neo-review-3", title: "Review — the when, the order and the quoted plan", status: "available" as const },
            { id: "ja-m23-neo-challenge", title: "Challenge — everything you have ever done, and everything you mean to", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          // m24 = spine tile s21, and the milestone is "closes the old course's
          // potential-form gap": the archived course taught できる and nothing
          // else. Four formations, one particle flip. う-verbs slide to the え
          // row and add る (のめる); る-verbs attach られる (たべられる); くる →
          // こられる; する has no potential and uses できる, which also takes a
          // bare noun. Every result is itself a る-verb, so the negative is m6's
          // ない-form on a new stem. ら抜き (たべれる) is RECOGNITION only. 見える
          // /聞こえる is the nuance beat, and ましょう / ませんか / 〜ない？ close
          // the module as one speech act in three registers.
          id: "m24",
          title: "Can & let's",
          eyebrow: "Module 24 · Ability",
          summary: "\u300Cおさけが のめる\u300D — I can drink. The potential is a FORM, not a word: う-verbs slide to the え row and add る, る-verbs attach られる, くる becomes こられる, and する hands the job to できる. The thing you can do stops being を and becomes が. Every can-form is itself a る-verb, so 「のめない」 is module 6's rule on a new stem. You will also hear people drop the ら — 「たべれる」 — and you need to understand that without saying it. Then 見える against 見られる, 〜のが じょうず against 〜のが へた, and one invitation in three registers: 「たべない？」, 「たべませんか」, 「たべましょう」.",
          lessons: [
            { id: "ja-m24-neo-1", title: "\u300Cおさけが のめる\u300D — the え row and る", status: "available" as const },
            { id: "ja-m24-neo-2", title: "\u300Cすしが たべられる\u300D — られる, and the ら people drop", status: "available" as const },
            { id: "ja-m24-neo-3", title: "\u300Cりょうりが できる\u300D — the verb that replaces する", status: "available" as const },
            { id: "ja-m24-neo-review-1", title: "Review — three formations and one particle", status: "available" as const },
            { id: "ja-m24-neo-5", title: "\u300Cおさけが のめない\u300D — every can-form is a る-verb", status: "available" as const },
            { id: "ja-m24-neo-6", title: "\u300Cやまが みえる\u300D — visible is not the same as allowed", status: "available" as const },
            { id: "ja-m24-neo-7", title: "\u300Cおよぐのが じょうずだ\u300D — the word for other people", status: "available" as const },
            { id: "ja-m24-neo-review-2", title: "Review — can't, is visible, and good at", status: "available" as const },
            { id: "ja-m24-neo-9", title: "\u300Cするのが へただ\u300D — the word for yourself", status: "available" as const },
            { id: "ja-m24-neo-10", title: "\u300Cいっしょに たべましょう\u300D — the plan everyone agrees with", status: "available" as const },
            { id: "ja-m24-neo-11", title: "\u300Cたべませんか\u300D と \u300Cたべない？\u300D — one invitation, three registers", status: "available" as const },
            { id: "ja-m24-neo-review-3", title: "Review — bad at it, let's anyway", status: "available" as const },
            { id: "ja-m24-neo-challenge", title: "Challenge — everything you can do, and everything you're inviting them to", status: "available" as const },
          ],
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          // m25 = spine tile n13, "Conjecture: でしょう/だろう + weather".
          // でしょう is a sentence-ENDER: it stands behind a finished plain
          // sentence and turns a claim into an expectation. Three rungs — a
          // noun drops its だ, an い-adjective changes nothing, a verb changes
          // nothing — and then the register neighbours: casual でしょ？ asking
          // a friend to agree, かな wondering out loud, and だろう, which the
          // learner understands everywhere and says only to themselves
          // (「なんだろう」). Weather and the four seasons carry it, and L11
          // measures でしょう against m18's 〜と おもう. はず / かもしれない /
          // にちがいない belong to m43 and appear nowhere here.
          id: "m25",
          title: "Conjecture",
          eyebrow: "Module 25 · Weather",
          summary: "「あしたは あめでしょう」 — it'll probably rain tomorrow. でしょう is not a verb ending; it is a word that stands behind a finished sentence and turns a claim into an expectation. A noun drops its だ, an adjective changes nothing, a verb changes nothing. Then the weather it was made for, the four seasons, and the two adverbs that agree with it — たぶん and きっと. Finally the register neighbours: 「あついでしょ？」 asking a friend to agree, 「あした あめかな」 wondering out loud, and だろう, which you will hear everywhere and say only to yourself.",
          lessons: [
            { id: "ja-m25-neo-1", title: "「あしたは あめでしょう」 — the ending a forecast is made of", status: "available" as const },
            { id: "ja-m25-neo-2", title: "「さむいでしょう」 — adjectives take it bare", status: "available" as const },
            { id: "ja-m25-neo-3", title: "「あめが ふるでしょう」 — verbs take it bare too", status: "available" as const },
            { id: "ja-m25-neo-review-1", title: "Review — one ending, three things to hang it on", status: "available" as const },
            { id: "ja-m25-neo-5", title: "「ふゆは さむいでしょう」 — four seasons, two particles", status: "available" as const },
            { id: "ja-m25-neo-6", title: "「たぶん あめでしょう」 — how sure, said at the front", status: "available" as const },
            { id: "ja-m25-neo-7", title: "「あした あめかな」 — wondering, out loud", status: "available" as const },
            { id: "ja-m25-neo-review-2", title: "Review — seasons, certainty and wondering", status: "available" as const },
            { id: "ja-m25-neo-9", title: "「なんだろう」 — the one you mostly just hear", status: "available" as const },
            { id: "ja-m25-neo-10", title: "「あついでしょ？」 — handing the thought over", status: "available" as const },
            { id: "ja-m25-neo-11", title: "「ふると おもう」 と 「ふるでしょう」 — whose view, or how likely", status: "available" as const },
            { id: "ja-m25-neo-review-3", title: "Review — every ending, and the one that isn't one", status: "available" as const },
            { id: "ja-m25-neo-challenge", title: "Challenge — the whole forecast, and how sure you are of it", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          // m26 = spine tile n14, "Comparisons II: いちばん + なかで" — the
          // DEEPEN beat of the spiral m20 opened. A superlative is a
          // comparison with the FIELD NAMED: なか is m6's noun "inside", so it
          // takes の in front and で behind (「たべものの なかで」); the winner
          // takes が; and いちばん is an ADVERB that never touches the
          // predicate. Two things still take m20's ほうが…より, three or more
          // take なかで…いちばん, and the two frames never stack. ほど is
          // deferred to m37 and appears nowhere.
          id: "m26",
          title: "Comparisons II",
          eyebrow: "Module 26 · Superlatives",
          summary: "「たべものの なかで すしが いちばん おいしい」 — of all foods, sushi is the most delicious. A superlative in Japanese is just a comparison with the field named: なかで says what group you are choosing from, が marks the winner, and いちばん sits in front of the adjective without changing a thing about it. Ask it with a question word, hang it on a verb you nominalise with の, scale a verb with it, concede the rest of the field with も…けど — and know when to reach back for last module's ほうが…より instead.",
          lessons: [
            { id: "ja-m26-neo-1", title: "「すしが いちばん おいしい」 — the top of a whole group", status: "available" as const },
            { id: "ja-m26-neo-2", title: "「なにが いちばん おいしい？」 — asking which one tops the group", status: "available" as const },
            { id: "ja-m26-neo-3", title: "「およぐのが いちばん すきだ」 — the thing you like doing most", status: "available" as const },
            { id: "ja-m26-neo-review-1", title: "Review — a field, a winner, and いちばん in front", status: "available" as const },
            { id: "ja-m26-neo-5", title: "「ほうが」 と 「いちばん」 — two things, or a whole group", status: "available" as const },
            { id: "ja-m26-neo-6", title: "「どれが いちばん おもい？」 — naming the field out loud", status: "available" as const },
            { id: "ja-m26-neo-7", title: "「としょかんが いちばん しずかだ」 — な-adjectives keep their だ", status: "available" as const },
            { id: "ja-m26-neo-review-2", title: "Review — two frames, a named field, and な-adjectives", status: "available" as const },
            { id: "ja-m26-neo-9", title: "「どれも いいけど これが いちばん」 — agree first, then choose", status: "available" as const },
            { id: "ja-m26-neo-10", title: "「ちちが いちばん はたらく」 — the most, of DOING", status: "available" as const },
            { id: "ja-m26-neo-11", title: "「どれが いちばん やすいですか」 — asking a stranger which one", status: "available" as const },
            { id: "ja-m26-neo-review-3", title: "Review — conceding, doing, and asking politely", status: "available" as const },
            { id: "ja-m26-neo-challenge", title: "Challenge — the whole field, the winner, and why", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          // m27 = spine tile s23, "💡 Explaining: んだ/んです, すぎる, なる".
          // んだ is a whole-sentence suffix, not a verb ending: say the plain
          // sentence and put んだ on the end. After a NOUN or な-adjective the
          // copula comes first and だ turns into な (びょうきなんだ), and
          // んです is the SAME ITEM in the polite skin — the tile's "one item,
          // two skins" — with the clause in front of ん staying PLAIN in both.
          // すぎる attaches to a stem (たべすぎる, たかすぎる); なる takes く
          // from an い-adjective and に from everything else, and なった is the
          // tense a change is actually reported in.
          id: "m27",
          title: "Explaining",
          eyebrow: "Module 27 · Explaining",
          summary: "「ねつが あるんだ」 — the thing is, I've got a fever. Two characters on the end of a sentence you can already say turn a fact into an explanation, and んです is the very same item said politely. Then two shapes for what goes wrong and what changes: すぎる for too much of something (たべすぎた, たかすぎる) and く/に なる for a state that is turning into another one (さむく なる, いしゃに なる) — with なった for the change you have already noticed.",
          lessons: [
            { id: "ja-m27-neo-1", title: "「ねつが あるんだ」 — saying it as an explanation", status: "available" as const },
            { id: "ja-m27-neo-2", title: "「びょうきなんだ」 — nouns put な in first", status: "available" as const },
            { id: "ja-m27-neo-3", title: "「どうして いかないんだ？」 — asking for the reason and giving it", status: "available" as const },
            { id: "ja-m27-neo-review-1", title: "Review — explaining yourself, plain", status: "available" as const },
            { id: "ja-m27-neo-5", title: "「いかないんです」 — the same thing, said politely", status: "available" as const },
            { id: "ja-m27-neo-6", title: "「たべすぎた」 — more than you should have", status: "available" as const },
            { id: "ja-m27-neo-7", title: "「たかすぎる」 — too expensive to buy", status: "available" as const },
            { id: "ja-m27-neo-review-2", title: "Review — too much, and explaining it", status: "available" as const },
            { id: "ja-m27-neo-9", title: "「だんだん さむく なる」 — the weather is changing", status: "available" as const },
            { id: "ja-m27-neo-10", title: "「いしゃに なる」 — what you turn into", status: "available" as const },
            { id: "ja-m27-neo-11", title: "「さむく なったんだ」 — reporting what has changed", status: "available" as const },
            { id: "ja-m27-neo-review-3", title: "Review — changing, and saying why", status: "available" as const },
            { id: "ja-m27-neo-challenge", title: "Challenge — the reason, the excess and the change", status: "available" as const },
          ],
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          // m28 = spine tile s24, "✅ Must & should: なきゃ/なければ, ほうがいい".
          // Japanese has no word for "must" — it has a sentence saying the
          // alternative is not an option, and the interesting half is the one
          // that gets dropped. 「いかなきゃ」 is the ない-form with its ない
          // swapped out, and it ends the sentence on its own; 「いかなければ
          // ならない」 is what it contracts FROM and 「なくちゃ」 is the same
          // move on なくては. The polite pole swaps ならない for なりません and
          // nothing else — there is no polite なきゃ, because なきゃ already
          // ate the ending. Beside the duties sits the advice: 〜た ほうが いい
          // is built entirely from parts the learner owns (m20's ほう, が,
          // いい, m11's た-forms), and its negative half is the plain ない-form
          // rather than a past negative. kanji-set-3 is the COMPOUND set.
          id: "m28",
          title: "Must & should",
          eyebrow: "Module 28 · Must & should",
          summary: "「いかなきゃ」 — gotta go. Japanese says you must do something by saying that not doing it won't do, and the second half gets swallowed: なきゃ and なくちゃ with friends, なければ ならない written down, なければ なりません to anybody you owe politeness to. Then the softer thing beside it — 「くすりを のんだ ほうが いい」, you'd better take medicine — where the た is not a past tense at all and the negative side is just ない. Eight compound kanji close the module: 会社 · 時間 · 電話 · 話す · 学校 · 先生 · 天気 · 外国.",
          lessons: [
            { id: "ja-m28-neo-1", title: "「いかなきゃ」 — the thing you have to do", status: "available" as const },
            { id: "ja-m28-neo-2", title: "「いかなければ ならない」 — what なきゃ is short for", status: "available" as const },
            { id: "ja-m28-neo-3", title: "「おかねが ないから はたらかなきゃ」 — the reason you have to", status: "available" as const },
            { id: "ja-m28-neo-review-1", title: "Review — what you have to do, and why", status: "available" as const },
            { id: "ja-m28-neo-5", title: "「いかなければ なりません」 — saying it to a teacher", status: "available" as const },
            { id: "ja-m28-neo-6", title: "「くすりを のんだ ほうが いい」 — the better move", status: "available" as const },
            { id: "ja-m28-neo-7", title: "「たべない ほうが いい」 — the た that is not a past", status: "available" as const },
            { id: "ja-m28-neo-review-2", title: "Review — the better move, and the one to avoid", status: "available" as const },
            { id: "ja-m28-neo-9", title: "会社 · 時間 · 電話 — reading the compounds", status: "available" as const },
            { id: "ja-m28-neo-10", title: "「バスより ちかてつの ほうが いい」 — choosing between two", status: "available" as const },
            { id: "ja-m28-neo-11", title: "「あそびたいけど はたらかなきゃ」 — want against must", status: "available" as const },
            { id: "ja-m28-neo-review-3", title: "Review — duty, advice and the wish underneath", status: "available" as const },
            { id: "ja-m28-neo-challenge", title: "Challenge — the duty, the advice and the wish", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          // m29 = spine tile s25, "🎓 Register mastery + N5 capstone", and the
          // LAST module of N5. Not a new-material module: a learner arriving
          // here can already say almost everything an N5 sentence needs to
          // say, in exactly one register at a time. What they cannot do yet is
          // SWITCH, quickly, with somebody in front of them — so every
          // sentence in this module is a choice, and the choice is who is
          // listening. The three ledger items all live at the END of a
          // sentence: 「じゃない / じゃないです / じゃありません」 is one meaning in
          // three registers, 「よ」 hands over news, 「ね」 collects agreement.
          // The other six lessons are register TWINS of things the learner
          // already owns — the switch, the negative, the past, the
          // explanation, the invitation and the refusal — and every sentence
          // in the module is new to the course.
          id: "m29",
          title: "Register mastery + N5 capstone",
          eyebrow: "Module 29 · JLPT N5 complete",
          summary: "The last module of N5, and the one where you stop learning new things and start choosing. 「じゃない」「じゃないです」「じゃありません」 are one meaning in three registers; 「よ」 hands somebody news and 「ね」 asks them to nod. Then the same switch across everything you own — the negative, the past, the explanation 「〜んですよ」, the invitation 「いきませんか」, and the refusal that never says no: 「ばんは ちょっと。」 Every sentence is new.",
          lessons: [
            { id: "ja-m29-neo-1", title: "「わたしのじゃない」 — it isn't, said three ways", status: "available" as const },
            { id: "ja-m29-neo-2", title: "「ゆきが ふるよ」 — telling somebody something new", status: "available" as const },
            { id: "ja-m29-neo-3", title: "「かぜが つよいね」 — checking that you agree", status: "available" as const },
            { id: "ja-m29-neo-review-1", title: "Review — the end of the sentence decides everything", status: "available" as const },
            { id: "ja-m29-neo-5", title: "ともだちと せんせい — the same thing, two ways to say it", status: "available" as const },
            { id: "ja-m29-neo-6", title: "「いかない」と「いきません」 — saying no to two different people", status: "available" as const },
            { id: "ja-m29-neo-7", title: "「いった」と「いきました」 — telling somebody what happened", status: "available" as const },
            { id: "ja-m29-neo-review-2", title: "Review — the switch, in both directions", status: "available" as const },
            { id: "ja-m29-neo-9", title: "「〜んですよ」と「〜んですね」 — explaining, and hearing an explanation", status: "available" as const },
            { id: "ja-m29-neo-10", title: "「いかない？」と「いきませんか」 — asking somebody along", status: "available" as const },
            { id: "ja-m29-neo-11", title: "「ばんは ちょっと。」 — saying no without saying it", status: "available" as const },
            { id: "ja-m29-neo-review-3", title: "Review — who is listening, and what they already know", status: "available" as const },
            { id: "ja-m29-neo-challenge", title: "Challenge — N5, all of it, in front of somebody", status: "available" as const },
          ],
          accent: { from: "#eab308", to: "#ca8a04" }, // capstone gold
        },
        // N5 ENDS HERE. There are no comingSoon placeholders left in the N5
        // map — m29 is the last tile of the spine, and the N4 runway tile
        // (s26) is deliberately not a module.
        // ── N4 tier ──────────────────────────────────────────────────────
        // m29 (the capstone) closes the N5 line; `tier: "n4"` modules render
        // on their own map. The old N4 pilot module m29 "Plain form" was
        // REMOVED from the map 2026-07-19: the rewrite spine's sequential
        // numbering reassigns the id m29 to the capstone tile, and the plain
        // forms it piloted are the CORE of the new N5 spine (tiles s05/n06a/
        // n04/s13 — "old m29/m30 absorbed into the spine", spinePlan s26
        // note). Its lessons (ja-m29-*) stay registered in mockLessons and
        // deep-linkable via /ja/qa; its atoms (fromModule "m29") remain
        // SRS-reachable through the capstone slot. m30 keeps the N4 tier
        // alive (tabs + interchange banner) until the N4 map is re-scoped.
        // M30 — Casual register (docs/n4-pilot-spine-2026-07-16.md). Both
        // stages authored: pairs 1-4 (stage 1) + pairs 5-7, the story
        // lesson (stage 2). Per the spine's "Not in the pilot" note, m30
        // is NOT registered as a transit station — reviewed via /ja/qa.
        {
          id: "m30",
          title: "Casual register",
          eyebrow: "Module 30 · Casual",
          summary: "Casual questions, よ/ね, casual の, register awareness, invitations, and mixed-register drills — when plain form is (and isn't) socially correct.",
          tier: "n4",
          lessons: [
            { id: "ja-m30-1-1", title: "Casual questions — Intro", status: "available" as const },
            { id: "ja-m30-1-2", title: "Casual questions — Practice", status: "available" as const },
            { id: "ja-m30-2-1", title: "よ / ね — Intro", status: "available" as const },
            { id: "ja-m30-2-2", title: "よ / ね — Practice", status: "available" as const },
            { id: "ja-m30-3-1", title: "Casual の question — Intro", status: "available" as const },
            { id: "ja-m30-3-2", title: "Casual の question — Practice", status: "available" as const },
            { id: "ja-m30-4-1", title: "Register awareness — Intro", status: "available" as const },
            { id: "ja-m30-4-2", title: "Register awareness — Practice", status: "available" as const },
            { id: "ja-m30-5-1", title: "Casual invitations — Intro", status: "available" as const },
            { id: "ja-m30-5-2", title: "Invitations — Accept / decline", status: "available" as const },
            { id: "ja-m30-6-1", title: "Mixed register — Intro", status: "available" as const },
            { id: "ja-m30-6-2", title: "Mixed register — Speed drill", status: "available" as const },
            { id: "ja-m30-story", title: "Story — ゆき invites twice", status: "available" as const },
            { id: "ja-m30-7-1", title: "Comprehension drill — register", status: "available" as const },
            { id: "ja-m30-7-2", title: "Final production — M30", status: "available" as const },
          ],
          accent: { from: "#7c3aed", to: "#5b21b6" },
        },
      ],
      sideQuests,
    };
  }

  const isKorean = languageId === "ko";

  if (isKorean) {
    // Curriculum rebuild (2026-05-19): Korean mirrors the JA depth pattern.
    //   M1 = Hangul foundation — concept intro → 2 vowel sub-lessons → 9
    //        plain-consonant rows × 3 sub-lessons each. Pure script,
    //        minimal vocab (concept-first; the legacy m1-l1/m1-l2
    //        "Greetings / Introductions" lessons were deleted because
    //        they threw words at learners who couldn't read them).
    //   M2 = aspirated + tense consonants + y/compound vowels + final
    //        consonants (받침). Pathway scaffolded; content lands in a
    //        follow-up pass — the lesson ids resolve to null in
    //        mockLessons for now, mirroring how JA modules existed in
    //        the pathway before their content was authored.
    //   M3 = first phrases — greetings, intros, 이에요/예요. Brings the
    //        m1-l1/m1-l2 vocab back, now that learners can actually read it.
    const m1Lessons: { id: string; title: string; status: "available"; kind?: "recap" }[] = [
      { id: "ko-m1-intro", title: "How Hangul works",    status: "available" as const },
      { id: "ko-m1-v-1",   title: "Vowels — Intro 1",    status: "available" as const },
      { id: "ko-m1-v-2",   title: "Vowels — Intro 2",    status: "available" as const },
    ];
    for (const row of KO_M1_ROWS) {
      for (const suffix of ["1", "2", "3"] as const) {
        const label = suffix === "3" ? "Review" : `Intro ${suffix}`;
        m1Lessons.push({
          id: `ko-m1-${row.id}-${suffix}`,
          title: `${row.title} — ${label}`,
          status: "available" as const,
        });
      }
    }

    // M2 — aspirated + tense consonants + y-vowels (Phase 5, 2026-06-01).
    // Each row gets 3 sub-lessons via the same row builder as M1. A closing
    // 받침 lesson (final-consonant [t]-group neutralization) completes the
    // reading foundation. Compound vowels (ㅐ ㅔ ㅘ ㅝ ㅢ ㅟ) are still
    // deferred to a future M2 extension pass.
    const m2Lessons: { id: string; title: string; status: "available"; kind?: "recap" }[] = [];
    for (const row of KO_M2_ROWS) {
      for (const suffix of ["1", "2", "3"] as const) {
        const label = suffix === "3" ? "Review" : `Intro ${suffix}`;
        m2Lessons.push({
          id: `ko-m2-${row.id}-${suffix}`,
          title: `${row.title} — ${label}`,
          status: "available" as const,
        });
      }
    }
    m2Lessons.push({
      id: "ko-m2-yv-1",
      title: "Y-vowels — ㅑ ㅕ ㅛ ㅠ",
      status: "available" as const,
    });
    m2Lessons.push({
      id: "ko-m2-review",
      title: "Module 2 — Full review",
      status: "available" as const,
      kind: "recap" as const,
    });
    // Final reading piece the M2 review promises ("받침 are next"):
    // final-consonant neutralization, focused on the [t] group.
    m2Lessons.push({
      id: "ko-m2-batchim-1",
      title: "받침 — the final [t] sound",
      status: "available" as const,
    });

    const m3Lessons = [
      { id: "ko-m3-1", title: "Greetings — 안녕하세요",          status: "available" as const },
      { id: "ko-m3-2", title: "Formality — formal vs. polite",     status: "available" as const },
      { id: "ko-m3-3", title: "이에요 / 예요 — the copula",        status: "available" as const },
      { id: "ko-m3-4", title: "저는 X 이에요 — introducing yourself", status: "available" as const },
      { id: "ko-m3-4b", title: "은 / 는 — the topic marker",        status: "available" as const },
      { id: "ko-m3-5", title: "Asking names — 이름이 뭐예요?",     status: "available" as const },
      { id: "ko-m3-6", title: "Numbers 1–10 (Sino-Korean)",       status: "available" as const },
      { id: "ko-m3-7", title: "Mini-dialogue — meeting someone",   status: "available" as const },
      { id: "ko-m3-8", title: "M3 Mastery Test",                  status: "available" as const },
    ];

    // M4-M6 (2026-06-13): the N5 spine after first-phrases. Mirrors the JA
    // M4-M6 grammar arc (の/possessive + demonstratives → numbers/counters/
    // ください → に/で/が + existence) using Korean's own grammar. 8 lessons
    // each, matching M3's shape. Content lives in curriculum/m4.ts ... m6.ts.
    const m4Lessons = [
      { id: "ko-m4-1", title: "Everyday objects — 책, 펜, 가방",    status: "available" as const },
      { id: "ko-m4-2", title: "의 — possessive 's",                status: "available" as const },
      { id: "ko-m4-3", title: "이거 / 그거 / 저거 — this & that",   status: "available" as const },
      { id: "ko-m4-4", title: "이게 뭐예요? — what is this?",       status: "available" as const },
      { id: "ko-m4-5", title: "누구 거예요? — whose is it?",        status: "available" as const },
      { id: "ko-m4-6", title: "Building it together",              status: "available" as const },
      { id: "ko-m4-7", title: "Mini-dialogue — at a shop",         status: "available" as const },
      { id: "ko-m4-8", title: "M4 Mastery Test",                  status: "available" as const },
    ];

    const m5Lessons = [
      { id: "ko-m5-1", title: "Native numbers 1–5",               status: "available" as const },
      { id: "ko-m5-2", title: "Native numbers 6–10",              status: "available" as const },
      { id: "ko-m5-3", title: "주세요 — please give me",           status: "available" as const },
      { id: "ko-m5-4", title: "Counters — 개 / 명 / 잔",           status: "available" as const },
      { id: "ko-m5-5", title: "이거 한 개 주세요 — ordering",       status: "available" as const },
      { id: "ko-m5-6", title: "얼마예요? — how much?",             status: "available" as const },
      { id: "ko-m5-7", title: "Mini-dialogue — at a cafe",         status: "available" as const },
      { id: "ko-m5-8", title: "M5 Mastery Test",                  status: "available" as const },
    ];

    const m6Lessons = [
      { id: "ko-m6-1", title: "Places — 집, 학교, 가게",           status: "available" as const },
      { id: "ko-m6-2", title: "있어요 / 없어요 — there is / isn't", status: "available" as const },
      { id: "ko-m6-3", title: "에 — at / in (a place)",            status: "available" as const },
      { id: "ko-m6-4", title: "에 vs 에서 — being vs doing",       status: "available" as const },
      { id: "ko-m6-5", title: "이/가 + 있어요 — the subject",       status: "available" as const },
      { id: "ko-m6-6", title: "어디에 있어요? — where is it?",      status: "available" as const },
      { id: "ko-m6-7", title: "Mini-dialogue — finding your way",  status: "available" as const },
      { id: "ko-m6-8", title: "M6 Mastery Test",                  status: "available" as const },
    ];

    // M7-M12 (2026-06-13): the N5→N4 grammar spine after existence. Mirrors
    // the JA M7-M12 grammar arc (verbs + を → adjectives → connectors → past
    // → negation → time) using Korean's own grammar. 8 lessons each, matching
    // M3-M6's shape. Content lives in curriculum/m7.ts ... m12.ts.
    const m7Lessons = [
      { id: "ko-m7-1", title: "Action verbs — 가다, 먹다, 보다",    status: "available" as const },
      { id: "ko-m7-2", title: "The 해요 present — 가요, 먹어요",     status: "available" as const },
      { id: "ko-m7-3", title: "하다 verbs — 해요, 공부해요",        status: "available" as const },
      { id: "ko-m7-4", title: "Things to eat, drink & watch",      status: "available" as const },
      { id: "ko-m7-5", title: "을 / 를 — the object marker",        status: "available" as const },
      { id: "ko-m7-6", title: "Building full sentences",           status: "available" as const },
      { id: "ko-m7-7", title: "Mini-dialogue — what are you doing?", status: "available" as const },
      { id: "ko-m7-8", title: "M7 Mastery Test",                  status: "available" as const },
    ];

    const m8Lessons = [
      { id: "ko-m8-1", title: "Describing words — 좋다, 크다",      status: "available" as const },
      { id: "ko-m8-2", title: "좋아요 / 작아요 — adjectives conjugate", status: "available" as const },
      { id: "ko-m8-3", title: "크다 → 커요 — the ㅡ drop",          status: "available" as const },
      { id: "ko-m8-4", title: "맛있어요 / 비싸요 — food & price",   status: "available" as const },
      { id: "ko-m8-5", title: "좋은 책 — describing a noun",        status: "available" as const },
      { id: "ko-m8-6", title: "Building descriptions",             status: "available" as const },
      { id: "ko-m8-7", title: "Mini-dialogue — at a shop",         status: "available" as const },
      { id: "ko-m8-8", title: "M8 Mastery Test",                  status: "available" as const },
    ];

    const m9Lessons = [
      { id: "ko-m9-1", title: "하고 — and",                        status: "available" as const },
      { id: "ko-m9-2", title: "하고 — with (someone)",             status: "available" as const },
      { id: "ko-m9-3", title: "와 / 과 — the formal 'and'",        status: "available" as const },
      { id: "ko-m9-4", title: "도 — too / also",                   status: "available" as const },
      { id: "ko-m9-5", title: "Connectors together",              status: "available" as const },
      { id: "ko-m9-6", title: "Lists & company",                  status: "available" as const },
      { id: "ko-m9-7", title: "Mini-dialogue — ordering together", status: "available" as const },
      { id: "ko-m9-8", title: "M9 Mastery Test",                  status: "available" as const },
    ];

    const m10Lessons = [
      { id: "ko-m10-1", title: "어제 / 오늘 — yesterday & today",   status: "available" as const },
      { id: "ko-m10-2", title: "Past tense — 먹었어요",            status: "available" as const },
      { id: "ko-m10-3", title: "갔어요 / 왔어요 / 했어요",          status: "available" as const },
      { id: "ko-m10-4", title: "좋았어요 / 맛있었어요",            status: "available" as const },
      { id: "ko-m10-5", title: "였어요 / 이었어요 — was",           status: "available" as const },
      { id: "ko-m10-6", title: "Narrating a day",                 status: "available" as const },
      { id: "ko-m10-7", title: "Mini-dialogue — how was it?",      status: "available" as const },
      { id: "ko-m10-8", title: "M10 Mastery Test",                status: "available" as const },
    ];

    const m11Lessons = [
      { id: "ko-m11-1", title: "안 — don't / not",                 status: "available" as const },
      { id: "ko-m11-2", title: "공부 안 해요 — the 하다 split",     status: "available" as const },
      { id: "ko-m11-3", title: "못 — can't",                       status: "available" as const },
      { id: "ko-m11-4", title: "안 vs 못 — which 'no'?",           status: "available" as const },
      { id: "ko-m11-5", title: "Negation in the past",            status: "available" as const },
      { id: "ko-m11-6", title: "고 싶어요 — want to",              status: "available" as const },
      { id: "ko-m11-7", title: "Mini-dialogue — declining politely", status: "available" as const },
      { id: "ko-m11-8", title: "M11 Mastery Test",                status: "available" as const },
    ];

    const m12Lessons = [
      { id: "ko-m12-1", title: "시 — o'clock",                     status: "available" as const },
      { id: "ko-m12-2", title: "분 / 반 — minutes & half past",    status: "available" as const },
      { id: "ko-m12-3", title: "몇 시예요? — what time is it?",     status: "available" as const },
      { id: "ko-m12-4", title: "Days of the week — 요일",          status: "available" as const },
      { id: "ko-m12-5", title: "에 — 'at' (a time)",               status: "available" as const },
      { id: "ko-m12-6", title: "Scheduling — day + time + action", status: "available" as const },
      { id: "ko-m12-7", title: "Mini-dialogue — making plans",     status: "available" as const },
      { id: "ko-m12-8", title: "M12 Mastery Test",                status: "available" as const },
    ];

    const m13Lessons = [
      { id: "ko-m13-1", title: "월 — months",                       status: "available" as const },
      { id: "ko-m13-2", title: "Frequency — 항상 / 자주 / 가끔",     status: "available" as const },
      { id: "ko-m13-3", title: "부터 / 까지 — from … until",         status: "available" as const },
      { id: "ko-m13-4", title: "그래서 — so / therefore",           status: "available" as const },
      { id: "ko-m13-5", title: "Routine — how often",               status: "available" as const },
      { id: "ko-m13-6", title: "Schedules — ranges + actions",      status: "available" as const },
      { id: "ko-m13-7", title: "Mini-dialogue — your routine",      status: "available" as const },
      { id: "ko-m13-8", title: "M13 Mastery Test",                  status: "available" as const },
    ];

    const m14Lessons = [
      { id: "ko-m14-1", title: "고 — and / and then",               status: "available" as const },
      { id: "ko-m14-2", title: "아서 / 어서 — and so (sequence)",    status: "available" as const },
      { id: "ko-m14-3", title: "아서 / 어서 — because",              status: "available" as const },
      { id: "ko-m14-4", title: "Big numbers — 백 / 천 / 만",         status: "available" as const },
      { id: "ko-m14-5", title: "Prices — 원 + big numbers",          status: "available" as const },
      { id: "ko-m14-6", title: "아 / 어 주세요 — please do",         status: "available" as const },
      { id: "ko-m14-7", title: "Mini-dialogue — asking for help",   status: "available" as const },
      { id: "ko-m14-8", title: "M14 Mastery Test",                  status: "available" as const },
    ];

    const m15Lessons = [
      { id: "ko-m15-1", title: "고 있어요 — is …-ing",              status: "available" as const },
      { id: "ko-m15-2", title: "고 있어요 — questions & more",       status: "available" as const },
      { id: "ko-m15-3", title: "아도 / 어도 돼요 — may I…?",         status: "available" as const },
      { id: "ko-m15-4", title: "Yes you may / no you may not",      status: "available" as const },
      { id: "ko-m15-5", title: "지만 — but / although",             status: "available" as const },
      { id: "ko-m15-6", title: "Ongoing actions + contrast",       status: "available" as const },
      { id: "ko-m15-7", title: "Mini-dialogue — at the café",       status: "available" as const },
      { id: "ko-m15-8", title: "M15 Mastery Test",                  status: "available" as const },
    ];

    const m16Lessons = [
      { id: "ko-m16-1", title: "(으)면 안 돼요 — you must not",      status: "available" as const },
      { id: "ko-m16-2", title: "지 마세요 — please don't",           status: "available" as const },
      { id: "ko-m16-3", title: "고 나서 — after doing",             status: "available" as const },
      { id: "ko-m16-4", title: "좋아하다 — to like",                status: "available" as const },
      { id: "ko-m16-5", title: "싫어하다 — to dislike",             status: "available" as const },
      { id: "ko-m16-6", title: "Rules & preferences",              status: "available" as const },
      { id: "ko-m16-7", title: "Mini-dialogue — house rules",       status: "available" as const },
      { id: "ko-m16-8", title: "M16 Mastery Test",                  status: "available" as const },
    ];

    const m17Lessons = [
      { id: "ko-m17-1", title: "Getting around — 버스, 지하철",      status: "available" as const },
      { id: "ko-m17-2", title: "(으)로 — by (transport)",           status: "available" as const },
      { id: "ko-m17-3", title: "타다 / 내리다 — get on / off",       status: "available" as const },
      { id: "ko-m17-4", title: "Directions — 왼쪽 / 오른쪽",         status: "available" as const },
      { id: "ko-m17-5", title: "까지 — as far as (a place)",         status: "available" as const },
      { id: "ko-m17-6", title: "Getting somewhere",                status: "available" as const },
      { id: "ko-m17-7", title: "Mini-dialogue — asking the way",    status: "available" as const },
      { id: "ko-m17-8", title: "M17 Mastery Test",                  status: "available" as const },
    ];

    const m18Lessons = [
      { id: "ko-m18-1", title: "Weather — 날씨, 비, 눈",            status: "available" as const },
      { id: "ko-m18-2", title: "덥다 / 춥다 — hot & cold",          status: "available" as const },
      { id: "ko-m18-3", title: "Seasons — 봄 / 여름 / 가을 / 겨울",  status: "available" as const },
      { id: "ko-m18-4", title: "(으)ㄹ 거예요 — will / probably",    status: "available" as const },
      { id: "ko-m18-5", title: "것 같아요 — I think / it seems",     status: "available" as const },
      { id: "ko-m18-6", title: "Forecasting",                      status: "available" as const },
      { id: "ko-m18-7", title: "Mini-dialogue — the weather",       status: "available" as const },
      { id: "ko-m18-8", title: "M18 Mastery Test",                  status: "available" as const },
    ];

    const m19Lessons = [
      { id: "ko-m19-1", title: "Family — 가족, 엄마, 아빠",          status: "available" as const },
      { id: "ko-m19-2", title: "Siblings — 형 / 오빠 / 누나 / 언니",  status: "available" as const },
      { id: "ko-m19-3", title: "우리 — our / my (family)",           status: "available" as const },
      { id: "ko-m19-4", title: "Counting people — 명",              status: "available" as const },
      { id: "ko-m19-5", title: "Age — 살",                          status: "available" as const },
      { id: "ko-m19-6", title: "Describing your family",            status: "available" as const },
      { id: "ko-m19-7", title: "Mini-dialogue — family",            status: "available" as const },
      { id: "ko-m19-8", title: "M19 Mastery Test",                  status: "available" as const },
    ];

    const m20Lessons = [
      { id: "ko-m20-1", title: "Body — 머리, 눈, 코, 입",            status: "available" as const },
      { id: "ko-m20-2", title: "Body — 손, 발, 배, 목",             status: "available" as const },
      { id: "ko-m20-3", title: "아프다 — to hurt / be sick",         status: "available" as const },
      { id: "ko-m20-4", title: "Health — 병원, 약, 감기, 열",        status: "available" as const },
      { id: "ko-m20-5", title: "(으)니까 — because / since",        status: "available" as const },
      { id: "ko-m20-6", title: "Explaining you're sick",            status: "available" as const },
      { id: "ko-m20-7", title: "Mini-dialogue — at the doctor's",    status: "available" as const },
      { id: "ko-m20-8", title: "M20 Mastery Test",                  status: "available" as const },
    ];

    const m21Lessons = [
      { id: "ko-m21-1", title: "Food — 고기, 생선, 채소, 과일",       status: "available" as const },
      { id: "ko-m21-2", title: "Dishes — 김치, 비빔밥, 라면",        status: "available" as const },
      { id: "ko-m21-3", title: "하고 / (이)랑 — and / with",        status: "available" as const },
      { id: "ko-m21-4", title: "Counting drinks — 잔",             status: "available" as const },
      { id: "ko-m21-5", title: "(이)라고 하다 — it's called …",      status: "available" as const },
      { id: "ko-m21-6", title: "Ordering food",                     status: "available" as const },
      { id: "ko-m21-7", title: "Mini-dialogue — at a restaurant",    status: "available" as const },
      { id: "ko-m21-8", title: "M21 Mastery Test",                  status: "available" as const },
    ];

    const m22Lessons = [
      { id: "ko-m22-1", title: "보다 — than",                       status: "available" as const },
      { id: "ko-m22-2", title: "더 / 덜 — more / less",             status: "available" as const },
      { id: "ko-m22-3", title: "제일 / 가장 — the most",            status: "available" as const },
      { id: "ko-m22-4", title: "중에서 — among / out of",          status: "available" as const },
      { id: "ko-m22-5", title: "Which is more …?",                  status: "available" as const },
      { id: "ko-m22-6", title: "Comparing food & places",           status: "available" as const },
      { id: "ko-m22-7", title: "Mini-dialogue — which is better?",   status: "available" as const },
      { id: "ko-m22-8", title: "M22 Mastery Test",                  status: "available" as const },
    ];

    const m23Lessons = [
      { id: "ko-m23-1", title: "Activities — 수영, 운전, 노래, 요리",  status: "available" as const },
      { id: "ko-m23-2", title: "(으)ㄹ 수 있다 / 없다 — can / cannot", status: "available" as const },
      { id: "ko-m23-3", title: "잘하다 / 못하다 — good / bad at",     status: "available" as const },
      { id: "ko-m23-4", title: "(으)ㄹ까요? — shall we …?",          status: "available" as const },
      { id: "ko-m23-5", title: "(으)ㅂ시다 — let's …",              status: "available" as const },
      { id: "ko-m23-6", title: "Making plans",                      status: "available" as const },
      { id: "ko-m23-7", title: "Mini-dialogue — let's do something", status: "available" as const },
      { id: "ko-m23-8", title: "M23 Mastery Test",                  status: "available" as const },
    ];

    const m24Lessons = [
      { id: "ko-m24-1", title: "Hobbies — 취미, 그림, 사진, 음악",     status: "available" as const },
      { id: "ko-m24-2", title: "(으)ㄹ 줄 알다 / 모르다 — know how to", status: "available" as const },
      { id: "ko-m24-3", title: "거나 — or (doing X or Y)",          status: "available" as const },
      { id: "ko-m24-4", title: "Counting times — 번",              status: "available" as const },
      { id: "ko-m24-5", title: "How often — 일주일에 두 번",         status: "available" as const },
      { id: "ko-m24-6", title: "Describing your hobbies",           status: "available" as const },
      { id: "ko-m24-7", title: "Mini-dialogue — hobbies",           status: "available" as const },
      { id: "ko-m24-8", title: "M24 Mastery Test",                  status: "available" as const },
    ];

    const m25Lessons = [
      { id: "ko-m25-1", title: "Travel — 여행, 계획, 출발, 도착",       status: "available" as const },
      { id: "ko-m25-2", title: "Events — 온천, 축제, 결혼, 졸업",       status: "available" as const },
      { id: "ko-m25-3", title: "(으)려고 하다 — intend to",            status: "available" as const },
      { id: "ko-m25-4", title: "(으)러 가다 — go to do",              status: "available" as const },
      { id: "ko-m25-5", title: "(으)ㄴ 적이 있다 — have you ever",      status: "available" as const },
      { id: "ko-m25-6", title: "(으)ㄹ 때 — when",                    status: "available" as const },
      { id: "ko-m25-7", title: "Mini-dialogue — planning a trip",     status: "available" as const },
      { id: "ko-m25-8", title: "M25 Mastery Test",                   status: "available" as const },
    ];

    const m26Lessons = [
      { id: "ko-m26-1", title: "Trouble — 피곤하다, 늦다, 잊어버리다",   status: "available" as const },
      { id: "ko-m26-2", title: "Connectives — 그래서, 하지만, 그리고",  status: "available" as const },
      { id: "ko-m26-3", title: "거든요 — explaining a reason",         status: "available" as const },
      { id: "ko-m26-4", title: "너무 — too / too much",               status: "available" as const },
      { id: "ko-m26-5", title: "아/어서 — so / because",              status: "available" as const },
      { id: "ko-m26-6", title: "Explaining why",                      status: "available" as const },
      { id: "ko-m26-7", title: "Mini-dialogue — why are you late?",   status: "available" as const },
      { id: "ko-m26-8", title: "M26 Mastery Test",                   status: "available" as const },
    ];

    const m27Lessons = [
      { id: "ko-m27-1", title: "Goals — 결정하다, 약속, 준비, 연습",     status: "available" as const },
      { id: "ko-m27-2", title: "Health — 건강, 조심하다",              status: "available" as const },
      { id: "ko-m27-3", title: "아/어야 되다 — must / have to",        status: "available" as const },
      { id: "ko-m27-4", title: "는 게 좋다 — should / better to",      status: "available" as const },
      { id: "ko-m27-5", title: "아/어지다 — become",                  status: "available" as const },
      { id: "ko-m27-6", title: "이/가 되다 — become (a …)",           status: "available" as const },
      { id: "ko-m27-7", title: "Mini-dialogue — giving advice",       status: "available" as const },
      { id: "ko-m27-8", title: "M27 Mastery Test",                   status: "available" as const },
    ];

    const sideQuests: SideQuest[] = [
      {
        id: "ko-survival-phrasebook",
        emoji: "🗺️",
        title: "Survival Phrasebook",
        meta: "15 essentials · ~5 min · travel-ready",
        progress: 0,
        // Lesson content DELETED 2026-07-16 (side lessons to be remade);
        // tile stays visible but inert until the remake lands.
        comingSoon: true,
      },
      {
        id: "kdrama-vocab",
        emoji: "📺",
        title: "K-drama Vocab",
        meta: "12 words · oppa, daebak…",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "kfood-vocab",
        emoji: "🍜",
        title: "Korean Food",
        meta: "10 words · 비빔밥, 김치, 라면",
        unlockAfter: "ko-m1-complete",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "daily-challenge",
        emoji: "⚡",
        title: "Daily Challenge",
        meta: "+20 XP · 60s timer",
        progress: 0,
        isDaily: true,
        comingSoon: true,
      },
    ];

    return {
      id: "mock-1",
      title: `${langName} for Beginners`,
      languageId,
      modules: [
        {
          id: "m1",
          title: "The Hangul foundation",
          eyebrow: "Module 1 · Reading",
          summary: "Concept + 6 vowels + 9 plain consonants. By the end you can read any pure-plain-consonant Korean syllable.",
          lessons: m1Lessons,
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          id: "m2",
          title: "Aspirated · Tense · Extended vowels",
          eyebrow: "Module 2 · Finishing the script",
          summary: "Aspirated and tense consonants, y/compound vowels, and final consonants (받침). Everything you need to read every Korean syllable.",
          lessons: m2Lessons,
          accent: { from: "#6366f1", to: "#8b5cf6" },
        },
        {
          id: "m3",
          title: "First phrases",
          eyebrow: "Module 3 · Speak",
          summary: "Greetings, introductions, 이에요/예요. Real vocabulary on top of a real reading foundation.",
          lessons: m3Lessons,
          accent: { from: "#ec4899", to: "#db2777" },
        },
        {
          id: "m4",
          title: "Things & possession",
          eyebrow: "Module 4 · Describe",
          summary: "Everyday objects, the possessive 의 (and 제 = my), and the 이거/그거/저거 'this & that' system.",
          lessons: m4Lessons,
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          id: "m5",
          title: "Numbers & counting",
          eyebrow: "Module 5 · Order",
          summary: "Native numbers, counters (개/명/잔), and 주세요 — everything you need to count and order.",
          lessons: m5Lessons,
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          id: "m6",
          title: "Places & existence",
          eyebrow: "Module 6 · Locate",
          summary: "Places, 있어요/없어요 (there is/isn't), the 에 vs 에서 contrast, and asking 어디에 있어요?",
          lessons: m6Lessons,
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          id: "m7",
          title: "Verbs & the 해요 present",
          eyebrow: "Module 7 · Act",
          summary: "Action verbs in the polite 해요 present (가요/먹어요/해요) and the object particle 을/를.",
          lessons: m7Lessons,
          accent: { from: "#ef4444", to: "#dc2626" },
        },
        {
          id: "m8",
          title: "Describing things",
          eyebrow: "Module 8 · Describe",
          summary: "Korean adjectives are verbs: 좋아요/커요/예뻐요, the ㅡ-drop, and the attributive 좋은 책.",
          lessons: m8Lessons,
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          id: "m9",
          title: "Connecting things",
          eyebrow: "Module 9 · Connect",
          summary: "Join nouns and add 'also': 하고 (and/with), the formal 와/과, and the particle-replacing 도.",
          lessons: m9Lessons,
          accent: { from: "#10b981", to: "#059669" },
        },
        {
          id: "m10",
          title: "The past tense",
          eyebrow: "Module 10 · Recall",
          summary: "Polite past for verbs and adjectives (먹었어요/좋았어요), the past copula, and 어제/오늘.",
          lessons: m10Lessons,
          accent: { from: "#3b82f6", to: "#2563eb" },
        },
        {
          id: "m11",
          title: "Saying no & saying can't",
          eyebrow: "Module 11 · Negate",
          summary: "안 (don't) vs 못 (can't), the 공부 안 해요 split, past negation, and 고 싶어요 (want to).",
          lessons: m11Lessons,
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        {
          id: "m12",
          title: "Time & the week",
          eyebrow: "Module 12 · Schedule",
          summary: "The clock (native-number hours + Sino-number minutes), days of the week, and the time particle 에.",
          lessons: m12Lessons,
          accent: { from: "#06b6d4", to: "#0891b2" },
        },
        {
          id: "m13",
          title: "Months & frequency",
          eyebrow: "Module 13 · Habits",
          summary: "Months (Sino + 월, incl. 유월/시월), the frequency spectrum (항상→전혀), ranges 부터/까지, and 그래서.",
          lessons: m13Lessons,
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          id: "m14",
          title: "Connecting & requesting",
          eyebrow: "Module 14 · Combine",
          summary: "The 고 and 아/어서 clause connectives, 아/어 주세요 requests, and big Sino numbers (백/천/만).",
          lessons: m14Lessons,
          accent: { from: "#6366f1", to: "#8b5cf6" },
        },
        {
          id: "m15",
          title: "Now, allowed, but",
          eyebrow: "Module 15 · Nuance",
          summary: "The progressive 고 있어요, asking/granting permission with 도 돼요, and contrast with 지만.",
          lessons: m15Lessons,
          accent: { from: "#ec4899", to: "#db2777" },
        },
        {
          id: "m16",
          title: "Rules & preferences",
          eyebrow: "Module 16 · Permit",
          summary: "Prohibition (으)면 안 돼요, the negative request 지 마세요, 고 나서, and 좋아하다/싫어하다.",
          lessons: m16Lessons,
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          id: "m17",
          title: "Getting around",
          eyebrow: "Module 17 · Travel",
          summary: "Transport vocab, the means particle (으)로, 타다/내리다, directions, and the spatial 까지.",
          lessons: m17Lessons,
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          id: "m18",
          title: "Weather & the future",
          eyebrow: "Module 18 · Predict",
          summary: "Weather & seasons, the ㅂ-irregular 덥다/춥다, the future (으)ㄹ 거예요, and 것 같아요 (it seems).",
          lessons: m18Lessons,
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          id: "m19",
          title: "Family & people",
          eyebrow: "Module 19 · Kin",
          summary: "Family & sibling words, the in-group 우리 ('my'), counting people with 명, and giving ages with 살.",
          lessons: m19Lessons,
          accent: { from: "#f43f5e", to: "#e11d48" },
        },
        {
          id: "m20",
          title: "Body & health",
          eyebrow: "Module 20 · Care",
          summary: "Body parts, the ㅡ-irregular 아파요 ('hurts'), health vocab, and the reason connector (으)니까.",
          lessons: m20Lessons,
          accent: { from: "#10b981", to: "#059669" },
        },
        {
          id: "m21",
          title: "Food & restaurants",
          eyebrow: "Module 21 · Dine",
          summary: "Food & Korean dishes, listing with 하고/(이)랑, counting drinks with 잔, and naming with (이)라고 하다.",
          lessons: m21Lessons,
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          id: "m22",
          title: "Comparison",
          eyebrow: "Module 22 · Compare",
          summary: "Comparatives with 보다 and 더/덜, superlatives with 제일/가장, and picking the best with 중에서.",
          lessons: m22Lessons,
          accent: { from: "#06b6d4", to: "#0891b2" },
        },
        {
          id: "m23",
          title: "Ability & suggestions",
          eyebrow: "Module 23 · Plan",
          summary: "Ability with (으)ㄹ 수 있다/없다, skills with 잘하다/못하다, and suggestions with (으)ㄹ까요? / (으)ㅂ시다.",
          lessons: m23Lessons,
          accent: { from: "#6366f1", to: "#4f46e5" },
        },
        {
          id: "m24",
          title: "Hobbies & activities",
          eyebrow: "Module 24 · Enjoy",
          summary: "Hobby vocab, knowing how with (으)ㄹ 줄 알다/모르다, alternatives with 거나, and counting times with 번.",
          lessons: m24Lessons,
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        {
          id: "m25",
          title: "Plans & intentions",
          eyebrow: "Module 25 · Plan",
          summary: "Intentions with (으)려고 하다, purpose with (으)러 가다, experience with (으)ㄴ 적이 있다, and 'when' with (으)ㄹ 때.",
          lessons: m25Lessons,
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          id: "m26",
          title: "Explaining & excess",
          eyebrow: "Module 26 · Explain",
          summary: "Explaining reasons with 거든요, excess with 너무, cause→result with 아/어서, and connectives 그래서/하지만/그리고/그런데.",
          lessons: m26Lessons,
          accent: { from: "#f43f5e", to: "#e11d48" },
        },
        {
          id: "m27",
          title: "Modal grammar",
          eyebrow: "Module 27 · Advise",
          summary: "Obligation with 아/어야 되다, advice with 는 게 좋다, and change of state with 아/어지다 and 이/가 되다.",
          lessons: m27Lessons,
          accent: { from: "#10b981", to: "#059669" },
        },
      ],
      sideQuests,
    };
  }

  const isSpanish = languageId === "es";

  if (isSpanish) {
    // ES pathway is assembled from the per-module curriculum files — see
    // es/curriculum/index.ts. Modules whose lesson arrays are still empty
    // stubs are skipped there, so the learn map only shows authored content.
    return {
      id: "mock-1",
      title: `${langName} for Beginners`,
      languageId,
      modules: buildSpanishCourse(),
    };
  }

  return {
    id: "mock-1",
    title: `${langName} for Beginners`,
    languageId,
    modules: [
      {
        id: "m1",
        title: "Basics",
        lessons: [
          ...alphabetLesson,
          ...introLesson,
          { id: "m1-l3", title: "Colors", status: "locked" as const },
        ],
      },
      {
        id: "m2",
        title: "Everyday phrases",
        lessons: [
          { id: "m2-l1", title: "Please and thank you", status: "available" },
          { id: "m2-l2", title: "Asking for directions", status: "locked" },
          { id: "m2-l3", title: "At the market", status: "locked" },
        ],
      },
      {
        id: "m3",
        title: "Grammar foundations",
        lessons: [
          { id: "m3-l1", title: "Simple present", status: "locked" },
          { id: "m3-l2", title: "Questions", status: "locked" },
        ],
      },
    ],
  };
}
