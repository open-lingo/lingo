import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import { reviewCard, setCardState, getEffectiveState, shouldRepeatInSession, getDueModalities } from "./engine";
import { useSRSyncSession } from "./useSRSyncSession";
import { useSubscriptionQueue } from "./useSubscriptionQueue";
import { useFlashcardDueSummary } from "./useFlashcardDueSummary";
import { useQuests } from "@/features/quests/useQuests";
import { useReviewQueueFilter } from "./useReviewQueueFilter";
import { useImagePreload } from "./useImagePreload";
import { getModalityTheme } from "./modalityTheme";
import { CardImage } from "./CardPreview";
import { Icon } from "@/shared/components/Icon";
import { PlainText } from "@/shared/components/PlainText";
import { FlashcardsInfoModal } from "./components/FlashcardsInfoModal";
import { FlashcardDetailSidebar } from "./components/FlashcardDetailSidebar";
import {
  FlashcardsOnboardingGate,
  FLASHCARDS_ONBOARDING_STORAGE_KEY,
} from "./components/FlashcardsOnboardingGate";
import {
  type ReviewMode,
  REVIEW_MODES,
  REVIEW_MODE_LABELS,
  REVIEW_MODE_WORD_FIRST,
} from "./reviewModes";
import type { Flashcard, CardSegment, SRSRating, SRSModality } from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

const REVIEW_MODE_STORAGE_KEY = "openlingo-review-mode";

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
  const [reviewMode, setReviewMode] = useState<ReviewMode>(() => {
    try {
      const s = localStorage.getItem(REVIEW_MODE_STORAGE_KEY);
      if (s && (s === "word-first" || s === "image-first" || s === "back-first")) return s;
    } catch {
      /* ignore */
    }
    return REVIEW_MODE_WORD_FIRST;
  });

  useEffect(() => {
    try {
      localStorage.setItem(REVIEW_MODE_STORAGE_KEY, reviewMode);
    } catch {
      /* ignore */
    }
  }, [reviewMode]);

  const showImage = (mode: ReviewMode, isFlipped: boolean) => {
    if (mode === "back-first") return !isFlipped; // back first = translation, image on "front" view
    if (mode === "word-first") return isFlipped;
    return true; // image-first: both sides
  };
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  // SM-2 step 7: cards scoring < 4 are appended for re-review within the session
  const [repeatCards, setRepeatCards] = useState<Flashcard[]>([]);
  const [testedModality, setTestedModality] = useState<SRSModality>("recognition");

  const allCards = useMemo(() => {
    const base = queue?.queue ?? [];
    return [...base, ...repeatCards];
  }, [queue, repeatCards]);

  const card: Flashcard | undefined = allCards[index];
  const isSessionDone = !card;

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
      // Grade ONLY the tested modality so recognition and production
      // advance independently based on actual performance.
      const next = reviewCard(current, testedModality, rating);
      setCardState(card.id, next);

      // SM-2 step 7: if quality < 4, re-show at end of session
      if (shouldRepeatInSession(rating)) {
        setRepeatCards((prev) => [...prev, card]);
      }

      setSessionStats((s) => ({
        reviewed: s.reviewed + 1,
        correct: rating !== "again" ? s.correct + 1 : s.correct,
      }));

      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card, cardIdToDefaultEase, testedModality],
  );

  const handleRateRef = useRef(handleRate);
  handleRateRef.current = handleRate;
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flippedRef.current) setFlipped(true);
        return;
      }
      if (flippedRef.current) {
        const ratings: SRSRating[] = ["again", "hard", "good", "easy"];
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) {
          e.preventDefault();
          handleRateRef.current(ratings[n - 1]);
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
    setQueueVersion((v) => v + 1);
  }, []);

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
                "No flashcard deck for this language yet. Subscribe to a deck from the community or select Korean in the language selector to try the sample deck."
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
              className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.info.openLabel", "How review works")}
            >
              <Icon name="info" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    {t("flashcards.reviewModeLabel", "Review mode")}
                  </label>
                  <select
                    value={reviewMode}
                    onChange={(e) => setReviewMode(e.target.value as ReviewMode)}
                    className="w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
                  >
                    {REVIEW_MODES.map((m) => (
                      <option key={m} value={m}>
                        {t(REVIEW_MODE_LABELS[m])}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={highlightMode}
                    onChange={(e) => setHighlightMode(e.target.checked)}
                    className="rounded border-border accent-accent"
                  />
                  Highlight particles
                </label>
              </div>
            </>
          )}
        </div>

        {/* Progress: bar = reviewed / initial queue (capped), +Again when repeat queue grows */}
        <div className="flex items-center gap-2">
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{
                width: `${
                  queue.totalCount > 0
                    ? Math.min(100, Math.round((sessionStats.reviewed / queue.totalCount) * 100))
                    : 0
                }%`,
              }}
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

      {/* Card — top rail color signals the active modality. */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-xl border-2 border-t-4 border-border bg-surface py-12 shadow-sm transition hover:border-accent ${modalityTheme.rail}`}
      >
        {showImage(reviewMode, flipped) && currentCard.image && (
          <CardImage
            src={currentCard.image}
            className="mb-3 max-h-32 w-auto rounded object-contain"
          />
        )}
        <p className="text-center text-2xl font-medium text-text-primary">
          <CardFace
            card={currentCard}
            side={
              // Recognition: front=English (back), reveal=Japanese (front)
              // Production:  front=Japanese (front), reveal=English (back)
              testedModality === "recognition"
                ? flipped ? "front" : "back"
                : flipped ? "back" : "front"
            }
            particles={particles}
            highlightMode={highlightMode}
          />
        </p>
        <p className="mt-3 text-sm text-text-muted">
          {flipped
            ? testedModality === "recognition"
              ? t("flashcards.wordLabel", "Word")
              : t("flashcards.answerLabel", "Answer")
            : t("flashcards.tapToReveal", "Tap to reveal")}
        </p>
      </button>

      {/* Rating buttons (only when flipped) – above detail so layout doesn't shift */}
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATING_BUTTONS.map(({ rating, label, color }, i) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRate(rating)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-3 text-sm font-semibold transition ${color}`}
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
              <IntervalHint
                cardId={currentCard.id}
                rating={rating}
                defaultEase={cardIdToDefaultEase?.[currentCard.id]}
                modality={testedModality}
              />
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="w-full rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-hover"
        >
          {t("flashcards.showAnswer", "Show Answer")}
        </button>
      )}

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
            {t("flashcards.newCount")}: <strong className="text-text-primary">{queue.newCount}</strong>
          </span>
          <span className="text-border">·</span>
          <span className="text-sm text-text-muted">
            {t("flashcards.dueCount")}: <strong className="text-text-primary">{queue.dueCount}</strong>
          </span>
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
