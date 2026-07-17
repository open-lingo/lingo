import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/shared/components/ui/Breadcrumbs";
import { Link, useNavigate, useParams, useLocation, useBlocker } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useToast } from "@/shared/contexts/ToastContext";
import { useApi } from "@/shared/api/provider";
import { StudioHeader } from "@/features/studio/StudioHeader";
import { UnsavedChangesModal } from "@/features/studio/UnsavedChangesModal";
import { type ReviewMode } from "@/features/flashcards/reviewModes";
import type { Flashcard } from "@/features/flashcards/data/types";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { buildDeckPayload } from "./_deckEditorHelpers";
import {
  useDeckEditorDeck,
  useUpdateDeck,
  useCreateDeck,
} from "./useDeckEditorData";
import { useDeckCards } from "./useDeckCards";
import { CardNavigator } from "./components/CardNavigator";
import { CardPreviewPane } from "./components/CardPreviewPane";
import { DeckSettingsBar } from "./components/DeckSettingsBar";
import { ActiveCardEditor } from "./components/ActiveCardEditor";

export function DeckEditor() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const location = useLocation();
  const { deckId: routeDeckId } = useParams<{ deckId?: string }>();
  const returnState = location.state as {
    returnTo?: string;
    returnPath?: string;
    isCompanionDeck?: boolean;
    cardId?: string;
    storyId?: string;
    storyTitle?: string;
  } | undefined;
  const { language } = useLanguage();
  const { stories: storiesApi } = useApi();

  const [deckId, setDeckId] = useState<string | null>(routeDeckId ?? null);
  const [name, setName] = useState("");
  const [languageId, setLanguageId] = useState(language?.id ?? "ko");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [defaultEase, setDefaultEase] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewReviewMode, setPreviewReviewMode] = useState<ReviewMode>("word-first");
  const [cardSearch, setCardSearch] = useState("");
  const [showDeckSettings, setShowDeckSettings] = useState(false);
  const [companionStory, setCompanionStory] = useState<{ id: string; title: string } | null>(null);

  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);
  const {
    cards,
    setCards,
    selectedIndex,
    setSelectedIndex,
    selectedCard,
    hasInvalidCards,
    addCard,
    updateCard,
    deleteCard,
    duplicateCard,
    moveCard,
    handleDragEnd,
  } = useDeckCards(markDirty);

  const deckQuery = useDeckEditorDeck(deckId);
  const updateDeck = useUpdateDeck();
  const createDeck = useCreateDeck();
  const saving = updateDeck.isPending || createDeck.isPending;
  const loadError = deckQuery.isError
    ? deckQuery.error instanceof Error
      ? deckQuery.error.message
      : "Failed to load deck"
    : null;

  useEffect(() => {
    setDeckId(routeDeckId ?? null);
    if (!routeDeckId) {
      setName("");
      setDescription("");
      setImage("");
      setDefaultEase("");
      setCards([]);
      setSelectedIndex(null);
      setHasUnsavedChanges(false);
      setLanguageId(language?.id ?? "ko");
      setCompanionStory(null);
    }
  }, [routeDeckId, language?.id]);

  // Seed local editor state from the loaded deck. Runs once per (deck, cardId)
  // pair — a background refetch (e.g. after save) returns the same key and is
  // skipped, so in-editor edits are never clobbered. Mirrors the original
  // load effect: fields + card selection + history scrub + companion story.
  const seededKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const deck = deckQuery.data;
    if (!deck) return;
    const cardId = returnState?.cardId;
    const key = `${deck.id}::${cardId ?? ""}`;
    if (seededKeyRef.current === key) return;
    seededKeyRef.current = key;

    setName(deck.name);
    setLanguageId(deck.languageId);
    setDescription(deck.description ?? "");
    setImage(deck.image ?? "");
    setDefaultEase(deck.defaultEase != null ? String(deck.defaultEase) : "");
    const loadedCards = (deck.cards ?? []) as Flashcard[];
    setCards(loadedCards);
    if (cardId && loadedCards.length > 0) {
      const idx = loadedCards.findIndex((c) => c.id === cardId);
      if (idx >= 0) setSelectedIndex(idx);
      const cur = (window.history.state ?? {}) as Record<string, unknown>;
      const { cardId: _omit, ...rest } = cur;
      window.history.replaceState(rest, document.title, location.pathname);
    }
    const storyId =
      deck.companionToStoryId && deck.companionToStoryId !== "pending"
        ? deck.companionToStoryId
        : (returnState as { storyId?: string })?.storyId ?? null;
    setCompanionStory(null);
    if (storyId && storiesApi) {
      storiesApi
        .getStory(storyId)
        .then((s) => setCompanionStory({ id: s.id, title: s.title }))
        .catch(() => {});
    }
  }, [deckQuery.data, returnState?.cardId, storiesApi, location.pathname]);

  // New deck from StoryEditor: use storyId/storyTitle from state or fetch
  useEffect(() => {
    if (deckId && deckId !== "new") return;
    const storyId = returnState?.storyId ?? null;
    const storyTitle = returnState?.storyTitle ?? null;
    if (storyId && storyTitle) {
      setCompanionStory({ id: storyId, title: storyTitle });
    } else if (storyId && storiesApi) {
      storiesApi
        .getStory(storyId)
        .then((s) => setCompanionStory({ id: s.id, title: s.title }))
        .catch(() => {});
    } else if (returnState?.isCompanionDeck) {
      setCompanionStory({ id: "", title: t("community.companionDeckForStory", "Story") });
    }
  }, [deckId, returnState?.isCompanionDeck, returnState?.storyId, returnState?.storyTitle, storiesApi, t]);

  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return cards;
    const q = cardSearch.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.note ?? "").toLowerCase().includes(q)
    );
  }, [cards, cardSearch]);

  const buildPayload = useCallback(
    () =>
      buildDeckPayload({
        languageId,
        name,
        description,
        image,
        defaultEase,
        cards,
        isNewCompanionDeck: !deckId && !!returnState?.isCompanionDeck,
      }),
    [languageId, name, description, image, defaultEase, cards, deckId, returnState?.isCompanionDeck],
  );

  const handleSaveDraft = async () => {
    if (!name.trim()) return;
    if (hasInvalidCards) return;
    try {
      const payload = buildPayload();
      if (deckId) {
        const res = await updateDeck.mutateAsync({ deckId, body: payload });
        setDeckId(res.id);
      } else {
        const res = await createDeck.mutateAsync(payload);
        setDeckId(res.id);
        if (returnState?.returnPath && returnState?.returnTo === "story-editor") {
          navigate(returnState.returnPath, {
            replace: true,
            state: {
              createdDeckId: res.id,
              createdDeckName: res.name,
              createdDeckCardCount: res.cards?.length ?? 0,
              bypassBlocker: true,
            },
          });
        } else {
          navigate(langPath(`community/decks/${res.id}`), { replace: true, state: { bypassBlocker: true } });
        }
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Save draft failed:", err);
      showToast(
        t("deckEditor.saveFailed", {
          defaultValue: "Couldn't save your deck. Please try again.",
        }),
        "error",
      );
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const payload = { ...buildPayload(), status: "published" as const };
      if (deckId) {
        await updateDeck.mutateAsync({ deckId, body: payload });
        navigate(langPath("community/contribute"), { state: { bypassBlocker: true } });
      } else {
        const res = await createDeck.mutateAsync(payload);
        setDeckId(res.id);
        if (returnState?.returnPath && returnState?.returnTo === "story-editor") {
          navigate(returnState.returnPath, {
            replace: true,
            state: {
              createdDeckId: res.id,
              createdDeckName: res.name,
              createdDeckCardCount: res.cards?.length ?? 0,
              bypassBlocker: true,
            },
          });
        } else {
          navigate(langPath("community/contribute"), { state: { bypassBlocker: true } });
        }
      }
    } catch (err) {
      console.error("Submit failed:", err);
      showToast(
        t("deckEditor.submitFailed", {
          defaultValue: "Couldn't publish your deck. Please try again.",
        }),
        "error",
      );
    }
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (!name.trim() || hasInvalidCards || saving) return;
      handleSaveDraft();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // handleSaveDraft is stable per render; we re-bind on every render to capture latest closure state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const blocker = useBlocker(
    useCallback(
      ({ nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string; state?: unknown } }) => {
        if (!hasUnsavedChanges) return false;
        if ((nextLocation.state as { bypassBlocker?: boolean })?.bypassBlocker) return false;
        return true;
      },
      [hasUnsavedChanges],
    ),
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("community.breadcrumbCommunity"), to: langPath("community") },
    {
      label: t("community.breadcrumbMyDecks"),
      to: langPath("community/library?tab=mine"),
    },
    { label: name.trim() || t("community.deckCreateTitle") },
  ];

  if (loadError) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">{loadError}</p>
        <Link
          to={langPath("community/contribute")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
        >
          {t("community.contribute")}
        </Link>
      </div>
    );
  }

  if (deckQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <CenteredLoader py="xl" message={t("common.loading")} />
      </div>
    );
  }

  const nameInput = (
    <input
      type="text"
      value={name}
      onChange={(e) => {
        setName(e.target.value);
        setHasUnsavedChanges(true);
      }}
      placeholder={t("community.contributeNamePlaceholder")}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-base font-medium text-text-primary"
    />
  );

  return (
    <div className="space-y-4">
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      {blocker.state === "blocked" && (
        <UnsavedChangesModal
          onSave={handleSaveDraft}
          onDiscard={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
          saving={saving}
        />
      )}
      <StudioHeader
        deckName={name}
        status="draft"
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        canSave={!!name.trim() && !hasInvalidCards}
        canSubmit={!!name.trim() && cards.length > 0 && !hasInvalidCards}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onToggleDeckSettings={() => setShowDeckSettings((s) => !s)}
        showDeckSettings={showDeckSettings}
        nameInput={nameInput}
      />
      {companionStory && (
        <div className="flex items-center gap-2 border-b border-border bg-accent-muted/40 px-4 py-2">
          <span className="text-sm font-medium text-text-secondary">
            {t("community.companionDeckFor", { defaultValue: "Companion deck for:" })}{" "}
          </span>
          {companionStory.id ? (
            <Link
              to={langPath(`community/contribute/create/story/${companionStory.id}`)}
              className="font-medium text-accent underline hover:text-accent-hover"
            >
              {companionStory.title}
            </Link>
          ) : (
            <span className="font-medium text-text-primary">{companionStory.title}</span>
          )}
        </div>
      )}
      {showDeckSettings && (
        <DeckSettingsBar
          languageId={languageId}
          description={description}
          image={image}
          defaultEase={defaultEase}
          onLanguageChange={(v) => {
            setLanguageId(v);
            setHasUnsavedChanges(true);
          }}
          onDescriptionChange={(v) => {
            setDescription(v);
            setHasUnsavedChanges(true);
          }}
          onImageChange={(v) => {
            setImage(v);
            setHasUnsavedChanges(true);
          }}
          onDefaultEaseChange={(v) => {
            setDefaultEase(v);
            setHasUnsavedChanges(true);
          }}
        />
      )}

      {/* Three-pane layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Card Navigator */}
        <CardNavigator
          cards={cards}
          filteredCards={filteredCards}
          selectedIndex={selectedIndex}
          hasUnsavedChanges={hasUnsavedChanges}
          cardSearch={cardSearch}
          onCardSearchChange={setCardSearch}
          onAddCard={addCard}
          onSelect={setSelectedIndex}
          onMoveUp={(i) => moveCard(i, -1)}
          onMoveDown={(i) => moveCard(i, 1)}
          onDuplicate={duplicateCard}
          onDelete={deleteCard}
          onDragEnd={handleDragEnd}
        />

        {/* Center: Card Preview (half width) */}
        <CardPreviewPane
          selectedCard={selectedCard}
          cardsLength={cards.length}
          languageId={languageId}
          previewReviewMode={previewReviewMode}
          onReviewModeChange={setPreviewReviewMode}
          onAddCard={addCard}
        />

        {/* Right: Card Editor (half width) */}
        <aside className="flex min-w-0 flex-1 basis-0 flex-col overflow-y-auto bg-surface p-6">
          {selectedCard ? (
            <ActiveCardEditor
              key={selectedCard.id}
              card={selectedCard}
              index={selectedIndex!}
              languageId={languageId}
              onUpdate={(u) => updateCard(selectedIndex!, u)}
            />
          ) : (
            <p className="py-6 text-center text-sm text-text-muted">
              {t("community.editorSelectCardToPreview")}
            </p>
          )}
        </aside>
      </div>
      </div>
    </div>
  );
}
