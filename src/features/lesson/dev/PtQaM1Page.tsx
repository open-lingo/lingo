import { getLanguageModule } from "@/shared/language/registry";

/**
 * DEV · PT scaffold status page. Route: `/:lang/qa/m1` (any `:lang` — this
 * page always reports on `pt` specifically, not the route param; unlike
 * `EsM1L1Page`'s promoted-content walker, there is nothing to WALK yet).
 *
 * docs/pt-course-design-2026-09-18.md §5's infra checklist wants "a
 * `/pt/qa/m1` dev walk page" so a future authoring lane has a place to
 * verify the scaffold is wired correctly BEFORE writing any lesson
 * content. Once m1 has real lessons, replace this with a promoted-content
 * walker mirroring `EsM1L1Page`/`ProtoModuleWalkerPage` — that pattern
 * needs `getMockLessonContent`, which needs `npm run content:emit` to have
 * produced real JSON for at least one lesson id, which PT does not have
 * yet. Reading the module contract directly (`getLanguageModule("pt")`)
 * sidesteps that dependency entirely, which is exactly right for a
 * zero-content scaffold: this page proves registry → module → curriculum →
 * atoms → placement all resolve without throwing, nothing more.
 */
export default function PtQaM1Page() {
  const m = getLanguageModule("pt");
  const m1 = m.curriculum.find((mod) => mod.id === "m1");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>🇧🇷 PT scaffold status — m1</h1>
      <p style={{ opacity: 0.75, marginTop: 4 }}>
        Infra scaffolding lane (docs/pt-course-design-2026-09-18.md §5). No
        lesson content — this page proves the plumbing, not the course.
      </p>

      <dl style={{ marginTop: 20, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px" }}>
        <dt>module id</dt>
        <dd>{m.id}</dd>
        <dt>display name</dt>
        <dd>{m.displayName.en} · {m.displayName.native}</dd>
        <dt>courseId</dt>
        <dd>{m.courseId}</dd>
        <dt>curriculum modules</dt>
        <dd>{m.curriculum.length} (m1 {m1 ? `present, ${m1.lessons.length} lesson(s)` : "not yet in the course map — empty, filtered out by buildPortugueseCourse()"})</dd>
        <dt>course atoms</dt>
        <dd>{m.courseAtoms.length}</dd>
        <dt>particles</dt>
        <dd>{m.particles?.particles.length ?? 0}</dd>
        <dt>conjugation tables</dt>
        <dd>{m.conjugation?.tables.length ?? 0}</dd>
        <dt>placement screener</dt>
        <dd>{m.placementBank.screener.length}</dd>
        <dt>TTS manifest</dt>
        <dd>schema {m.ttsManifest.schema}, {m.ttsManifest.count} clip(s), prefix {m.ttsManifest.prefix}</dd>
        <dt>in AVAILABLE_LEARNING_LANGUAGE_IDS</dt>
        <dd>no (by design — see languageConfig.ts)</dd>
      </dl>

      <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
        All-zero is the correct, expected state until an authoring lane runs
        `node scripts/compile-ir-pt.mjs m1` against a real
        `curriculum/ir/m1.ir.yaml`, or hand-writes `curriculum/m1.ts`.
      </p>
    </div>
  );
}
