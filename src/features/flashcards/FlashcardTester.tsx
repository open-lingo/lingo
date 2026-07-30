import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import { useAutoPlayJaAudio } from "@/shared/tts";
import { usePrefetchAudio } from "@/shared/tts/prefetch";
import {
  reviewCard,
  setCardState,
  getEffectiveState,
  getSRSStore,
  shouldRepeatInSession,
  getDueModalities,
  countRemainingNewCards,
  countRemainingDueCards,
  dueModalityBreakdown,
  rollbackStats,
  rollbackRepeatQueue,
  restoreStateForUndo,
  resolveGradingLayout,
  hasAnyReviewedCard,
} from "./engine";
import type { GradeSnapshot } from "./engine";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useSRSyncSession } from "./useSRSyncSession";
import { useSubscriptionQueue } from "./useSubscriptionQueue";
import { useFlashcardDueSummary } from "./useFlashcardDueSummary";
import { useQuests } from "@/features/quests/useQuests";
import { useReviewQueueFilter } from "./useReviewQueueFilter";
import { useImagePreload } from "./useImagePreload";
import { getModalityTheme } from "./modalityTheme";
import { CardImage } from "./CardPreview";
import { Icon } from "@/shared/components/Icon";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { PlainText } from "@/shared/components/PlainText";
import { FlashcardsInfoModal } from "./components/FlashcardsInfoModal";
import { FlashcardDetailSidebar } from "./components/FlashcardDetailSidebar";
import {
  FlashcardsOnboardingGate,
  FLASHCARDS_ONBOARDING_STORAGE_KEY,
} from "./components/FlashcardsOnboardingGate";
import type { Flashcard, CardSegment, SRSRating, SRSModality } from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

function getParticleById(particles: ParticleDef[] | null, id: string): ParticleDef | undefined {
  return particles?.find((p) => p.id === id);
}

function HighlightedText({
  segments,
  particles,
  highlightMode,
}: {
  segments: CardSegment[];
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  if (!segments?.length) return null;
  return (
    <span>
      {segments.map((seg, i) => {
        const particle = seg.particleId ? getParticleById(particles, seg.particleId) : undefined;
        const isParticle = Boolean(seg.particleId && particle);
        const isRoot = Boolean(highlightMode && seg.meaning && !seg.particleId);
        if (highlightMode && isParticle) {
          return (
            <mark
              key={i}
              className="rounded bg-warning/30 px-0.5"
              title={particle ? `${particle.form}: ${particle.meaning}` : undefined}
            >
              {seg.segment}
            </mark>
          );
        }
        if (isRoot) {
          return (
            <mark
              key={i}
              className="rounded bg-success/30 px-0.5"
              title={seg.meaning}
            >
              {seg.segment}
            </mark>
          );
        }
        return <span key={i}>{seg.segment}</span>;
      })}
    </span>
  );
}

function CardFace({
  card,
  side,
  particles,
  highlightMode,
}: {
  card: Flashcard;
  side: "front" | "back";
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  const isFront = side === "front";
  if (isFront) {
    if (highlightMode && card.type === "word" && card.parts?.length) {
      return <HighlightedText segments={card.parts} particles={particles} highlightMode />;
    }
    if (highlightMode && card.type === "sentence" && card.words?.length) {
      return <HighlightedText segments={card.words} particles={particles} highlightMode />;
    }
    return <PlainText>{card.front}</PlainText>;
  }
  return <PlainText>{card.back}</PlainText>;
}

const RATING_BUTTONS: Array<{ rating: SRSRating; label: string; color: string }> = [
  { rating: "again", label: "Again", color: "bg-error text-white hover:bg-error/90" },
  { rating: "hard", label: "Hard", color: "bg-warning text-white hover:bg-warning/90" },
  { rating: "good", label: "Good", color: "bg-success text-white hover:bg-success/90" },
  { rating: "easy", label: "Easy", color: "bg-accent text-white hover:bg-accent-hover" },
];

// Simple 2-button layout — "Didn't know" grades `again`, "Knew it" grades
// `good`. Both go through the same `handleRate` path as the full row so undo,
// requeue, and sync behave identically.
const SIMPLE_BUTTONS: Array<{
  rating: SRSRating;
  labelKey: string;
  labelDefault: string;
  color: string;
}> = [
  {
    rating: "again",
    labelKey: "flashcards.simpleDidntKnow",
    labelDefault: "Didn't know",
    color: "bg-error text-white hover:bg-error/90",
  },
  {
    rating: "good",
    labelKey: "flashcards.simpleKnewIt",
    labelDefault: "Knew it",
    color: "bg-success text-white hover:bg-success/90",
  },
];

function IntervalHint({
  cardId,
  rating,
  defaultEase,
  modality,
}: {
  cardId: string;
  rating: SRSRating;
  defaultEase?: number;
  modality: SRSModality;
}) {
  // Preview the interval for the TESTED modality only.
  const state = getEffectiveState(cardId, defaultEase);
  const after = reviewCard(state, modality, rating);
  const interval = after[modality].interval;
  if (interval === 0) return <span className="text-[10px]">&lt;1d</span>;
  if (interval === 1) return <span className="text-[10px]">1d</span>;
  if (interval < 30) return <span className="text-[10px]">{interval}d</span>;
  const months = Math.round(interval / 30);
  return <span className="text-[10px]">{months}mo</span>;
}

export function FlashcardTester() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const languageId = language?.id ?? "en";
  const particlesData = getParticlesForLanguage(languageId);
  const particles = particlesData?.particles ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  const freeReview = searchParams.get("free") === "1";

  const [queueVersion, setQueueVersion] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Escape closes the review-settings popover. Document-level because the
  // opener button keeps focus when the popover has no focused control.
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  // Grading experience prefs (persisted via SettingsContext).
  const { settings, updateFlashcards } = useSettings();
  const explicitGradingLayout = settings.flashcards?.gradingLayout;
  // History-aware default: snapshot "have they ever reviewed a card?" ONCE at
  // mount so the layout can't flip mid-session as this session grades cards.
  const [hadReviewedCardAtMount] = useState(() => hasAnyReviewedCard());
  const gradingLayout = resolveGradingLayout(
    explicitGradingLayout,
    hadReviewedCardAtMount,
  );
  const showIntervalPreviews = settings.flashcards?.showIntervalPreviews ?? false;

  const handleResetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(FLASHCARDS_ONBOARDING_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setInfoOpen(false);
  }, []);

  useSRSyncSession();

  const queueFilter = useReviewQueueFilter();
  const { queue, isLoading: subQueueLoading } = useSubscriptionQueue(
    languageId,
    queueVersion,
    queueFilter,
    { free: freeReview }
  );

  const cardIdToDefaultEase = queue?.cardIdToDefaultEase;

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [highlightMode, setHighlightMode] = useState(true);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  // SM-2 step 7: cards scoring < 4 are appended for re-review within the session
  const [repeatCards, setRepeatCards] = useState<Flashcard[]>([]);
  const [testedModality, setTestedModality] = useState<SRSModality>("recognition");
  // One-step UNDO — snapshot of the most recent grade (null before the first
  // grade and after the session ends). Depth is exactly one; each grade
  // overwrites it.
  const [lastGrade, setLastGrade] = useState<GradeSnapshot | null>(null);

  const allCards = useMemo(() => {
    const base = queue?.queue ?? [];
    return [...base, ...repeatCards];
  }, [queue, repeatCards]);

  const card: Flashcard | undefined = allCards[index];
  const isSessionDone = !card;

  // Live session tallies. `queue.newCount` / `queue.dueCount` are snapshots
  // taken when the queue is built and never change mid-session (grading writes
  // to the SRS store but doesn't bump the store revision the queue subscribes
  // to — see setCardState). So the header "New"/"Due" numbers froze. Recompute
  // remaining-new / remaining-due against the live store, keyed on session
  // progress, so they decrement as cards are introduced / cleared. Undo rolls
  // `sessionStats.reviewed` back, which re-derives these too.
  const liveCounts = useMemo(() => {
    if (!queue) {
      return {
        newRemaining: 0,
        dueRemaining: 0,
        dueBreakdown: { recognition: 0, production: 0 },
      };
    }
    const store = getSRSStore();
    return {
      newRemaining: countRemainingNewCards(queue.newCards, store),
      dueRemaining: countRemainingDueCards(queue.review, store),
      dueBreakdown: dueModalityBreakdown(queue.review, store),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, sessionStats.reviewed]);

  // Front-of-card audio: play the target word/sentence when the card shows.
  // Course word cards put the target script on `front`. This ONLY fires on
  // RECOGNITION reviews — there the target word IS the prompt (front is shown),
  // so audio reinforces pronunciation without leaking anything. On PRODUCTION
  // reviews the learner is cued by the meaning (back) and must produce the
  // word; `front` is the hidden answer, so playing it aloud would give it away
  // — hence gated off. Keyed by card id → plays once per card; honors
  // silentMode inside the hook. The 350ms hook delay + effect cleanup absorbs
  // the transient render where `testedModality` still holds the prior card's
  // value before its selection effect runs.
  const frontAudioText =
    card &&
    testedModality === "recognition" &&
    (card.type === "word" || card.type === "sentence")
      ? card.front
      : undefined;
  useAutoPlayJaAudio(frontAudioText, `fc-front-${card?.id ?? "none"}`);

  // ── Daily "Review N cards" quest (retention 1b) ──
  // Report this session's reviews to the server quest ONCE when the session
  // ends (batched — not per card). If the learner is now caught up (nothing
  // left due), complete the quest even if under target, so a learner with
  // few due cards isn't stuck at e.g. 8/20. The "swap when nothing is due at
  // day start" generation logic is a backend concern (handoff to Trevor —
  // see docs/followups.md).
  const quests = useQuests();
  const { dueCount: cardsStillDue } = useFlashcardDueSummary(
    language?.id ?? "ko",
  );
  const reviewsQuestReportedRef = useRef(false);
  useEffect(() => {
    if (!isSessionDone || sessionStats.reviewed === 0) return;
    if (reviewsQuestReportedRef.current) return;
    const q = quests.quests.find(
      (x) =>
        x.type === "daily" &&
        x.progress.unit === "reviews" &&
        x.status === "active",
    );
    if (!q) return;
    reviewsQuestReportedRef.current = true;
    if (cardsStillDue === 0) {
      quests.complete(q.id); // caught up — finish it regardless of target
    } else {
      quests.addProgress(q.id, sessionStats.reviewed);
    }
  }, [isSessionDone, sessionStats.reviewed, cardsStillDue, quests]);

  // Warm the next few cards' artwork so images don't pop in after flip.
  useImagePreload(allCards, index, 3);

  // Same idea for audio. Front-of-card audio autoplays the moment a card
  // shows, so fetching on play means a CDN round trip inside that window —
  // the clip lands late or after the learner has already graded and moved on.
  usePrefetchAudio(allCards, languageId, { index });

  // Pick which modality to test whenever the current card changes.
  useEffect(() => {
    if (!card) return;
    const defaultEase = cardIdToDefaultEase?.[card.id];
    const state = getEffectiveState(card.id, defaultEase);
    const due = getDueModalities(state);
    // Both due → recognition first (easier → harder). Neither due (new) → recognition.
    if (due.includes("recognition")) {
      setTestedModality("recognition");
    } else if (due.includes("production")) {
      setTestedModality("production");
    } else {
      setTestedModality("recognition");
    }
  }, [card, cardIdToDefaultEase]);

  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!card) return;
      const defaultEase = cardIdToDefaultEase?.[card.id];
      const current = getEffectiveState(card.id, defaultEase);
      // Snapshot the PRE-grade state (deep copy) so undo can restore it
      // verbatim without recomputing via FSRS.
      const requeued = shouldRepeatInSession(rating);
      setLastGrade({
        cardId: card.id,
        prevState: structuredClone(current),
        index,
        modality: testedModality,
        rating,
        requeued,
      });

      // Grade ONLY the tested modality so recognition and production
      // advance independently based on actual performance.
      const next = reviewCard(current, testedModality, rating);
      setCardState(card.id, next);

      // SM-2 step 7: if quality < 4, re-show at end of session
      if (requeued) {
        setRepeatCards((prev) => [...prev, card]);
      }

      setSessionStats((s) => ({
        reviewed: s.reviewed + 1,
        correct: rating !== "again" ? s.correct + 1 : s.correct,
      }));

      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card, cardIdToDefaultEase, testedModality, index],
  );

  // One-step UNDO — revert the most recent grade. Restores the card's SRS
  // state (verbatim snapshot, stamped as the newest local write so it wins
  // LWW sync), rolls back the session counters, removes any in-session
  // requeue the grade triggered, and returns the graded card as current in
  // its revealed state. Cleared afterward — depth is one.
  const handleUndo = useCallback(() => {
    setLastGrade((snap) => {
      if (!snap) return null;
      setCardState(snap.cardId, restoreStateForUndo(snap.prevState));
      setRepeatCards((prev) => rollbackRepeatQueue(prev, snap.requeued));
      setSessionStats((s) => rollbackStats(s, snap.rating));
      // Return to the graded card. The tested-modality effect re-derives the
      // same modality from the restored due-set, so the graded side is
      // re-shown; reveal it directly.
      setIndex(snap.index);
      setFlipped(true);
      return null;
    });
  }, []);

  const handleRateRef = useRef(handleRate);
  handleRateRef.current = handleRate;
  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;
  const canUndoRef = useRef(false);
  canUndoRef.current = lastGrade !== null;
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;
  const gradingLayoutRef = useRef(gradingLayout);
  gradingLayoutRef.current = gradingLayout;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Undo the last grade: Ctrl/⌘+Z, or a bare "z" (no modifier) since the
      // reviewer isn't a text surface. Guarded by availability.
      if (
        (e.key === "z" || e.key === "Z") &&
        !e.altKey &&
        !e.shiftKey &&
        canUndoRef.current
      ) {
        e.preventDefault();
        handleUndoRef.current();
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flippedRef.current) setFlipped(true);
        return;
      }
      if (flippedRef.current) {
        const n = parseInt(e.key, 10);
        if (gradingLayoutRef.current === "simple") {
          // Simple mode: 1 = Didn't know (again), 2 = Knew it (good). 3/4 do nothing.
          if (n === 1) {
            e.preventDefault();
            handleRateRef.current("again");
          } else if (n === 2) {
            e.preventDefault();
            handleRateRef.current("good");
          }
        } else {
          const ratings: SRSRating[] = ["again", "hard", "good", "easy"];
          if (n >= 1 && n <= 4) {
            e.preventDefault();
            handleRateRef.current(ratings[n - 1]);
          }
        }
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const restartSession = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    setRepeatCards([]);
    setSessionStats({ reviewed: 0, correct: 0 });
    setLastGrade(null);
    setQueueVersion((v) => v + 1);
  }, []);

  // No cross-session undo: clear the snapshot once the session ends (summary
  // screen) so a stray "z" there can't resurrect the last card.
  useEffect(() => {
    if (isSessionDone) setLastGrade(null);
  }, [isSessionDone]);

  const handleRestart = useCallback(() => {
    restartSession();
  }, [restartSession]);

  // "Keep practicing" — flip into free-review mode (surfaces not-yet-due
  // cards) and rebuild the queue. Sets ?free=1 so a refresh keeps the mode.
  const handleStartFreeReview = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("free", "1");
    setSearchParams(next, { replace: true });
    restartSession();
  }, [searchParams, setSearchParams, restartSession]);

  if (subQueueLoading) {
    return (
      <p className="text-text-muted">
        {t("flashcards.loading", "Loading…")}
      </p>
    );
  }

  if (!queue) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-8 text-center">
        <p className="text-text-muted">
          {queueFilter.kind !== "all"
            ? t(
                "flashcards.reviewFilterEmpty",
                "Nothing to review for this selection. Try another study option or subscribe to more decks."
              )
            : t(
                "flashcards.reviewNoQueue",
                "No cards to review yet. Cards unlock automatically as you finish lessons, or subscribe to a community deck to start reviewing right away."
              )}
        </p>
        <Link
          to={langPath("practice/flashcards")}
          className="inline-block text-sm font-medium text-accent hover:underline"
        >
          {t("flashcards.backToHub")}
        </Link>
      </div>
    );
  }

  if (isSessionDone) {
    const accuracy =
      sessionStats.reviewed > 0
        ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
        : 100;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12 text-center">
        <Icon name="partyPopper" size={48} className="text-accent" />
        <h2 className="text-2xl font-bold text-text-primary">
          {t("flashcards.sessionDone", "Review Complete!")}
        </h2>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-success">
              {sessionStats.reviewed}
            </span>
            <span className="text-xs text-text-muted">
              {t("flashcards.reviewed", "Reviewed")}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-success">
              {accuracy}%
            </span>
            <span className="text-xs text-text-muted">
              {t("flashcards.accuracy", "Accuracy")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {queue.dueCount > 0 || queue.newCount > 0 ? (
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {t("flashcards.reviewMore", "Review More")}
            </button>
          ) : (
            // Only offer free review when there are reviewed-but-not-yet-due
            // cards to surface. Otherwise the button is a silent no-op (the
            // queue would rebuild empty and re-show this same screen).
            (queue.notYetDueCount ?? 0) > 0 && (
              <button
                type="button"
                onClick={handleStartFreeReview}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                <Icon name="sparkles" size={16} aria-hidden />
                {t("flashcards.startFreeReview", "Start a free review")}
              </button>
            )
          )}
          <Link
            to={langPath("practice/flashcards")}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            {t("flashcards.backToHub")}
          </Link>
        </div>
        {freeReview && (
          <p className="text-xs text-text-muted">
            {t(
              "flashcards.freeReviewNote",
              "Free review shows cards before they're due. It won't change your schedule much — Good/Easy just nudge intervals.",
            )}
          </p>
        )}
      </div>
    );
  }

  // TS narrowing: card is guaranteed defined after isSessionDone guard
  const currentCard = card!;
  const modalityTheme = getModalityTheme(testedModality);

  // Toolbar for the detail overlay — lets the learner jump straight to the
  // review/FSRS settings or the "how review works" reference from the panel.
  const detailToolbar = (
    <>
      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        className="rounded p-1 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("flashcards.info.openLabel", "How review works")}
      >
        <Icon name="info" size={16} />
      </button>
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="rounded p-1 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("flashcards.reviewSettings", "Review settings")}
      >
        <Icon name="settings" size={16} />
      </button>
    </>
  );

  const progressPct =
    queue.totalCount > 0
      ? Math.min(100, Math.round((sessionStats.reviewed / queue.totalCount) * 100))
      : 0;

  return (
    // `justify-center` keeps the card column horizontally centered. The detail
    // panel is rendered as an absolute overlay INSIDE the centered column, so
    // revealing it never displaces the card.
    <div className="flex min-h-0 flex-1 justify-center">
      {/* Main content — always centered; detail panel floats beside it. */}
      <div className="relative flex min-w-0 max-w-md flex-1 flex-col space-y-4">
        <div className="relative flex items-center justify-between">
          <Link
            to={langPath("practice/flashcards")}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            {t("flashcards.backToHub")}
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.info.openLabel", "How review works")}
            >
              <Icon name="info" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.reviewSettings", "Review settings")}
              aria-expanded={settingsOpen}
            >
              <Icon name="settings" size={20} />
            </button>
          </div>
          {settingsOpen && (
            <>
              <div
                className="fixed inset-0 z-10 bg-transparent"
                aria-hidden
                onClick={() => setSettingsOpen(false)}
              />
              <div
                className="absolute right-0 top-full z-20 mt-1 w-64 shrink-0 space-y-3 rounded-lg border border-border bg-surface p-4 shadow-popover"
                role="dialog"
                aria-label={t("flashcards.reviewSettings", "Review settings")}
              >
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={highlightMode}
                    onChange={(e) => setHighlightMode(e.target.checked)}
                    className="rounded border-border accent-accent"
                  />
                  Highlight particles
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    {t("flashcards.gradingLayoutLabel", "Grading buttons")}
                  </label>
                  <select
                    value={gradingLayout}
                    onChange={(e) =>
                      updateFlashcards({
                        gradingLayout: e.target.value as "simple" | "full",
                      })
                    }
                    className="w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option value="simple">
                      {t("flashcards.gradingLayoutSimple", "Simple (2)")}
                    </option>
                    <option value="full">
                      {t("flashcards.gradingLayoutFull", "Full (4)")}
                    </option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={showIntervalPreviews}
                    onChange={(e) =>
                      updateFlashcards({
                        showIntervalPreviews: e.target.checked,
                      })
                    }
                    className="rounded border-border accent-accent"
                  />
                  {t("flashcards.showIntervalPreviews", "Show scheduling intervals")}
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    {t("flashcards.maxNewPerDayLabel", "New cards per session")}
                  </label>
                  <select
                    value={String(settings.flashcards?.maxNewCardsPerDay ?? "")}
                    onChange={(e) =>
                      updateFlashcards({
                        maxNewCardsPerDay:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option value="">
                      {t("flashcards.maxNewPerDayAll", "All unlocked (default)")}
                    </option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="0">
                      {t("flashcards.maxNewPerDayNone", "None — reviews only")}
                    </option>
                  </select>
                  <p className="mt-1 text-[11px] leading-snug text-text-muted">
                    {t(
                      "flashcards.maxNewPerDayHelp",
                      "Caps how many never-studied words each session introduces. Lessons stay the natural pace — set a cap if your queue feels too long.",
                    )}
                  </p>
                </div>
                <div>
                  <label className="flex items-start gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={settings.flashcards?.frequencyVocab ?? false}
                      onChange={(e) =>
                        updateFlashcards({ frequencyVocab: e.target.checked })
                      }
                      className="mt-0.5 rounded border-border accent-accent"
                    />
                    <span>
                      {t(
                        "flashcards.frequencyVocabLabel",
                        "Frequency vocabulary (optional words)",
                      )}
                    </span>
                  </label>
                  <p className="mt-1 text-[11px] leading-snug text-text-muted">
                    {t(
                      "flashcards.frequencyVocabHelp",
                      "Unlock common words beyond your lessons as you reach each module — reviewed alongside your cards.",
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress: bar = reviewed / initial queue (capped), +Again when repeat queue grows */}
        <div className="flex items-center gap-2">
          <div
            className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label={t("flashcards.sessionProgress", "Session progress")}
          >
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {repeatCards.length > 0 && (
            <span className="shrink-0 text-xs text-warning">
              +{repeatCards.length} {t("flashcards.againCount")}
            </span>
          )}
        </div>

      {/* Modality indicator — color-coded chip (recognition=info, production=accent). */}
      <div className="flex items-center justify-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${modalityTheme.chip}`}
        >
          <Icon name={modalityTheme.icon} size={12} aria-hidden />
          {testedModality === "recognition"
            ? t("flashcards.modeRecognition", "Recognition")
            : t("flashcards.modeProduction", "Production")}
        </span>
      </div>

      {/* Card — top rail color signals the active modality. Height is fixed
          (min-h-[360px]) for EVERY card, image or not, so the grade buttons
          below never shift between cards. Image cards were taller than plain
          ones, so the buttons jumped up and down as the queue advanced —
          shoving them under the cursor mid-grade (Spencer QA 2026-07-13).
          Custom review modes (e.g. front-image cues) will hook in around the
          image render below; for now the reviewer always shows the vocab art
          on the answer side so it never gives away a recognition prompt. */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`flex min-h-[360px] w-full flex-col items-center justify-center rounded-card border-2 border-t-4 border-border bg-surface py-12 shadow-sm transition hover:border-accent ${modalityTheme.rail}`}
      >
        {flipped && currentCard.image && (
          <CardImage
            src={currentCard.image}
            className="mb-3 max-h-32 w-auto rounded object-contain"
          />
        )}
        <p className="text-center text-3xl font-medium text-text-primary">
          <CardFace
            card={currentCard}
            side={
              // Recognition: shown Japanese (front) → recall meaning (back).
              // Production:  cued English (back) → produce Japanese (front).
              // This mapping was INVERTED until 2026-07-02 (EN→JA graded the
              // recognition sub-state) — the engine definition (types.ts) and
              // every lesson/grammar grading surface use the sense above, so
              // the reviewer now matches. No data migration: sub-states share
              // FSRS params and re-converge within a few reviews.
              testedModality === "recognition"
                ? flipped ? "back" : "front"
                : flipped ? "front" : "back"
            }
            particles={particles}
            highlightMode={highlightMode}
          />
        </p>
        <p className="mt-3 text-sm text-text-muted">
          {flipped
            ? testedModality === "recognition"
              ? t("flashcards.meaningLabel", "Meaning")
              : t("flashcards.wordLabel", "Word")
            : t("flashcards.tapToReveal", "Tap to reveal")}
        </p>
      </button>

      {/* Rating buttons (only when flipped) – above detail so layout doesn't
          shift. The action controls are wrapped in a fixed-height row so the
          reveal swap (single "Show" button → grade grid) never changes the
          control-area height and shoves layout. Both the "Show" button and
          every grade button are h-16 and vertically center their content, so
          the two states line up exactly (Spencer QA — buttons were jumping on
          reveal). This complements the card-body min-h fix above. */}
      <div
        className={`flex items-stretch ${
          gradingLayout === "simple" ? "h-16" : "h-24 sm:h-16"
        }`}
      >
      {flipped ? (
        gradingLayout === "simple" ? (
          <div className="grid w-full grid-cols-2 gap-2">
            {SIMPLE_BUTTONS.map(({ rating, labelKey, labelDefault, color }, i) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRate(rating)}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-sm font-semibold transition ${color}`}
                title={t("flashcards.ratingShortcut", "Shortcut: {{key}}", { key: i + 1 })}
              >
                {/* Keyboard shortcut keycap (lg:+ — keeps mobile clean). */}
                <span
                  className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded bg-black/15 text-[10px] font-bold leading-none lg:flex"
                  aria-hidden
                >
                  {i + 1}
                </span>
                {t(labelKey, labelDefault)}
                {showIntervalPreviews && (
                  <IntervalHint
                    cardId={currentCard.id}
                    rating={rating}
                    defaultEase={cardIdToDefaultEase?.[currentCard.id]}
                    modality={testedModality}
                  />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {RATING_BUTTONS.map(({ rating, label, color }, i) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRate(rating)}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-sm font-semibold transition ${color}`}
                title={t("flashcards.ratingShortcut", "Shortcut: {{key}}", { key: i + 1 })}
              >
                {/* Keyboard shortcut keycap (lg:+ — keeps mobile clean). */}
                <span
                  className="absolute right-1.5 top-1.5 hidden h-4 w-4 items-center justify-center rounded bg-black/15 text-[10px] font-bold leading-none lg:flex"
                  aria-hidden
                >
                  {i + 1}
                </span>
                {label}
                {showIntervalPreviews && (
                  <IntervalHint
                    cardId={currentCard.id}
                    rating={rating}
                    defaultEase={cardIdToDefaultEase?.[currentCard.id]}
                    modality={testedModality}
                  />
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="flex h-full w-full items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-white transition hover:bg-accent-hover"
        >
          {t("flashcards.showAnswer", "Show Answer")}
        </button>
      )}
      </div>

      {/* Detail panel stacked below the card on mobile. On lg:+ it floats
          as an absolute overlay (below) so the card never shifts. */}
      {flipped && (
        <FlashcardDetailSidebar
          card={currentCard}
          particles={particles}
          layout="stacked"
        />
      )}

      {/* lg:+ detail overlay — absolutely positioned to the right of the
          column, with a settings/info toolbar. Zero layout shift. */}
      {flipped && (
        <FlashcardDetailSidebar
          card={currentCard}
          particles={particles}
          layout="overlay"
          toolbar={detailToolbar}
        />
      )}

        {/* Floating counts widget */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2 shadow-sm"
          role="status"
        >
          <span className="text-sm text-text-muted">
            {t("flashcards.reviewed")}: <strong className="text-text-primary">{sessionStats.reviewed}</strong>
          </span>
          <span className="text-border">·</span>
          <span className="text-sm text-text-muted">
            {t("flashcards.newCount")}: <strong className="text-text-primary">{liveCounts.newRemaining}</strong>
          </span>
          <span className="text-border">·</span>
          <Tooltip
            side="top"
            label={
              <span className="block whitespace-nowrap">
                <span className="block">
                  {t("flashcards.dueBreakdownRecognition", "{{count}} due for recognition", {
                    count: liveCounts.dueBreakdown.recognition,
                  })}
                </span>
                <span className="block">
                  {t("flashcards.dueBreakdownProduction", "{{count}} due for production", {
                    count: liveCounts.dueBreakdown.production,
                  })}
                </span>
              </span>
            }
          >
            <span className="text-sm text-text-muted">
              {t("flashcards.dueCount")}: <strong className="text-text-primary">{liveCounts.dueRemaining}</strong>
            </span>
          </Tooltip>
          <span className="text-border">·</span>
          <span className="text-sm text-text-muted">
            {t("flashcards.againCount")}: <strong className="text-warning">{repeatCards.length}</strong>
          </span>
          {freeReview && (queue.extraCount ?? 0) > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-sm text-text-muted">
                {t("flashcards.extraCount", "Extra")}:{" "}
                <strong className="text-accent">{queue.extraCount}</strong>
              </span>
            </>
          )}
        </div>

        {/* Quiet one-step undo — only after a grade, clears at session end. */}
        {lastGrade && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted transition hover:text-text-primary"
            >
              <Icon name="rotateCcw" size={12} aria-hidden />
              {t("flashcards.undo", "Undo last grade")}
              <kbd className="hidden rounded bg-surface-muted px-1 font-sans text-[10px] font-medium leading-4 lg:inline">
                Z
              </kbd>
            </button>
          </div>
        )}
      </div>

      {/* First-time onboarding (auto, once per versioned flag). */}
      <FlashcardsOnboardingGate enabled />

      {/* On-demand reference, opened by the info icon. */}
      {infoOpen && (
        <FlashcardsInfoModal
          mode="reference"
          onClose={() => setInfoOpen(false)}
          onResetOnboarding={handleResetOnboarding}
        />
      )}
    </div>
  );
}
