/**
 * `dialogue_sim` — simulation-dialogue renderer. PROTOTYPE (2026-07-29),
 * not wired into any live course lesson; drive it from
 * `/ja/qa/dialogue-sim` or the lesson-step previewer.
 *
 * Spencer's ask: "a simulation style dialogue walking you through certain
 * interactions… a playful 'shopfront emoji' — 'worker says: do you need a
 * bag?'… good to not dumb it down too much. we can even just improve upon
 * the ui/ux for the dialogue lessons."
 *
 * The learner IS the second speaker. One step = one scenario; the NPC speaks
 * a turn, the learner produces or picks the reply, the exchange accumulates
 * as a chat transcript, and the scenario ends when the last turn commits.
 * See `types.ts` (DialogueSimStep) for the turn-model rationale and
 * `dialogueSim/simTurnLogic.ts` for the max-acceptance grading.
 *
 * WHAT IT IMPROVES ON `dialogue_listen` (the other half of Spencer's ask):
 *  - The transcript GROWS with the conversation instead of showing every
 *    line up front behind a blur; future turns don't exist yet, which is
 *    what makes it feel like an interaction rather than a reading exercise.
 *  - The learner's own words enter the transcript as their bubble, carrying
 *    the verdict — the outcome of a conversational turn belongs in the
 *    conversation, not only in a banner below it.
 *  - Scene framing (storefront emoji + scene name + English setting) gives
 *    the exchange a place, which is most of the "playful" ask.
 *  - Listen-first masking is per-TURN and always escapable, so the audio-only
 *    mode can't strand a learner on a line with no clip.
 *
 * LAYOUT (CLAUDE.md lesson UI stability rules — non-negotiable):
 *  - The step container is `flex flex-1 flex-col min-h-0`. The TRANSCRIPT is
 *    the only scroll area (`flex-1 min-h-0 overflow-y-auto`); the scene
 *    header, reply zone and CTA are `shrink-0`. No dvh arithmetic anywhere.
 *  - The verdict banner renders INSIDE the transcript's scroll area, at the
 *    end of the conversation. That is deliberate: a banner between the
 *    options and the CTA would push both on submit. Here the reply zone and
 *    CTA cannot move on commit, because nothing that changes size on commit
 *    lives above them — the scroll area absorbs it all.
 *  - The build tray is pre-sized by an invisible ghost of the full answer,
 *    and used bank tiles keep their footprint (`invisible`, not removed), so
 *    the bank never reflows as tiles are placed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DialogueSimStep, DialogueSimTurn } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { ExplainButton } from "../ExplainButton";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl } from "@/shared/tts";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { seededShuffle } from "@/shared/utils/seededShuffle";
// Voice routing + per-sentence playback are ALREADY solved for dialogue
// (inv 23: one roster, real Keita/Nanami voices, zero pitch processing).
// Reuse them rather than growing a second copy that can drift.
import {
  langForSpeaker,
  playLineAudio,
  splitJaSentences,
} from "./DialogueListenStepView";
import {
  isBuildReplyAccepted,
  isChoiceReplyAccepted,
  modelReplyAudioText,
  modelReplyText,
  npcLineRevealed,
  scenarioCorrect,
} from "./dialogueSim/simTurnLogic";

/**
 * Is there a clip for this line? Must answer the question the SAME WAY
 * `playLineAudio` does, or the two disagree: a two-sentence line
 * (「はい。ありがとうございます。」) has no whole-line manifest key but plays
 * fine as a per-sentence chain, and a naive whole-line `getTtsUrl` check
 * would disable a play button that works. Drives both the play button's
 * disabled state and the listen-first mask's no-audio escape, so getting it
 * wrong silently strands the learner. Exported for unit testing.
 */
export function npcLineHasAudio(text: string, preferredLang?: string): boolean {
  const sentences = splitJaSentences(text);
  for (const lang of preferredLang ? [preferredLang, undefined] : [undefined]) {
    if (getTtsUrl(text, lang)) return true;
    if (sentences.length > 1 && sentences.every((s) => getTtsUrl(s, lang))) {
      return true;
    }
  }
  return false;
}

type Props = {
  step: DialogueSimStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function DialogueSimStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const silentMode = useSettings().settings.audio.silentMode;
  const reducedMotion = useReducedMotion();
  // Per-language voice routing (dialogueVoices capability) — same seam as
  // DialogueListenStepView.
  const languageId = useLanguage().language?.id;
  const moduleIndex = useLessonModuleIndex();

  const turns = step.turns;
  const [turnIdx, setTurnIdx] = useState(0);
  const [committed, setCommitted] = useState<Record<string, boolean>>({});
  const [verdicts, setVerdicts] = useState<Record<string, boolean>>({});
  /** Placed BANK INDICES per turn (indices, so duplicate tiles behave). */
  const [placedByTurn, setPlacedByTurn] = useState<Record<string, number[]>>({});
  const [choiceByTurn, setChoiceByTurn] = useState<Record<string, string>>({});
  const [playedNpc, setPlayedNpc] = useState<Set<number>>(() => new Set());
  const [shownNpc, setShownNpc] = useState<Set<number>>(() => new Set());
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const completedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Invalidates in-flight playback when the turn changes or replay retaps. */
  const playTokenRef = useRef(0);

  const turn = turns[turnIdx] as DialogueSimTurn | undefined;
  const isLastTurn = turnIdx === turns.length - 1;
  const turnCommitted = turn ? !!committed[turn.id] : false;
  const allCommitted = turns.length > 0 && turns.every((tn) => committed[tn.id]);

  // Bank order is seeded on step id + turn id: stable across re-renders and
  // Reset-free previews, but not answer-first (same rule as the build views).
  const bank = useMemo(() => {
    if (!turn || turn.reply.mode !== "build") return [] as string[];
    return seededShuffle(turn.reply.tiles, `${step.id}-${turn.id}`);
  }, [step.id, turn]);

  // Choice options get the same seeded reorder as the tile bank: the
  // hand-authored es/fr sims write the correct reply first for
  // readability, and rendering authored order would make slot 1 a tell.
  const choiceOptions = useMemo(() => {
    if (!turn || turn.reply.mode !== "choice") {
      return [] as { id: string; text: string }[];
    }
    return seededShuffle(turn.reply.options, `${step.id}-${turn.id}`);
  }, [step.id, turn]);

  const npcAudioAvailable = useMemo(
    () =>
      turns.map((tn) =>
        npcLineHasAudio(
          tn.npc.audioText ?? tn.npc.kana,
          langForSpeaker(tn.npc.speaker, languageId),
        ),
      ),
    [turns, languageId],
  );

  const playNpcLine = useCallback(
    (idx: number) => {
      const tn = turns[idx];
      if (!tn) return;
      const token = ++playTokenRef.current;
      setActiveLine(idx);
      void playLineAudio(
        tn.npc.audioText ?? tn.npc.kana,
        langForSpeaker(tn.npc.speaker, languageId),
        () => playTokenRef.current === token,
      ).then(() => {
        if (playTokenRef.current !== token) return;
        // The clip finished — this is what lifts the listen-first mask.
        setPlayedNpc((prev) =>
          prev.has(idx) ? prev : new Set(prev).add(idx),
        );
        setActiveLine((cur) => (cur === idx ? null : cur));
      });
    },
    [turns],
  );

  // Auto-play the NPC line when a turn opens. Honors silentMode (auto = off,
  // on-demand = on — the shared silent-mode contract), and cancels in flight
  // when the turn changes so two speakers never overlap.
  useEffect(() => {
    if (silentMode) return;
    const handle = setTimeout(() => playNpcLine(turnIdx), 300);
    return () => {
      clearTimeout(handle);
      playTokenRef.current += 1;
      setActiveLine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, turnIdx, silentMode]);

  // Keep the newest turn (and the verdict banner) in view as the transcript
  // grows past the scroll area.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [turnIdx, committed, reducedMotion]);

  const placed = turn ? (placedByTurn[turn.id] ?? []) : [];
  const chosen = turn ? choiceByTurn[turn.id] : undefined;

  const hasAnswer =
    turn?.reply.mode === "build" ? placed.length > 0 : chosen !== undefined;

  const turnCorrect = turn
    ? turn.reply.mode === "build"
      ? isBuildReplyAccepted(
          placed.map((i) => bank[i]),
          turn.reply,
          moduleIndex,
        )
      : isChoiceReplyAccepted(chosen, turn.reply)
    : false;

  /** What the learner actually said this turn — their transcript bubble. */
  const learnerSurface = useCallback(
    (tn: DialogueSimTurn): string => {
      if (tn.reply.mode === "build") {
        const idxs = placedByTurn[tn.id] ?? [];
        const tiles =
          tn.id === turn?.id
            ? bank
            : seededShuffle(tn.reply.tiles, `${step.id}-${tn.id}`);
        return idxs.map((i) => tiles[i]).join(" ");
      }
      const id = choiceByTurn[tn.id];
      return tn.reply.options.find((o) => o.id === id)?.text ?? "";
    },
    [placedByTurn, choiceByTurn, bank, turn?.id, step.id],
  );

  function commitTurn() {
    if (!turn || turnCommitted || !hasAnswer) return;
    setCommitted((prev) => ({ ...prev, [turn.id]: true }));
    setVerdicts((prev) => ({ ...prev, [turn.id]: turnCorrect }));
    // Hearing the model reply right after committing is the whole point of a
    // listen-and-respond drill — say it, then hear it said properly.
    if (!silentMode) {
      const token = ++playTokenRef.current;
      void playLineAudio(
        modelReplyAudioText(turn),
        undefined,
        () => playTokenRef.current === token,
      );
    }
    // One scenario = one result. Report overall correctness after the LAST
    // turn commits; the done-guard survives a remount mid-scenario.
    if (isLastTurn && !completedRef.current) {
      completedRef.current = true;
      const finalVerdicts = { ...verdicts, [turn.id]: turnCorrect };
      onComplete(step.id, scenarioCorrect(turns, finalVerdicts));
    }
  }

  function advanceTurn() {
    if (!isLastTurn) setTurnIdx((i) => i + 1);
  }

  const handleEnter = useCallback(() => {
    if (!turnCommitted) commitTurn();
    else if (!allCommitted) advanceTurn();
    else onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnCommitted, allCommitted, hasAnswer, turnCorrect, turnIdx]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!turn || turnCommitted) return;
      if (turn.reply.mode === "choice" && n <= choiceOptions.length) {
        const optId = choiceOptions[n - 1].id;
        setChoiceByTurn((prev) => ({ ...prev, [turn.id]: optId }));
      } else if (turn.reply.mode === "build" && n <= bank.length) {
        addTile(n - 1);
      }
    },
  });

  function addTile(i: number) {
    if (!turn || turnCommitted) return;
    setPlacedByTurn((prev) => {
      const cur = prev[turn.id] ?? [];
      if (cur.includes(i)) return prev;
      return { ...prev, [turn.id]: [...cur, i] };
    });
  }

  function removeTile(pos: number) {
    if (!turn || turnCommitted) return;
    setPlacedByTurn((prev) => {
      const cur = prev[turn.id] ?? [];
      return { ...prev, [turn.id]: cur.filter((_, idx) => idx !== pos) };
    });
  }

  const anyWrong = turns.some((tn) => committed[tn.id] && !verdicts[tn.id]);

  if (!turn) return null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={anyWrong}
      />

      {/* ── Scene header — playful framing, not childish: the emoji is the
           set dressing, the scene name and English setting are the brief. ── */}
      <div className="flex shrink-0 items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface-muted/50 px-4 py-2.5">
        <span aria-hidden className="text-3xl leading-none">
          {step.scene.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-bold text-text-primary">
            {step.scene.title}
          </p>
          {step.scene.setting && (
            <p className="m-0 text-xs text-text-secondary">
              {step.scene.setting}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-muted"
          data-testid="sim-turn-progress"
        >
          {t("lesson.dialogueSim.turnProgress", "Turn {{n}} of {{total}}", {
            n: turnIdx + 1,
            total: turns.length,
          })}
        </span>
      </div>

      {/* ── Transcript (the ONLY scroll area) ──────────────────────────────
           Turns appear as they happen; nothing after the current turn is
           rendered at all. The verdict banner lives at the end of this list
           so committing can never move the options or the CTA. ── */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {turns.slice(0, turnIdx + 1).map((tn, i) => {
          const revealed = npcLineRevealed({
            listenFirst: !!step.listenFirst,
            hasAudio: npcAudioAvailable[i],
            played: playedNpc.has(i),
            manuallyShown: shownNpc.has(i),
            committed: !!committed[tn.id],
          });
          const isActive = activeLine === i;
          const said = committed[tn.id] ? learnerSurface(tn) : "";
          const wasRight = !!verdicts[tn.id];
          return (
            <div key={tn.id} className="flex flex-col gap-2">
              {/* NPC bubble — left, speaker chip + replay. */}
              <div
                data-testid={`npc-bubble-${i}`}
                className={`flex max-w-[92%] items-start gap-3 self-start rounded-2xl rounded-bl-sm border px-3 py-2 transition-colors duration-200 ${
                  isActive
                    ? "border-accent bg-accent-muted"
                    : "border-border/70 bg-surface"
                }`}
              >
                <button
                  type="button"
                  onClick={() => playNpcLine(i)}
                  disabled={!npcAudioAvailable[i]}
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("lesson.play", "Play audio")}
                >
                  <Icon name="volume" size={14} />
                </button>
                <div className="min-w-0">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <AnnotatedJa text={tn.npc.speaker} />
                  </p>
                  {revealed ? (
                    <>
                      <p className="m-0 font-japanese text-base font-medium text-text-primary">
                        <AnnotatedJa text={tn.npc.kana} />
                      </p>
                      <p className="m-0 text-xs text-text-secondary">
                        {tn.npc.gloss}
                      </p>
                    </>
                  ) : (
                    /* Listen-first mask. Never a dead end: the escape is one
                       tap, and a line with no clip is never masked at all
                       (see npcLineRevealed). */
                    <button
                      type="button"
                      onClick={() =>
                        setShownNpc((prev) => new Set(prev).add(i))
                      }
                      className="mt-0.5 rounded-lg border border-dashed border-border px-2 py-1 text-xs font-semibold text-text-muted hover:border-accent hover:text-accent"
                    >
                      {t("lesson.dialogueSim.showText", "🔊 Listen · show text")}
                    </button>
                  )}
                </div>
              </div>

              {/* Learner bubble — right, carries the verdict. */}
              {committed[tn.id] && (
                <div
                  data-testid={`learner-bubble-${i}`}
                  className={`max-w-[92%] self-end rounded-2xl rounded-br-sm border-[1.5px] px-3 py-2 text-right ${
                    wasRight
                      ? "border-success bg-success/10"
                      : "border-error bg-error/10"
                  }`}
                >
                  <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    {t("lesson.dialogueSim.you", "You")}
                  </p>
                  <p className="m-0 font-japanese text-base font-medium text-text-primary">
                    <AnnotatedJa text={said} />
                  </p>
                  {!wasRight && (
                    <p className="m-0 font-japanese text-sm font-semibold text-text-secondary">
                      →{" "}
                      <AnnotatedJa text={modelReplyText(tn)} />
                    </p>
                  )}
                  {tn.replyGloss && (
                    <p className="m-0 text-xs text-text-secondary">
                      {tn.replyGloss}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {turnCommitted && (
          <Feedback
            correct={turnCorrect}
            explanation={turn.explanation}
            correctAnswer={
              !turnCorrect ? (
                <span lang="ja">{modelReplyText(turn)}</span>
              ) : undefined
            }
          />
        )}
      </div>

      {/* ── Reply zone (shrink-0, never moves on submit) ─────────────────── */}
      <div className="shrink-0">
        <p className="m-0 mb-2 text-sm font-semibold text-text-primary">
          {turn.goal}
        </p>

        {turn.reply.mode === "build" ? (
          <div className="flex flex-col gap-2">
            {/* Tray: an invisible ghost of the full model answer fixes the
                height, so placing tiles never reflows anything below. */}
            <div className="relative mx-auto w-full">
              <div
                aria-hidden
                className="flex flex-wrap justify-center gap-2 opacity-0"
              >
                <span className="rounded-xl border-2 px-3 py-2 text-lg font-bold">
                  {modelReplyText(turn)}
                </span>
              </div>
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2">
                {placed.map((bi, pos) => (
                  <button
                    key={`placed-${pos}-${bi}`}
                    type="button"
                    data-placed-tile={bank[bi]}
                    disabled={turnCommitted}
                    onClick={() => removeTile(pos)}
                    className={`rounded-xl border-2 px-3 py-2 font-japanese text-lg font-bold transition-colors duration-150 ${
                      turnCommitted
                        ? turnCorrect
                          ? "border-success bg-success/10 text-text-primary"
                          : "border-error bg-error/10 text-text-primary"
                        : "border-accent bg-accent-muted text-text-primary"
                    }`}
                  >
                    <AnnotatedJa text={bank[bi]} />
                  </button>
                ))}
              </div>
            </div>
            {/* Bank: used tiles keep their slot (invisible, not removed). */}
            <div className="flex flex-wrap justify-center gap-2">
              {bank.map((tile, i) => (
                <button
                  key={`bank-${i}`}
                  type="button"
                  // Kana identity for QA drivers/Playwright: the accessible
                  // name carries interleaved romaji ruby, so text locators
                  // can't address a tile.
                  data-tile={tile}
                  disabled={turnCommitted || placed.includes(i)}
                  // A used slot is a geometry placeholder, not a control:
                  // hide it from assistive tech (and from tests) rather than
                  // announcing an invisible duplicate of the placed tile.
                  aria-hidden={placed.includes(i) || undefined}
                  onClick={() => addTile(i)}
                  className={`rounded-xl border-2 border-border bg-surface px-3 py-2 font-japanese text-lg font-bold text-text-primary transition-colors duration-150 hover:border-accent ${
                    placed.includes(i) ? "invisible" : ""
                  }`}
                >
                  <AnnotatedJa text={tile} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {/* Alias the narrowed reply: TS drops property-access narrowing
                inside a callback, and `choiceReply` keeps it. */}
            {((choiceReply) =>
              choiceOptions.map((opt) => {
              const isSelected = chosen === opt.id;
              const isAccepted = isChoiceReplyAccepted(opt.id, choiceReply);
              let style =
                "border-border bg-surface text-text-primary hover:border-accent";
              if (turnCommitted && isAccepted) {
                style = "border-success bg-success/15 text-text-primary";
              } else if (turnCommitted && isSelected) {
                style = "border-error bg-error/10 text-error";
              } else if (isSelected) {
                style = "border-accent bg-accent-muted text-accent";
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={turnCommitted}
                  onClick={() =>
                    setChoiceByTurn((prev) => ({ ...prev, [turn.id]: opt.id }))
                  }
                  className={`rounded-xl border-[1.5px] px-4 py-2.5 text-left font-japanese text-base font-medium transition-colors duration-150 ${style}`}
                >
                  <AnnotatedJa text={opt.text} />
                </button>
              );
              }))(turn.reply)}
          </div>
        )}
      </div>

      {/* ── CTA (shrink-0, pinned to the bottom of the fixed shell) ─────── */}
      <div className="shrink-0">
        {!turnCommitted ? (
          <ContinueButton
            onClick={commitTurn}
            label={t("lesson.check", "Check")}
            disabled={!hasAnswer}
          />
        ) : !allCommitted ? (
          <ContinueButton
            onClick={advanceTurn}
            label={t("lesson.dialogueSim.nextTurn", "Next")}
            variant={turnCorrect ? "correct" : "incorrect"}
          />
        ) : (
          <ContinueButton
            onClick={onContinue}
            variant={
              scenarioCorrect(turns, verdicts) ? "correct" : "incorrect"
            }
          />
        )}
      </div>
    </div>
  );
}
