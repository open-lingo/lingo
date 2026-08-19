import { useEffect, useMemo, useState } from "react";
import type { GrammarRuleStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { playSfx } from "@/shared/audio/sfx";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import { TransformRuleTable } from "./TransformRuleTable";
import { TransferScene } from "./TransferScene";
import { HIRAGANA_ROMAJI_OFF_MODULE } from "@/shared/settings/romanizationAutoFlip";

/**
 * Rule-card example romaji follows the same ladder as every other romaji
 * surface: gone once the lesson's module is ≥ the hiragana cutoff. Was
 * rendered unconditionally — m29/m30 rule cards printed "nani shiteru no?"
 * under the kana (Gate 10 finding, 2026-07-17). Outside a lesson
 * (moduleIndex null: previews, practice decks) romaji stays, matching
 * AnnotatedText's no-provider behavior.
 */
function useShowExampleRomaji(): boolean {
  const moduleIndex = useLessonModuleIndex();
  return moduleIndex == null || moduleIndex < HIRAGANA_ROMAJI_OFF_MODULE;
}

/**
 * Structured rule body (Spencer 2026-07-23: "stating the rule like that
 * doesn't look great — list them out so there is better vertical
 * separation"). Splits the authored prose into sentences, one line each
 * with breathing room, and bolds inline transformations (のむ→のまない,
 * む→ま) so the derivations pop out of the text instead of drowning in it.
 * Pure formatting — the authored `rule` string is untouched.
 */
const JA_TRANSFORM = /([ぁ-んァ-ヶー]+→[ぁ-んァ-ヶー]+)/g;

function RuleBody({ rule, className }: { rule: string; className: string }) {
  // Sentence split — ONLY where the next fragment starts a Latin sentence
  // (capital or quote). Splitting at every 。 shattered mixed EN/JA prose
  // into orphan bullets ("'over there.' / ねこは いない。" — Fable sweep
  // 2026-07-24): a JA example's 。 mid-sentence is not a bullet boundary.
  const sentences = rule
    .split(/(?<=[.。])\s+(?=[A-Z"'“‘])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <ul className={`mt-4 space-y-2.5 ${className}`}>
      {sentences.map((sentence, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-text-muted" />
          <span>
            {/* split-with-capture puts matched transforms at odd indices —
                never test() a /g/ regex per-part (stateful lastIndex). */}
            {sentence.split(JA_TRANSFORM).map((part, j) =>
              j % 2 === 1 ? (
                <b key={j} className="whitespace-nowrap rounded-md bg-surface-raised px-1.5 py-0.5 font-japanese font-bold text-text-primary">
                  {part}
                </b>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  step: GrammarRuleStep;
  onContinue: () => void;
  /**
   * `full` (default) = the lesson hero treatment. `compact` = the grammar
   * deck's one-time refresher preface: small pane, title + rule + first
   * example only — a full hero card before a single drill question reads
   * as long-winded (Spencer, 2026-07-06).
   */
  variant?: "full" | "compact";
};

// ---------------------------------------------------------------------------
// Read gate — QA critique (Spencer, 2026-07-11): nothing stopped a learner
// from clicking Continue before reading the card at all. Lock the Continue
// affordance for a duration scaled to how much there is to read, so the
// card is "forced to [read or] listen" without turning into a hard wall on
// the longer cards.
// ---------------------------------------------------------------------------

const READ_GATE_WPM = 238;
const READ_GATE_MIN_MS = 1500;
/** Owner's stated hard ceiling (QA 2026-07-11): "5 second timer max". */
const READ_GATE_MAX_MS = 5000;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Title + rule word count at a 238wpm reading pace, clamped to
 * [1.5s, 5s]. Examples, the anti-pattern tile, and the culture note are
 * deliberately excluded from the estimate — they're supplementary (their
 * own play button / a tap-to-expand chip), not the mandatory-read core the
 * gate protects. In practice most of the ~93 curriculum rule cards run
 * 40-90 words of rule text alone, well past the 5s-equivalent (~20 words),
 * so the ceiling — not the formula — is what most cards actually hit.
 */
function readGateDurationMs(step: GrammarRuleStep): number {
  const words = countWords(step.title) + countWords(step.rule);
  const estimateMs = (words / READ_GATE_WPM) * 60_000;
  return Math.min(READ_GATE_MAX_MS, Math.max(READ_GATE_MIN_MS, estimateMs));
}

/**
 * Honors reduced motion twice over, same as `Confetti`/`LessonComplete`:
 * the OS-level `prefers-reduced-motion: reduce` query AND the in-app
 * setting (`root.dataset.reducedMotion`, set by SettingsContext).
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Locks Continue for `readGateDurationMs(step)` after the card appears.
 *
 * Re-armed on `step.id` (not just on mount) so two grammar_rule cards in a
 * row — anywhere they don't get a fresh component instance, e.g. a
 * `key`-less dev preview — each get their own lock instead of inheriting a
 * stale one. Because the effect's cleanup always clears the pending timer
 * before a new one is set, this is StrictMode-double-mount safe: mount →
 * cleanup → remount clears timer #1 before timer #2 is scheduled, so
 * exactly one gate timer is ever pending. Same idiom as `ExplainButton`'s
 * dwell timer.
 */
function useReadGate(step: GrammarRuleStep) {
  const durationMs = useMemo(() => readGateDurationMs(step), [step]);
  const [ready, setReady] = useState(false);
  const [fillStarted, setFillStarted] = useState(false);

  useEffect(() => {
    setReady(false);
    setFillStarted(false);
    const timer = setTimeout(() => setReady(true), durationMs);
    // Flips on the next paint so the browser commits the 0%-width frame
    // before the CSS transition to 100% starts (otherwise the fill can
    // render already-full instead of animating).
    const raf = requestAnimationFrame(() => setFillStarted(true));
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [step.id, durationMs]);

  return { ready, fillStarted, durationMs };
}

/** Subtle fill bar above Continue while the read gate is locked. Purely
 *  decorative (aria-hidden — the button's own label + disabled state is
 *  the a11y-relevant signal), and skipped entirely under reduced motion
 *  rather than jumping straight to a static partial fill. */
function ReadGateBar({
  ready,
  fillStarted,
  durationMs,
}: {
  ready: boolean;
  fillStarted: boolean;
  durationMs: number;
}) {
  if (ready || prefersReducedMotion()) return null;
  return (
    <div
      aria-hidden
      className="mb-2 h-1 w-full overflow-hidden rounded-full bg-info/20"
    >
      <div
        className="h-full rounded-full bg-info"
        style={{
          width: fillStarted ? "100%" : "0%",
          transitionProperty: "width",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: "linear",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TTS read-aloud — feasibility note (2026-07-11 QA task):
//
// The app's real TTS (`shared/tts`) resolves `"<lang>:<text>"` against a
// manifest of pre-generated JA clips (`src/shared/tts/manifests/<lang>.json`). Grammar
// card `title`/`rule` text is English prose written for the card, not a
// curriculum JA phrase, so it will essentially never have a manifest
// entry — `getTtsUrl` would just return null. That pipeline isn't usable
// for this feature.
//
// `window.speechSynthesis` is the only remaining option and is NOT used
// anywhere else in the app today (a comment in `languages/ko/module.ts`
// claims a "browser speechSynthesis fallback" for KO audio — it doesn't
// exist; that comment is stale/inaccurate). Voice quality/availability is
// inherently platform-dependent, but for a short, user-triggered,
// English-prose read-aloud button, "some robotic-but-intelligible voice on
// most platforms, silently absent on the rest" is an acceptable bar — this
// is a convenience affordance, not the graded content. Kept entirely local
// to this file (capability-detected, self-contained state, cancels on
// unmount) rather than folded into `shared/tts`, which another workshop is
// actively reworking (stop/cancel behavior) — no call into or edit of that
// module for this feature.
// ---------------------------------------------------------------------------

function useSpeechReadAloud(text: string) {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);

  // Stop mid-read speech on unmount (step change / navigating away) so a
  // card doesn't keep talking into the next step.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  function toggle() {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Defensive: clears any stray queued utterance before starting a new
    // one. This component only ever queues one at a time, but cancel-then-
    // speak is cheap insurance against a stuck prior utterance.
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return { supported, speaking, toggle };
}

/** Small speaker button — reads `text` aloud via browser speechSynthesis.
 *  Renders nothing when the capability isn't there (no dead button). */
function ReadAloudButton({ text }: { text: string }) {
  const { supported, speaking, toggle } = useSpeechReadAloud(text);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? "Stop reading aloud" : "Read this card aloud"}
      title={speaking ? "Stop reading aloud" : "Read aloud"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-info/40 bg-surface text-info transition-colors hover:bg-info/10"
    >
      <Icon name={speaking ? "pause" : "volume"} size={14} />
    </button>
  );
}

/**
 * Grammar Rule Card — Tae Kim-style explicit teaching.
 *
 * Layout: hero rule pane (gradient, large rule text) → 2 example tiles
 * (kana with romaji ruby, English meaning, play button) → optional
 * anti-pattern in a contrasting red-tinted tile with a "why" line →
 * optional culture note → Continue.
 *
 * NOT a quiz. Exposure card. The drill follows in the next step (usually
 * `particle_cloze` or `multiple_choice`).
 */
export function GrammarRuleStepView({
  step,
  onContinue,
  variant = "full",
}: Props) {
  const showRomaji = useShowExampleRomaji();
  const { ready, fillStarted, durationMs } = useReadGate(step);
  const readAloudText = `${step.title}. ${step.rule}`;

  useLessonKeyboard({
    onEnter: () => {
      playSfx("passive-advance");
      onContinue();
    },
    // Enter must respect the same lock as the click affordance — otherwise
    // the gate is a purely visual speed bump for keyboard users.
    enabled: ready,
  });

  if (variant === "compact") {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
          Grammar refresher
        </p>

        <div className="rounded-2xl border-2 border-info/40 bg-gradient-to-br from-info/15 via-info/10 to-accent/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <Icon name="fileText" size={24} aria-hidden className="shrink-0 text-info" />
            <h2 className="flex-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              {step.title}
            </h2>
            <ReadAloudButton text={readAloudText} />
          </div>
          {/* A DIRECTION is a picture, so the picture LEADS and the prose is
              its caption. Rendered in the compact variant because compact is
              what lessons actually show (StepRenderer passes
              variant="compact"); putting it only in "full" would mean the
              learner never sees it. `scopeId` keeps the scene's @keyframes
              from colliding with another card's on the same page. */}
          {step.transferDiagram ? (
            <div className="mt-3">
              <TransferScene
                spec={step.transferDiagram}
                scopeId={String(step.id)}
              />
            </div>
          ) : null}
          <RuleBody rule={step.rule} className="text-base leading-relaxed text-text-secondary" />
        </div>
        {step.conjugationForm ? (
          <TransformRuleTable form={step.conjugationForm} />
        ) : null}

        {/* The diagram already shows the canonical sentence for every verb it
            draws, with the particles called out — an example tile under it
            repeats the card's own picture in words. */}
        {step.examples[0] && !step.transferDiagram ? (
          <ExampleTile example={step.examples[0]} />
        ) : null}

        {/* Workshop A (2026-07-12): culture is discoverable flavor, never
            required reading — a tap-to-expand chip, one disclosure level. */}
        {step.cultureNote ? <CultureChip note={step.cultureNote} /> : null}

        {/* ⚠️ Deliberately does NOT carry the sticky-CTA hook (the primary-cta
          testid). That hook floats the CTA to the bottom edge of the stage
          (index.css § "Lesson action bar"), which would let a learner continue
          without scrolling through the card — and would drag the `ReadGateBar`
          down with it. The read gate IS the point of this step.
          `stickyCta.test.ts` records the exemption; don't "fix" this. */}
      <div className="mt-auto pt-6">
          <ReadGateBar ready={ready} fillStarted={fillStarted} durationMs={durationMs} />
          <ContinueButton
            onClick={() => {
              playSfx("passive-advance");
              onContinue();
            }}
            disabled={!ready}
            label={ready ? "Got it" : "Reading…"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">
        Grammar
      </p>

      <div className="relative overflow-hidden rounded-3xl border-2 border-info/40 bg-gradient-to-br from-info/15 via-info/10 to-accent/10 px-7 py-9 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3">
          <Icon name="fileText" size={48} aria-hidden className="text-info" />
          <ReadAloudButton text={readAloudText} />
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {step.title}
        </h2>
        <RuleBody rule={step.rule} className="text-lg leading-relaxed text-text-secondary sm:text-xl" />
      </div>

      {/* Conjugation rule cards get the ending → result grid — the
          transformations as chips, one row per class, canonical examples
          pinned — instead of leaving derivations prose-only. */}
      {step.conjugationForm ? (
        <TransformRuleTable form={step.conjugationForm} />
      ) : null}

      <div className="flex flex-col gap-3">
        {step.examples.map((ex, i) => (
          <ExampleTile key={i} example={ex} />
        ))}
      </div>

      {step.antiPattern ? (
        <div className="rounded-2xl border-2 border-error/40 bg-error/10 px-5 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-error">
            Don't do this
          </p>
          <p className="font-japanese text-lg text-text-primary line-through decoration-error/60 decoration-2">
            <AnnotatedJa text={step.antiPattern.ja} />
          </p>
          {showRomaji && (
            <p className="mt-1 text-sm italic text-text-muted" lang="ja-Latn">
              {step.antiPattern.romaji}
            </p>
          )}
          <p className="mt-1 text-sm text-text-secondary">
            {step.antiPattern.en}
          </p>
          <p className="mt-2 text-sm font-medium text-error">
            ← {step.antiPattern.why}
          </p>
        </div>
      ) : null}

      {step.cultureNote ? (
        <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-text-secondary">
          {step.cultureNote}
        </p>
      ) : null}

      {/* ⚠️ Deliberately does NOT carry the sticky-CTA hook (the primary-cta
          testid). That hook floats the CTA to the bottom edge of the stage
          (index.css § "Lesson action bar"), which would let a learner continue
          without scrolling through the card — and would drag the `ReadGateBar`
          down with it. The read gate IS the point of this step.
          `stickyCta.test.ts` records the exemption; don't "fix" this. */}
      <div className="mt-auto pt-6">
        <ReadGateBar ready={ready} fillStarted={fillStarted} durationMs={durationMs} />
        <ContinueButton
          onClick={() => {
            // Passive — non-progress chirp + light haptic. See sfx.ts.
            playSfx("passive-advance");
            onContinue();
          }}
          disabled={!ready}
          label={ready ? "Got it" : "Reading…"}
        />
      </div>
    </div>
  );
}

function ExampleTile({ example }: { example: { ja: string; romaji: string; en: string } }) {
  const hasAudio = getTtsUrl(example.ja) !== null;
  const showRomaji = useShowExampleRomaji();

  function handlePlay() {
    if (!hasAudio) return;
    playJaAudio(example.ja);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-border bg-surface px-5 py-4">
      <div className="flex-1">
        <p className="font-japanese text-xl text-text-primary">
          <AnnotatedJa text={example.ja} />
        </p>
        {showRomaji && (
          <p className="mt-1 text-sm italic text-text-muted" lang="ja-Latn">
            {example.romaji}
          </p>
        )}
        <p className="mt-1 text-sm text-text-secondary">{example.en}</p>
      </div>
      <button
        type="button"
        onClick={handlePlay}
        disabled={!hasAudio}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Play example"
      >
        <Icon name="play" size={14} />
      </button>
    </div>
  );
}

function CultureChip({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-muted transition hover:bg-surface-muted"
      >
        <span aria-hidden>🌸</span>
        Culture note
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <p className="mt-2 rounded-xl border border-border/60 bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
          {note}
        </p>
      ) : null}
    </div>
  );
}
