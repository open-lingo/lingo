import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useViewport } from "@/shared/hooks/useViewport";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import { useAutoPlayJaAudio } from "@/shared/tts";
import { usePrefetchAudio } from "@/shared/tts/prefetch";
import {
  reviewCard,
  setCardState,
  getEffectiveState,
  getSRSStore,
  requeueReason,
  buildSessionSlots,
  countRemainingNewCards,
  countRemainingDueReviews,
  dueModalityBreakdown,
  rollbackStats,
  rollbackRepeatQueue,
  restoreStateForUndo,
  resolveGradingLayout,
} from "./engine";
import type { GradeSnapshot, SessionSlot, RequeueReason } from "./engine";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useSRSyncSession } from "./useSRSyncSession";
import { useSubscriptionQueue } from "./useSubscriptionQueue";
import { useFlashcardDueSummary } from "./useFlashcardDueSummary";
import { useQuests } from "@/features/quests/useQuests";
import { useReviewQueueFilter } from "./useReviewQueueFilter";
import { useImagePreload } from "./useImagePreload";
import { getModalityTheme } from "./modalityTheme";
import { Icon } from "@/shared/components/Icon";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { FlashcardsInfoModal } from "./components/FlashcardsInfoModal";
import {
  FlashcardDetailSidebar,
  hasSidebarContent,
} from "./components/FlashcardDetailSidebar";
import { ReviewCard } from "./components/ReviewCard";
import { GradeRow } from "./components/GradeRow";
import { SessionSummary } from "./components/SessionSummary";
import { ReviewToolbar } from "./components/ReviewToolbar";
import { ReviewSettingsPanel } from "./components/ReviewSettingsPanel";
import { ReviewDetailsSheet } from "./components/ReviewDetailsSheet";
import { ReviewShell } from "./components/ReviewShell";
import {
  FlashcardsOnboardingGate,
  FLASHCARDS_ONBOARDING_STORAGE_KEY,
} from "./components/FlashcardsOnboardingGate";
import type { Flashcard, SRSRating, SRSModality } from "@/features/flashcards/data/types";

/** A slot coming back within the session, tagged with why (see requeueReason). */
type RepeatSlot = SessionSlot & { reason: RequeueReason };

export function FlashcardTester() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  // Below `md` the session is a focused, fitted surface: secondary content
  // (details, stats, settings) moves into one bottom sheet instead of stacking
  // under the card. Above `md` nothing changes.
  const { isMobile } = useViewport();
  const [sheet, setSheet] = useState<null | "details" | "session">(null);
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

  // Grading experience prefs (persisted via SettingsContext). Writes now go
  // through `ReviewSettingsPanel`'s own `useSettings()` call (one copy, two
  // hosts — desktop popover and mobile sheet); this component only reads.
  const { settings } = useSettings();
  // Two buttons unless the learner explicitly chose four in review settings
  // (Spencer, 2026-09-02). No history-derived promotion, so nothing can change
  // the row's shape mid-learner — the `hadReviewedCardAtMount` snapshot that
  // used to freeze the old flip for the duration of a session is gone with it.
  const gradingLayout = resolveGradingLayout(settings.flashcards?.gradingLayout);
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
  // Slots the scheduler still wants today — a missed grade (Again/Hard) or a
  // card sitting on an FSRS same-day learning step — appended for re-review
  // within this session rather than left for the next one.
  const [repeatSlots, setRepeatSlots] = useState<RepeatSlot[]>([]);
  // One-step UNDO — snapshot of the most recent grade (null before the first
  // grade and after the session ends). Depth is exactly one; each grade
  // overwrites it.
  const [lastGrade, setLastGrade] = useState<GradeSnapshot | null>(null);

  // The session is a list of SLOTS (card × direction), not cards. The reviewer
  // grades one modality per answer, so a card due for BOTH recognition and
  // production is two units of work. Treating it as one card-shaped entry meant
  // the recognition grade consumed the card and the still-due production half
  // dropped out of the session — "Review Complete!" with work left over, and
  // the same words reappearing as production on the next visit. Built once per
  // queue (not per grade) so grading can't reshuffle the session underfoot.
  const baseSlots = useMemo(
    () => buildSessionSlots(queue?.queue ?? []),
    [queue],
  );

  const allSlots = useMemo(
    () => [...baseSlots, ...repeatSlots],
    [baseSlots, repeatSlots],
  );
  const allCards = useMemo(() => allSlots.map((s) => s.card), [allSlots]);
  // The "Again" chip counts only MISSED slots. Same-day learning-step requeues
  // also lengthen the session, but calling them "Again" would misreport a
  // correct answer — they show up in the progress bar's denominator instead.
  const againQueued = repeatSlots.filter((s) => s.reason === "again").length;

  const slot: SessionSlot | undefined = allSlots[index];
  const card: Flashcard | undefined = slot?.card;
  // Fixed by the slot, not re-derived from live state — grading the current
  // slot changes that state, so deriving would race the render.
  const testedModality: SRSModality = slot?.modality ?? "recognition";
  const isSessionDone = !slot;

  // Live session tallies. `queue.newCount` / `queue.dueCount` are snapshots
  // taken when the queue is built and never change mid-session (grading writes
  // to the SRS store but doesn't bump the store revision the queue subscribes
  // to — see setCardState). So the header "New"/"Due" numbers froze. Recompute
  // remaining-new / remaining-due against the live store, keyed on session
  // progress, so they decrement as cards are introduced / cleared. Undo rolls
  // `sessionStats.reviewed` back, which re-derives these too.
  //
  // "Due" counts REVIEWS (card × due direction), matching the slot queue — a
  // card due both ways is two gradings, and counting it once made the headline
  // hit 0 with production reviews still ahead.
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
      dueRemaining: countRemainingDueReviews(queue.review, store),
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
  // — hence gated off. Honors silentMode inside the hook.
  //
  // Keyed by SLOT position, not card id: `autoPlayJaAudio` remembers played
  // keys for the page's lifetime, so a card-id key played once and stayed
  // silent on every re-exposure — and a card now comes back within a session
  // routinely (same-day learning step, missed grade, second direction). The
  // position makes each exposure its own key.
  const frontAudioText =
    card &&
    testedModality === "recognition" &&
    (card.type === "word" || card.type === "sentence")
      ? (card.reading?.kana ?? card.front)
      : undefined;
  useAutoPlayJaAudio(frontAudioText, `fc-front-${index}-${card?.id ?? "none"}`);

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

  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!card) return;
      const defaultEase = cardIdToDefaultEase?.[card.id];
      const current = getEffectiveState(card.id, defaultEase);

      // Grade ONLY the tested modality so recognition and production
      // advance independently based on actual performance.
      const next = reviewCard(current, testedModality, rating);
      setCardState(card.id, next);

      // Re-show within THIS session when the scheduler still wants this
      // direction today — a missed grade, or a same-day FSRS learning step.
      // Decided from the POST-grade state, so a new card graded Good on its
      // 10-minute step comes back now instead of after "Review Complete!".
      // Always the SAME direction that was graded, not whatever is due later.
      const reason = requeueReason(next, testedModality, rating);
      if (reason) {
        setRepeatSlots((prev) => [
          ...prev,
          { card, modality: testedModality, reason },
        ]);
      }

      // Snapshot the PRE-grade state (deep copy) so undo can restore it
      // verbatim without recomputing via FSRS.
      setLastGrade({
        cardId: card.id,
        prevState: structuredClone(current),
        index,
        modality: testedModality,
        rating,
        requeued: reason !== null,
      });

      setSessionStats((s) => ({
        reviewed: s.reviewed + 1,
        correct: rating !== "again" ? s.correct + 1 : s.correct,
      }));

      setFlipped(false);
      setIndex((i) => i + 1);
      // The details sheet's "enabled" state is keyed on the REVEALED current
      // card (see `detailsEnabled`) — leaving it open across an advance would
      // show it hovering over the next, unrevealed card, which is exactly the
      // disabled-until-revealed invariant it's supposed to enforce. Closed
      // here (the actual card-change path — button click or keyboard grade,
      // both route through this function) rather than guarded in the keydown
      // handler, so every advance path is covered by construction.
      setSheet(null);
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
      setRepeatSlots((prev) => rollbackRepeatQueue(prev, snap.requeued));
      setSessionStats((s) => rollbackStats(s, snap.rating));
      // Return to the graded slot — it carries the graded direction, so the
      // same side comes back regardless of state; reveal it directly.
      setIndex(snap.index);
      setFlipped(true);
      // Same invariant as the grade path above: the current card is changing,
      // so any open details sheet is stale.
      setSheet(null);
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
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;
  const infoOpenRef = useRef(infoOpen);
  infoOpenRef.current = infoOpen;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // A focus-trapped sheet/modal owns the keyboard while open — grading or
      // undoing behind it would mutate SRS state the user can't see, and
      // without this the handler also swallows Enter/Space meant for the
      // modal's own controls (e.g. its Close button).
      if (sheetRef.current !== null || infoOpenRef.current) return;

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
        // Let native button/link/input activation handle its own Space/Enter
        // — only the body/card surface flips on these keys.
        if (
          e.target instanceof HTMLElement &&
          e.target.closest("button, a, input, textarea, select, [role=button]")
        ) {
          return;
        }
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
    setRepeatSlots([]);
    setSessionStats({ reviewed: 0, correct: 0 });
    setLastGrade(null);
    setQueueVersion((v) => v + 1);
    setSheet(null);
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
        // Distinct accessible name from the toolbar's "Review settings" gear
        // (same popover, opened from a second spot) — otherwise the two
        // same-named buttons make `getByRole("button", { name: /review
        // settings/i })` ambiguous.
        aria-label={t("flashcards.detailPanelSettings", "Open settings")}
      >
        <Icon name="settings" size={16} />
      </button>
    </>
  );

  // Denominator is the session's live SLOT count, not the card count. A card
  // due in both directions is two gradings, so `queue.totalCount` overstated
  // progress and the bar hit 100% with production reviews still ahead. Counting
  // requeued slots too means the bar re-scales as the session grows instead of
  // pinning at 100% while work remains.
  const progressPct =
    allSlots.length > 0
      ? Math.min(100, Math.round((sessionStats.reviewed / allSlots.length) * 100))
      : 0;

  return (
    <>
      <ReviewShell
        fitted={isMobile}
        stageLabel={t("flashcards.stageLabel", "Review card")}
        toolbar={
          // No slot left → the session is on its summary screen; the toolbar
          // (back link, progress bar, detail/settings affordances) has
          // nothing to act on and would duplicate the summary's own
          // "Back to Flashcards" link.
          !card ? null : (
            <ReviewToolbar
              compact={isMobile}
              hubPath={langPath("practice/flashcards")}
              progressPct={progressPct}
              againQueued={againQueued}
              canUndo={lastGrade !== null}
              onUndo={handleUndo}
              onOpenInfo={() => setInfoOpen(true)}
              onOpenSettings={() =>
                isMobile ? setSheet("session") : setSettingsOpen((o) => !o)
              }
              settingsOpen={settingsOpen}
              onOpenDetails={() => setSheet("details")}
              detailsEnabled={flipped && hasSidebarContent(card)}
              settingsPopover={
                settingsOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-10 bg-transparent"
                      aria-hidden
                      onClick={() => setSettingsOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-full z-20 mt-1 w-64 shrink-0 rounded-lg border border-border bg-surface p-4 shadow-popover"
                      role="dialog"
                      aria-label={t("flashcards.reviewSettings", "Review settings")}
                    >
                      <ReviewSettingsPanel
                        highlightMode={highlightMode}
                        onHighlightModeChange={setHighlightMode}
                      />
                    </div>
                  </>
                ) : undefined
              }
            />
          )
        }
      >
        {!card ? (
          <SessionSummary
            reviewed={sessionStats.reviewed}
            correct={sessionStats.correct}
            canReviewMore={queue.dueCount > 0 || queue.newCount > 0}
            canFreeReview={(queue.notYetDueCount ?? 0) > 0}
            freeReview={freeReview}
            onRestart={handleRestart}
            onStartFreeReview={handleStartFreeReview}
            hubPath={langPath("practice/flashcards")}
            fitted={isMobile}
          />
        ) : (
          <>
            {/* Modality indicator — color-coded chip (recognition=info, production=accent). */}
            <div className="flex shrink-0 items-center justify-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${modalityTheme.chip}`}
              >
                <Icon name={modalityTheme.icon} size={12} aria-hidden />
                {testedModality === "recognition"
                  ? t("flashcards.modeRecognition", "Recognition")
                  : t("flashcards.modeProduction", "Production")}
              </span>
            </div>

            <ReviewCard
              card={card}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              testedModality={testedModality}
              particles={particles}
              highlightMode={highlightMode}
              fitted={isMobile}
            />

            <GradeRow
              flipped={flipped}
              onReveal={() => setFlipped(true)}
              onRate={handleRate}
              gradingLayout={gradingLayout}
              cardId={card.id}
              defaultEase={cardIdToDefaultEase?.[card.id]}
              modality={testedModality}
              showIntervalPreviews={showIntervalPreviews}
            />

            {/* Detail panel stacked below the card on mobile. On lg:+ it floats
                as an absolute overlay (below) so the card never shifts. Below `md`
                the detail body lives in `ReviewDetailsSheet` instead — this stays
                purely a `lg:` overlay concern once `isMobile` is true. */}
            {!isMobile && flipped && (
              <FlashcardDetailSidebar
                card={card}
                particles={particles}
                layout="stacked"
              />
            )}

            {/* lg:+ detail overlay — absolutely positioned to the right of the
                column, with a settings/info toolbar. Zero layout shift. */}
            {!isMobile && flipped && (
              <FlashcardDetailSidebar
                card={card}
                particles={particles}
                layout="overlay"
                toolbar={detailToolbar}
              />
            )}

            {/* Floating counts widget — desktop only; mobile counts live in
                `ReviewDetailsSheet`. */}
            {!isMobile && (
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
                  {t("flashcards.againCount")}: <strong className="text-warning">{againQueued}</strong>
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
            )}

            {/* Quiet one-step undo — only after a grade, clears at session end.
                Desktop only; mobile undo lives as a chip in `ReviewToolbar`. */}
            {!isMobile && lastGrade && (
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
          </>
        )}
      </ReviewShell>

      {isMobile && card && (
        <ReviewDetailsSheet
          open={sheet !== null}
          onClose={() => setSheet(null)}
          initialSection={sheet ?? "details"}
          card={card}
          particles={particles}
          stats={{
            reviewed: sessionStats.reviewed,
            newRemaining: liveCounts.newRemaining,
            dueRemaining: liveCounts.dueRemaining,
            dueBreakdown: liveCounts.dueBreakdown,
            againQueued,
            extraCount: freeReview ? queue.extraCount : undefined,
          }}
          settings={
            <ReviewSettingsPanel
              highlightMode={highlightMode}
              onHighlightModeChange={setHighlightMode}
            />
          }
        />
      )}

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
    </>
  );
}
