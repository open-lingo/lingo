import { useAllContentReady, useContentRevision } from "@/features/lesson/data/useLessonContent";
import { ProtoModuleWalker, type ProtoModuleConfig } from "./ProtoModuleWalkerPage";
import { PT_M1_LESSONS } from "@/features/languages/pt/curriculum/m1";
import { getMockLessonContent } from "../data/mockLessons";

/**
 * DEV · PT module-1 QA walker. Route: `/:lang/qa/m1` (any `:lang` prefix
 * that resolves — this page always reports on `pt` specifically, mirroring
 * `EsM1L1Page`'s language-dispatched pattern).
 *
 * lane/PTBETA (2026-09-18): replaces the PTINFRA scaffold-status page
 * (a `<dl>` of registry/curriculum counts) with the REAL promoted-content
 * walker — `ProtoModuleWalker` + `StepRenderer`, same render pipeline
 * `EsM1L1Page`/`ProtoModuleWalker` use for es/fr — so an authoring lane
 * can walk every compiled PT lesson through the actual step renderer the
 * moment `curriculum/m1.ts` gains lessons (hand-authored or via
 * `node scripts/compile-ir-pt.mjs m1`), with zero further wiring.
 *
 * `PT_M1_LESSONS` is `[]` today (docs/pt-course-design-2026-09-18.md §5 —
 * no lesson content yet), so `titles` is `[]`. `ProtoModuleWalker` itself
 * always calls `config.build(1)` on mount with no zero-lesson guard —
 * reusing it unconditionally would throw immediately. The guard therefore
 * lives here: `stepsFor` returns `[]` instead of throwing when
 * `getMockLessonContent` has nothing for a lesson id (it never will for
 * `pt-m1-*` until content exists — `pt` is not in `content:emit`'s `LANGS`
 * array, so no id is ever registered), and this page renders an explicit
 * "0 lessons" empty state INSTEAD OF mounting `ProtoModuleWalker` while
 * `titles.length === 0` — proving the plumbing (imports resolve, the
 * route renders, nothing throws) without pretending there is a lesson 1
 * to walk.
 */

function stepsFor(lessonId: string) {
  const content = getMockLessonContent(lessonId);
  return content ? content.steps : [];
}

const PT_CONFIG: ProtoModuleConfig = {
  eyebrow: "QA · PT m1 (promoted course content)",
  heading: "🇧🇷 Módulo 1",
  blurb:
    "Portuguese module 1 — ser/estar/ter, greetings, and the first contractions (docs/pt-course-design-2026-09-18.md §4). Walks the same promoted-content pipeline as the ES/FR m1 QA pages.",
  titles: PT_M1_LESSONS.map((l) => l.title),
  build: async (n) => stepsFor(`pt-m1-${n}`),
  completeTitle: "Módulo um completo!",
  completeBody: "The first module, done — real sentences, no wall of text.",
};

export default function PtQaM1Page() {
  // Content-as-data: the proto pages read lessons synchronously; load all
  // courses and re-render when they land.
  const contentState = useAllContentReady();
  useContentRevision();

  // pt is not in AVAILABLE_LEARNING_LANGUAGE_IDS, so unlike es/fr (whose
  // content chunk is already hot by the time anyone reaches a QA route)
  // nothing has fetched pt's JSON before this page mounts. `ProtoModuleWalker`
  // calls `config.build(1)` in a mount effect keyed on `[lessonN, build]` —
  // if that fires before `ensureAllContentLoaded()` resolves, `stepsFor`
  // finds no registered lesson, returns `[]`, and the effect never re-runs
  // once content lands (its deps don't include content-revision), so the
  // walker is stuck showing "lesson complete" with 0 steps forever (PTQA
  // lane, 2026-09-18 — reproduced on a cold dev server + fresh profile).
  // Hold the walker unmounted until content is actually ready.
  if (contentState !== "ready") {
    return (
      <p style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif", opacity: 0.6 }}>
        Loading course content…
      </p>
    );
  }

  if (PT_CONFIG.titles.length === 0) {
    return (
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "24px 16px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>
          {PT_CONFIG.eyebrow}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{PT_CONFIG.heading}</h1>
        <p style={{ opacity: 0.75, marginTop: 8 }} data-testid="pt-qa-empty-state">
          0 lessons. <code>curriculum/m1.ts</code>'s <code>PT_M1_LESSONS</code>{" "}
          is still an empty stub — nothing to walk yet. This page proves the
          route + render pipeline resolve without throwing; once m1 has ≥1
          lesson (hand-authored or via{" "}
          <code>node scripts/compile-ir-pt.mjs m1</code>), it renders through
          the real <code>StepRenderer</code>, same as the ES/FR m1 QA pages.
        </p>
      </div>
    );
  }

  return <ProtoModuleWalker config={PT_CONFIG} />;
}
