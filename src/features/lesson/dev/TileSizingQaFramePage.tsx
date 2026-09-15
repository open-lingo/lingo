import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StepRenderer } from "../components/StepRenderer";
import type { LessonStep } from "../types";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { getToday } from "@/features/flashcards/engine/srs";
import { setCardState, getCardState } from "@/features/flashcards/engine/srsStorage";
import { TILE_QA_MESSAGE } from "./tileSizingMessage";

/**
 * `/:lang/qa/tiles/frame?view=desktop|mobile` — the iframe target
 * `TileSizingQaPage` embeds twice (once at 430×932, once at 1280×900) so
 * real `@media` queries fire against a REAL viewport width. Renders the
 * six fixture step types Spencer asked for, through the SAME `StepRenderer`
 * production lessons use — no copies — so a token slider on the parent
 * changes the real components.
 *
 * `view` is read only for the on-page label; the actual desktop/mobile
 * split comes from whatever CSS width the parent gives this iframe.
 */

// One atom seeded to a MASTERED state so its build tile renders with the
// furigana HIDDEN (the "kanji with hidden reading" fixture tile Spencer
// asked for) — real state through the real `useBuildTileKanji` gate, not a
// prop override, so this line stays true if that gate ever changes.
const MASTERED_ATOM_ID = "ja-m7-1-v-nomu"; // 飲む — kanji-eligible, well past unlock
let seededMasteredAtom = false;
function seedMasteredAtomOnce() {
  if (seededMasteredAtom) return;
  seededMasteredAtom = true;
  const existing = getCardState(MASTERED_ATOM_ID);
  if (existing?.recognition?.reps && existing.recognition.reps > 0) return; // already seeded a prior run
  const today = getToday();
  const masteredSub = {
    stability: 60,
    difficulty: 3,
    state: "review" as const,
    interval: 45,
    dueDate: today,
    lastReviewDate: today,
    reps: 5,
    lapses: 0,
  };
  setCardState(MASTERED_ATOM_ID, {
    recognition: masteredSub,
    production: masteredSub,
  });
}

function buildFixtures(): { title: string; step: LessonStep }[] {
  return [
    {
      title: "build_sentence — 8 mixed tiles",
      step: {
        id: "qa-tiles-build-8",
        type: "build_sentence",
        prompt: "Build: 'I eat sushi and drink coffee at the shop.'",
        targetSentence: "みせで すしを たべて コーヒーを のむ",
        tiles: [
          "みせで",
          "すしを",
          "たべて",
          "コーヒーを",
          "のむ",
          "たくさん",
          "テレビ",
          "がっこうで",
        ],
        correctOrder: [
          "みせで",
          "すしを",
          "たべて",
          "コーヒーを",
          "のむ",
        ],
        granularity: "word",
        exercisedAtoms: ["ja-m7-1-v-taberu", MASTERED_ATOM_ID],
      },
    },
    {
      title: "build_sentence — 16 tiles (hugeBank)",
      step: {
        id: "qa-tiles-build-16",
        type: "build_sentence",
        prompt: "Build the long version",
        targetSentence:
          "きょう がっこうで たべて のむ たくさん テレビ コーヒー すし みせ わたし あなた かれ かのじょ",
        tiles: [
          "きょう",
          "がっこうで",
          "たべて",
          "のむ",
          "たくさん",
          "テレビ",
          "コーヒー",
          "すし",
          "みせ",
          "わたし",
          "あなた",
          "かれ",
          "かのじょ",
          "あさ",
          "よる",
          "いま",
        ],
        correctOrder: [
          "きょう",
          "がっこうで",
          "たべて",
          "のむ",
          "たくさん",
          "テレビ",
          "コーヒー",
          "すし",
          "みせ",
          "わたし",
          "あなた",
          "かれ",
          "かのじょ",
        ],
        granularity: "word",
      },
    },
    {
      title: "listening_build — 9 tiles",
      step: {
        id: "qa-tiles-listen-9",
        type: "listening_build",
        audioKey: "qa-tiles-listen-9",
        prompt: "Listen and build what you hear",
        targetSentence: "たべて のむ たくさん コーヒー すし みせ わたし いま きょう",
        tiles: [
          "たべて",
          "のむ",
          "たくさん",
          "コーヒー",
          "すし",
          "みせ",
          "わたし",
          "いま",
          "きょう",
        ],
        correctOrder: ["たべて", "のむ", "たくさん"],
        granularity: "word",
      },
    },
    {
      title: "match_pairs — 5 pairs (furigana + 2-line wrap)",
      step: {
        id: "qa-tiles-match-5",
        type: "match_pairs",
        prompt: "Match the word to its meaning",
        pairs: [
          { id: "m1", source: "たべる", target: "to eat" },
          { id: "m2", source: "のむ", target: "to drink" },
          { id: "m3", source: "たくさん", target: "many / a lot" },
          { id: "m4", source: "コーヒー", target: "coffee" },
          {
            id: "m5",
            source: "べんきょうする",
            target: "to study hard",
          },
        ],
      },
    },
    {
      title: "multiple_choice — 4 options (one kanji)",
      step: {
        id: "qa-tiles-mcq-4",
        type: "multiple_choice",
        prompt: "Which one means 'to eat'?",
        options: [
          { id: "a", text: "食べる" },
          { id: "b", text: "のむ" },
          { id: "c", text: "みる" },
          { id: "d", text: "いく" },
        ],
        correctOptionId: "a",
        explanation: "食べる (たべる) = to eat.",
      },
    },
    {
      title: "particle_cloze — 3 options",
      step: {
        id: "qa-tiles-cloze-3",
        type: "particle_cloze",
        prompt: { before: "わたし", after: "がっこうに いく" },
        correctParticle: "は",
        options: ["は", "を", "に"],
        meaningEn: "I go to school.",
      },
    },
  ];
}

/** Measures every direct tile-shaped element (buttons) under a fixture so
 *  uneven rows are visible as numbers, not just eyeballed. Buttons cover
 *  every fixture here: build bank tiles, listening_build bank tiles,
 *  match_pairs source/target tiles, and MCQ/particle_cloze options.
 *
 *  Excludes the fixture's own primary CTA ("Check" / "Continue",
 *  `[data-testid="primary-cta"]`) — it is also a `<button>` inside the same
 *  wrapper, and without this exclusion its ~50px height polluted BOTH the
 *  on-screen "heights: …" readout (a non-tile number sat in the list next to
 *  the real tile heights, tripping the "uneven" flag even when every tile
 *  agreed) and "Lock tile heights" (found while wiring the lock, TestFlight
 *  #137 — it was locking every tile to the CTA's height instead of the
 *  tallest TILE's). */
function useTileHeights(
  ref: React.RefObject<HTMLElement | null>,
  watch: unknown,
): number[] {
  const [heights, setHeights] = useState<number[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const nodes = Array.from(el.querySelectorAll("button")).filter(
        (n) => !n.closest('[data-testid="primary-cta"]'),
      ) as HTMLElement[];
      setHeights(
        nodes
          .filter((n) => n.offsetParent !== null)
          .map((n) => Math.round(n.getBoundingClientRect().height * 10) / 10),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);
  return heights;
}

function FixtureCard({
  title,
  step,
  onHeights,
  remeasureKey,
}: {
  title: string;
  step: LessonStep;
  /** Reports this fixture's measured tile heights on every change — used
   *  ONLY by the "8 mixed tiles" fixture, which is the "Lock tile heights"
   *  measurement source (TileSizingQaFramePage's `locked` effect below). */
  onHeights?: (heights: number[]) => void;
  /** Bump to force an immediate re-measure outside the normal resize/tick
   *  triggers — "Lock tile heights" turning ON is not itself a resize (the
   *  box hasn't changed yet; THIS measurement is what will change it), so
   *  without an explicit nudge here `useTileHeights`'s ResizeObserver would
   *  never fire again and the lock would sit at "measuring…" forever. */
  remeasureKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const heights = useTileHeights(ref, `${tick}:${remeasureKey ?? 0}`);
  // Re-measure after fonts/tokens settle (postMessage applies vars async).
  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 50);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    onHeights?.(heights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heights]);
  const uneven =
    heights.length > 1 && Math.max(...heights) - Math.min(...heights) > 0.5;
  return (
    // `mb-24`, not `mb-6`: `match_pairs`' shipped `maxHeight` formula caps
    // the grid ASSUMING ~1-line rows (Spencer's own constraint — this lane
    // does not touch match numbers). A deliberate 2-line-wrap stress
    // fixture legitimately overflows that cap with `overflow: visible`
    // (real production behavior, not a QA-page bug) — generous spacing
    // keeps that overflow from visually colliding with the next card's
    // heading instead of hiding it.
    <div className="mb-24 rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-japanese text-xs font-bold uppercase tracking-wide text-text-muted">
          {title}
        </span>
        <span
          className={`text-[11px] ${uneven ? "font-bold text-error" : "text-text-muted"}`}
        >
          heights: {heights.length ? heights.join(", ") : "—"}px
        </span>
      </div>
      {/* Some step views (match_pairs) assume a bounded flex ancestor —
          the real lesson shell they normally render inside. Give every
          fixture an explicit min-height + flex context so those views
          size correctly standalone instead of collapsing/overlapping the
          next fixture. match_pairs gets extra headroom: its shipped
          `maxHeight` formula assumes ~1-line rows (Spencer's own
          constraint — this lane does not touch match numbers), so a
          deliberate 2-line-wrap stress fixture overflows that cap with
          `overflow: visible` (real production behavior). The bigger
          reserve is a QA-page-only accommodation so that real overflow
          stays visible instead of colliding with the next card. */}
      <div
        ref={ref}
        data-qa-fixture={step.type}
        className={`flex flex-col ${step.type === "match_pairs" ? "min-h-[950px]" : "min-h-[420px]"}`}
      >
        <StepRenderer
          step={step}
          onComplete={() => {}}
          onContinue={() => {}}
        />
      </div>
    </div>
  );
}

/** The step id of the "Lock tile heights" measurement source — the 8-tile
 *  mixed fixture the brief specifies (kanji+reading, hidden-reading kanji,
 *  kana-only, katakana). Locking broadcasts this fixture's tallest tile as
 *  `--tile-box-h`, which every OTHER build fixture on the page also reads
 *  (same shared token), so "every tile in every build fixture snaps to one
 *  height" falls out of the existing token wiring rather than needing its
 *  own per-fixture logic. */
const LOCK_SOURCE_STEP_ID = "qa-tiles-build-8";

export default function TileSizingQaFramePage() {
  const [params] = useSearchParams();
  const view = params.get("view") === "desktop" ? "desktop" : "mobile";
  const fixtures = useMemo(buildFixtures, []);
  const rootRef = useRef<HTMLDivElement>(null);

  seedMasteredAtomOnce();

  // "Lock tile heights" (TestFlight #137): while locked, this frame measures
  // the 8-tile fixture itself and sets `--tile-box-h` directly — it does NOT
  // wait for a round-trip through the parent, so the lock feels live even on
  // a slow postMessage tick. `lockedRef` is read inside the `setVars`
  // handler below (a ref, not state, so that handler doesn't need to be
  // re-subscribed on every lock toggle).
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  lockedRef.current = locked;
  const lastLockedHeightRef = useRef<number | null>(null);
  // Bumped every time locking turns ON — see FixtureCard's `remeasureKey`
  // doc comment for why this is needed (locking is not itself a resize).
  const [remeasureNonce, setRemeasureNonce] = useState(0);

  const handleLockSourceHeights = useCallback((heights: number[]) => {
    if (!lockedRef.current) return;
    if (heights.length === 0) return;
    const max = Math.round(Math.max(...heights) * 10) / 10;
    if (max === lastLockedHeightRef.current) return;
    lastLockedHeightRef.current = max;
    document.documentElement.style.setProperty("--tile-box-h", `${max}px`);
    window.parent.postMessage(
      { source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.lockMeasured, view, height: max },
      "*",
    );
  }, [view]);

  // Live-apply CSS vars posted from the parent page. Every message carries
  // the FULL current var map for this pane (not a diff) so a late-attaching
  // listener (iframe reload) always converges to the right state.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.source !== TILE_QA_MESSAGE.source) return;
      if (data.type === TILE_QA_MESSAGE.setVars) {
        for (const [name, value] of Object.entries(
          data.vars as Record<string, string>,
        )) {
          // Belt-and-suspenders: the parent already omits --tile-box-h
          // while this pane is locked, but skip it here too so a stray
          // message (a reload race, a future caller) can never stomp the
          // live-measured value out from under the lock.
          if (locked && name === "--tile-box-h") continue;
          document.documentElement.style.setProperty(name, value);
        }
      } else if (data.type === TILE_QA_MESSAGE.clearVars) {
        for (const name of data.keys as string[]) {
          document.documentElement.style.removeProperty(name);
        }
      } else if (data.type === TILE_QA_MESSAGE.setLock) {
        const next = !!data.locked;
        setLocked(next);
        if (next) {
          // Force an immediate re-measure — the ResizeObserver has nothing
          // to fire on yet (the box hasn't changed size; this measurement
          // is what's about to change it).
          setRemeasureNonce((n) => n + 1);
        }
        if (!next) {
          // Unlocking: drop the self-measured value immediately. The
          // parent sends a fresh `setVars` right after toggling off, which
          // restores the slider's value a beat later — this just avoids a
          // visible flash of the stale locked height in between.
          lastLockedHeightRef.current = null;
          document.documentElement.style.removeProperty("--tile-box-h");
        }
      }
    }
    window.addEventListener("message", onMessage);
    // Tell the parent this frame is ready to receive vars — avoids the
    // race where the parent posts before this listener is attached.
    window.parent.postMessage(
      { source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.ready, view },
      "*",
    );
    return () => window.removeEventListener("message", onMessage);
  }, [view, locked]);

  // Report this document's full content height so the parent's desktop pane
  // can size its iframe to fit exactly and let the OUTER pane be the single
  // scroller ("Desktop page on the QA screen doesn't fit correctly... make
  // it scrollable", Spencer 2026-09-15). Mobile ignores this — its pane is
  // sized to the phone's physical footprint, not content.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const report = () => {
      window.parent.postMessage(
        {
          source: TILE_QA_MESSAGE.source,
          type: TILE_QA_MESSAGE.contentHeight,
          view,
          height: el.scrollHeight,
        },
        "*",
      );
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  return (
    <LessonModuleProvider moduleIndex={20}>
      {/* Bare stage — no AppShell chrome (Spencer 2026-09-15: "I just need
          the element for desktop not the whole page"). Both panes render
          frameless now, not just desktop: the app header was eating real
          vertical budget out of the mobile iframe's 932px that a real lesson
          never pays (lessons are a focused flow too — see
          `routes/focusedFlow.ts`), which made the mobile pane LESS accurate
          to a real device, not more. The route match lives in
          `FOCUSED_FLOW_PATTERN` (`routes/focusedFlow.ts`), keyed on the
          `/qa/tiles/frame` path — it strips header/sidebar/bottom-tab/ads
          for this route the same way it does for `/lessons/…`.
          `max-w-2xl` mirrors `LessonShell`'s own stage column (`SHELL_COLUMN`
          in `shared/layout/fittedShell.ts`) — the real lesson's tile rows
          never see more than that measure even on a wide desktop window, so
          without this cap the desktop pane's fixtures wrapped tiles onto
          fewer/wider rows than a real lesson does at the same viewport. */}
      <div ref={rootRef} className="min-h-screen bg-background p-3 pb-24">
        <div className="mx-auto max-w-2xl">
          {fixtures.map((f) => (
            <FixtureCard
              key={f.step.id}
              title={f.title}
              step={f.step}
              onHeights={f.step.id === LOCK_SOURCE_STEP_ID ? handleLockSourceHeights : undefined}
              remeasureKey={f.step.id === LOCK_SOURCE_STEP_ID ? remeasureNonce : undefined}
            />
          ))}
        </div>
      </div>
    </LessonModuleProvider>
  );
}
