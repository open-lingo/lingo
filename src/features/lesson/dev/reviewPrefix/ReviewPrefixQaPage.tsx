import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMockLessonContent } from "../../data/mockLessons";
import { DYNAMIC_REVIEW_PREFIX_CAP } from "../../data/dynamicReviewPrefix";
import { getAtomsUpToModule } from "../../data/lessonAtomIndex";
import { unlockAtomIds } from "../../data/unlockLessonAtoms";
import {
  setSRSStore,
  clearSRSStore,
  canonicalize,
} from "@/features/flashcards/engine/srsStorage";
import {
  createInitialState,
  createSeededState,
  getToday,
} from "@/features/flashcards/engine/srs";
import { clearGrammarStore } from "@/features/flashcards/engine/grammarSrs";
import { resetKanjiLatchStore } from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import { isSwitchoverAtom } from "@/features/languages/ja/secondScript/switchoverCandidate";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { getTtsUrl } from "@/shared/tts";
import type { LessonContent, LessonStep } from "../../types";

/**
 * DEV · B069 phase 1 — dynamic review-prefix preview.
 * Route: `/:lang/qa/review-prefix`.
 *
 * Renders a shipped dedicated review lesson (`ja-mN-neo-review-*`) under
 * synthetic FSRS states so Gate 10 and learner-sims can SEE the dynamic
 * segment that `withDynamicReviewPrefix` prepends at content-load time:
 * nothing-due (byte-identical authored lesson), heavy-due (segment at its
 * cap), and switchover-ready (the B061 beat leading the lesson).
 *
 * ⚠️ Applying a scenario REWRITES the browser's local SRS/unlock/latch
 * stores. The page snapshots the affected keys on first use; "Restore my
 * data" writes the snapshot back and reloads (module-level caches make an
 * in-place restore unreliable). Use a throwaway profile for judge runs.
 */

const SCENARIO_IDS = ["nothing-due", "heavy-due", "switchover-ready"] as const;
type ScenarioId = (typeof SCENARIO_IDS)[number];

const SCENARIO_HINTS: Record<ScenarioId, string> = {
  "nothing-due":
    "Empty learner state — the authored lesson must come back with ZERO dynamic steps (byte-identical pass-through).",
  "heavy-due":
    `Everything unlocked and overdue, a few never-reviewed — due atoms claim the budget (cap ${DYNAMIC_REVIEW_PREFIX_CAP}); intake seats/grammar only if room remains.`,
  "switchover-ready":
    "Switchover-eligible words unlocked (module trigger) — the kana→kanji beat (reveal + graded cloze) leads the lesson.",
};

const LESSON_CHOICES = [
  "ja-m9-neo-review-1",
  "ja-m9-neo-review-2",
  "ja-m16-neo-review-1",
  "ja-m22-neo-review-1",
  "ja-m22-neo-review-2",
];

/** Every store the scenarios touch — snapshotted before the first apply. */
const AFFECTED_KEYS = [
  "open-lingo-srs:v2",
  "open-lingo-srs-grammar:v1",
  "lingo:unlocked-atoms",
  "open-lingo-kanji-switch:v1",
  "open-lingo-kanji-switch-miss:v1",
];
const SNAPSHOT_KEY = "lingo:qa-review-prefix-snapshot:v1";

function snapshotOnce(): void {
  if (localStorage.getItem(SNAPSHOT_KEY)) return; // keep the ORIGINAL data
  const snap: Record<string, string | null> = {};
  for (const k of AFFECTED_KEYS) snap[k] = localStorage.getItem(k);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
}

function restoreSnapshotAndReload(): void {
  const raw = localStorage.getItem(SNAPSHOT_KEY);
  if (raw) {
    const snap = JSON.parse(raw) as Record<string, string | null>;
    for (const k of AFFECTED_KEYS) {
      const v = snap[k];
      if (v === null || v === undefined) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
    localStorage.removeItem(SNAPSHOT_KEY);
  }
  // Module-level caches (latch store, SRS parse cache…) don't watch raw
  // writes — a reload is the only trustworthy restore.
  window.location.reload();
}

function moduleIdOf(lessonId: string): string {
  return /^ja-(m\d+)-/.exec(lessonId)![1];
}

/** Overdue, non-new card — both modalities graded and past due. */
function dueState() {
  const s = createInitialState();
  for (const sub of [s.recognition, s.production]) {
    sub.reps = 3;
    sub.state = "review" as const;
    sub.dueDate = "2020-01-01";
    sub.lastReviewDate = "2019-12-25";
  }
  return s;
}

function applyScenario(id: ScenarioId, lessonId: string): void {
  snapshotOnce();
  clearSRSStore();
  clearGrammarStore();
  resetKanjiLatchStore();
  localStorage.removeItem("lingo:unlocked-atoms");
  if (id === "nothing-due") return;
  if (id === "heavy-due") {
    const atoms = getAtomsUpToModule(moduleIdOf(lessonId), "ja");
    unlockAtomIds(atoms.map((a) => a.id));
    // ONE bulk store write — per-card setCardState re-serializes the whole
    // store each call, which stalls first paint for hundreds of atoms.
    const store: Record<string, ReturnType<typeof dueState>> = {};
    // Most overdue; the newest 6 stay reps-0 with a MATURED seed (due today)
    // so the intake seats are demonstrable when the due queue thins.
    for (const a of atoms.slice(0, -6)) store[canonicalize(a.id)] = dueState();
    for (const a of atoms.slice(-6))
      store[canonicalize(a.id)] = createSeededState(getToday());
    setSRSStore(store);
    return;
  }
  // switchover-ready: unlock every switchover-eligible word; the module
  // trigger does the rest (no FSRS gate — kanji-switchover-design §6).
  unlockAtomIds(
    [...KANJI_ELIGIBLE_ATOMS.keys()].filter((aid) => isSwitchoverAtom(aid)),
  );
}

const isDynStep = (s: LessonStep) => s.id.includes("-dyn-");

function StepRow({ step, idx }: { step: LessonStep; idx: number }) {
  const dyn = isDynStep(step);
  const anyStep = step as LessonStep & {
    audioText?: string;
    transcript?: string;
    prompt?: string;
    sentence?: string;
    title?: string;
  };
  const spoken = anyStep.audioText ?? anyStep.transcript;
  const surface =
    spoken ?? anyStep.sentence ?? anyStep.prompt ?? anyStep.title ?? "";
  const ttsOk = spoken ? Boolean(getTtsUrl(spoken, "ja")) : null;
  return (
    <tr className={dyn ? "bg-accent/5" : undefined}>
      <td className="px-2 py-1 text-right tabular-nums text-text-muted">{idx}</td>
      <td className="px-2 py-1">
        {dyn ? (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            dynamic
          </span>
        ) : (
          <span className="text-[10px] uppercase text-text-muted">authored</span>
        )}
      </td>
      <td className="px-2 py-1 font-mono text-xs">{step.type}</td>
      <td className="max-w-[16rem] truncate px-2 py-1 text-xs" title={surface}>
        {surface}
      </td>
      <td className="px-2 py-1 text-xs">
        {(step.exercisedAtoms ?? []).slice(0, 3).join(", ")}
        {(step.exercisedAtoms?.length ?? 0) > 3 ? "…" : ""}
        {step.exercisedGrammar?.length ? (
          <span className="ml-1 text-accent">[{step.exercisedGrammar.join(",")}]</span>
        ) : null}
      </td>
      <td className="px-2 py-1 text-center">
        {ttsOk === null ? "—" : ttsOk ? "🔊" : "🔇 MISSING"}
      </td>
      <td className="max-w-[20rem] truncate px-2 py-1 font-mono text-[10px] text-text-muted" title={step.id}>
        {step.id}
      </td>
    </tr>
  );
}

export default function ReviewPrefixQaPage() {
  // URL-driven initial state so Gate 10 captures can address each scenario:
  // ?scenario=heavy-due&lesson=ja-m22-neo-review-1
  const params = new URLSearchParams(window.location.search);
  const urlScenario = params.get("scenario") as ScenarioId | null;
  const urlLesson = params.get("lesson");
  const [scenario, setScenario] = useState<ScenarioId>(
    urlScenario && SCENARIO_IDS.includes(urlScenario)
      ? urlScenario
      : "nothing-due",
  );
  const [lessonId, setLessonId] = useState(
    urlLesson && LESSON_CHOICES.includes(urlLesson)
      ? urlLesson
      : LESSON_CHOICES[3],
  );
  const [nonce, setNonce] = useState(0);

  const lesson: LessonContent | null = useMemo(() => {
    // Dev page: apply the synthetic stores synchronously, then resolve the
    // lesson through the REAL content path so what renders here is exactly
    // what the lesson page would build. Idempotent per (scenario, lesson).
    applyScenario(scenario, lessonId);
    return getMockLessonContent(lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, lessonId, nonce]);

  const dynCount = lesson?.steps.filter(isDynStep).length ?? 0;
  const beatCount =
    lesson?.steps.filter((s) => s.type === "kanji_reveal").length ?? 0;
  const grammarCount =
    lesson?.steps.filter((s) => s.id.includes("-dyn-grammar-")).length ?? 0;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <h1 className="text-xl font-bold">
            Dynamic review prefix — B069 phase 1 preview
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            The render-time segment prepended onto the static{" "}
            <code>ja-mN-neo-review-*</code> lessons: switchover beat → due
            atoms → due grammar → new-card seats, capped at{" "}
            {DYNAMIC_REVIEW_PREFIX_CAP} steps, due-first when over budget.
          </p>
          <p className="mt-2 rounded border border-amber-500/50 bg-amber-500/10 p-2 text-xs">
            Applying a scenario rewrites this browser's SRS/unlock/latch
            stores (original data snapshotted on first use).{" "}
            <button
              className="font-semibold text-accent underline"
              onClick={restoreSnapshotAndReload}
            >
              Restore my data
            </button>
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SCENARIO_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setScenario(id)}
              className={`rounded border px-3 py-1 text-sm font-semibold ${
                scenario === id
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface hover:bg-surface-muted"
              }`}
            >
              {id}
            </button>
          ))}
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1 text-sm"
          >
            {LESSON_CHOICES.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="rounded border border-border bg-surface px-3 py-1 text-sm hover:bg-surface-muted"
          >
            Rebuild
          </button>
          <Link
            to={`../learn/lessons/${lessonId}`}
            relative="path"
            className="rounded border border-accent px-3 py-1 text-sm font-semibold text-accent hover:bg-surface-muted"
          >
            Play with this state →
          </Link>
        </div>

        <p className="mb-3 text-sm text-text-muted">{SCENARIO_HINTS[scenario]}</p>

        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded bg-surface px-2 py-1 border border-border">
            dynamic steps: <b>{dynCount}</b> / cap {DYNAMIC_REVIEW_PREFIX_CAP}
          </span>
          <span className="rounded bg-surface px-2 py-1 border border-border">
            switchover reveals: <b>{beatCount}</b>
          </span>
          <span className="rounded bg-surface px-2 py-1 border border-border">
            grammar steps: <b>{grammarCount}</b>
          </span>
          <span className="rounded bg-surface px-2 py-1 border border-border">
            total steps: <b>{lesson?.steps.length ?? 0}</b>
          </span>
        </div>

        {lesson ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">origin</th>
                  <th className="px-2 py-2">type</th>
                  <th className="px-2 py-2">surface</th>
                  <th className="px-2 py-2">credits</th>
                  <th className="px-2 py-2">tts</th>
                  <th className="px-2 py-2">step id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lesson.steps.map((s, i) => (
                  <StepRow key={s.id} step={s} idx={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-danger">Lesson {lessonId} did not resolve.</p>
        )}
      </div>
    </div>
  );
}
