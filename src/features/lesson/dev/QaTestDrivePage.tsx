import { useEffect, useMemo, useState } from "react";
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

const STORAGE_KEY = "lingo:qa-notes:v1";

function loadNotes(): QaNotes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as QaNotes;
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
    "Verified 2026-07-12: long info bodies scroll INSIDE the step scroller (overflow-y-auto) — the window never scrolls, even at 480px viewport height. Constraint lives in LessonPage's fixed shell.",
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
      hint: [
        `${c.totalLessons} lesson${c.totalLessons === 1 ? "" : "s"} use this type`,
        VERIFIED_NOTES[`step:${c.type}`],
      ]
        .filter(Boolean)
        .join(" · "),
      links: [
        ...c.picks.map((pick) => ({
          label: `${pick.moduleId} · ${pick.lessonId} (${pick.count}×)`,
          href: p(`/learn/lessons/${pick.lessonId}`),
        })),
        { label: "fixture", href: p(`/lesson-preview#step-${c.type}`) },
      ],
    }));

  const unusedItems: QaItem[] = ALL_STEP_TYPES.filter((t) =>
    UNUSED_STEP_TYPES.includes(t),
  ).map((t) => ({
    id: `step:${t}`,
    title: `${t} — unused in shipped content`,
    hint: "Engine + fixture exist but no static lesson uses it. Decide: adopt or retire.",
    links: [{ label: "fixture", href: p(`/lesson-preview#step-${t}`) }],
  }));

  return [
    {
      id: "steps",
      title: "Step types in real lessons",
      blurb:
        "Every step type the engine ships, linked to 1-2 real lessons that use it (early + late module). Play at least one lesson per row.",
      items: [...stepItems, ...unusedItems],
    },
    {
      id: "testout",
      title: "Placement & test-out",
      items: [
        {
          id: "route:placement",
          title: "Adaptive placement test",
          links: [{ label: "placement-test", href: p("/learn/placement-test") }],
          hint: "FTUE offer appears on Learn at 0 progress (dev panel → Clear progress).",
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
            { label: "hub", href: p("/practice/conjugation") },
            { label: "free drill", href: p("/practice/conjugation/free") },
            { label: "combined", href: p("/practice/conjugation/train") },
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
          links: [{ label: "particles", href: p("/practice/particles") }],
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
            { label: "reading", href: p("/practice/reading") },
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
            { label: "stories page", href: p("/practice/stories") },
          ],
        },
        {
          id: "route:ftue",
          title: "FTUE → placement offer",
          links: [{ label: "learn (after reset)", href: p("/learn") }],
          hint: "Dev panel → Clear progress (now wipes server too) → FTUE should survive hydration and reach the placement offer.",
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
}

const STATUS_META: {
  value: Exclude<MarkStatus, "">;
  label: string;
  active: string;
}[] = [
  { value: "good", label: "✓ good", active: "border-success text-success" },
  { value: "issue", label: "⚠ issue", active: "border-warning text-warning" },
  { value: "broken", label: "✗ broken", active: "border-danger text-danger" },
];

export default function QaTestDrivePage() {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const sections = useMemo(() => buildSections(langId), [langId]);
  const [notes, setNotes] = useState<QaNotes>(loadNotes);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      /* storage full/unavailable — notes stay in memory */
    }
  }, [notes]);

  // Mirror notes to the dev server so an agent can watch critiques land
  // live while the tester works (vite middleware /__lingo-qa-notes →
  // /tmp/lingo-qa-notes.json — same pattern as the devLog console pipe).
  // Debounced fire-and-forget; failures are irrelevant in prod builds
  // where the middleware doesn't exist.
  useEffect(() => {
    const handle = setTimeout(() => {
      void fetch("/__lingo-qa-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedAt: new Date().toISOString(), ...notes }),
      }).catch(() => undefined);
    }, 1000);
    return () => clearTimeout(handle);
  }, [notes]);

  const allItems = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );
  const markedCount = allItems.filter(
    (i) => notes.items[i.id]?.status || notes.items[i.id]?.note?.trim(),
  ).length;

  const setMark = (id: string, patch: Partial<ItemMark>) =>
    setNotes((n) => {
      const prev: ItemMark = n.items[id] ?? { status: "", note: "" };
      return { ...n, items: { ...n.items, [id]: { ...prev, ...patch } } };
    });

  const exportMarkdown = () => {
    const lines: string[] = [
      `# Lingo QA test-drive notes`,
      `_Exported ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${markedCount}/${allItems.length} items marked_`,
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
        if (mark.note.trim()) {
          for (const noteLine of mark.note.trim().split("\n")) {
            lines.push(`  - ${noteLine}`);
          }
        }
      }
      lines.push("");
    }
    const md = lines.join("\n");
    void navigator.clipboard?.writeText(md).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qa-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetNotes = () => {
    if (window.confirm("Clear all QA notes and verdicts?")) {
      setNotes({ general: "", items: {} });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 text-text-primary">
      <header className="mb-6 border-b border-border pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
          DEV · QA test-drive
        </div>
        <h1 className="m-0 mt-1 text-2xl font-bold">
          Learning-path test drive
        </h1>
        <p className="m-0 mt-2 text-sm text-text-secondary">
          Work top to bottom: open each link (they open in a new tab), play
          it, then mark the row and drop critiques in the box. Notes persist
          in this browser AND stream live to the dev workshop — marks land
          instantly, note text after you pause typing. “Export” still works
          as the offline fallback.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded border border-border bg-surface-muted px-2 py-1 text-xs font-semibold">
            {markedCount}/{allItems.length} marked
          </span>
          <button
            type="button"
            onClick={exportMarkdown}
            className="rounded border border-accent px-2 py-1 text-xs font-semibold text-accent hover:bg-surface-muted"
          >
            {copied ? "Copied!" : "Export notes (copy + download)"}
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
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#qa-${s.id}`}
              className="rounded border border-border bg-surface px-2 py-0.5 hover:bg-surface-muted"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </header>

      <section className="mb-8 rounded-xl border border-border bg-surface p-4">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          General critiques
        </h2>
        <textarea
          value={notes.general}
          onChange={(e) =>
            setNotes((n) => ({ ...n, general: e.target.value }))
          }
          rows={3}
          placeholder="Anything cross-cutting: pacing, monotony, juice, difficulty curve…"
          className="mt-2 w-full rounded border border-border bg-bg-base px-2 py-1.5 text-sm"
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
                    className="rounded-xl border border-border bg-surface p-3"
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
                        <a
                          key={link.href + link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-border bg-bg-base px-2 py-0.5 text-xs text-accent underline-offset-2 hover:underline"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                    <textarea
                      value={mark.note}
                      onChange={(e) =>
                        setMark(item.id, { note: e.target.value })
                      }
                      rows={mark.note ? 3 : 1}
                      placeholder="Critiques…"
                      className="mt-2 w-full rounded border border-border/60 bg-bg-base px-2 py-1 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
