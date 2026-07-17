import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/shared/components/ui/Breadcrumbs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link, useNavigate, useParams, useLocation, useBlocker } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useToast } from "@/shared/contexts/ToastContext";
import { useApi } from "@/shared/api/provider";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import { CardPreview } from "@/features/flashcards/CardPreview";
import { StudioHeader } from "@/features/studio/StudioHeader";
import { UnsavedChangesModal } from "@/features/studio/UnsavedChangesModal";
import {
  type ReviewMode,
  REVIEW_MODES,
  REVIEW_MODE_LABELS,
} from "@/features/flashcards/reviewModes";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import type { Flashcard, CardSegment } from "@/features/flashcards/data/types";
import { Icon } from "@/shared/components/Icon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse default ease from editor string; returns undefined if empty or invalid (backend uses 2.5). */
function parseDefaultEase(s: string): number | undefined {
  const n = Number(s.trim());
  if (s.trim() === "" || Number.isNaN(n)) return undefined;
  return Math.max(1.3, Math.min(3, n));
}

/** Card mode: Simple = front/back/note. Segmented = segments define front (word or sentence). */
const CARD_MODE_SIMPLE = "simple" as const;
const CARD_MODE_SEGMENTED = "segmented" as const;
type CardMode = typeof CARD_MODE_SIMPLE | typeof CARD_MODE_SEGMENTED;

const SEGMENTED_TYPES: { value: "word" | "sentence"; labelKey: string }[] = [
  { value: "word", labelKey: "community.editorCardTypeWord" },
  { value: "sentence", labelKey: "community.editorCardTypeSentence" },
];

function segmentsToFront(segments: CardSegment[] | undefined, isSentence: boolean): string {
  if (!segments?.length) return "";
  const text = segments.map((s) => s.segment).join(isSentence ? " " : "");
  return text;
}

/** Auto-parse particleId from segment text by matching known particles (e.g. 는 → 은_는). */
function inferParticleId(segment: string, languageId: string): string | undefined {
  if (!segment.trim()) return undefined;
  const data = getParticlesForLanguage(languageId);
  if (!data?.particles) return undefined;
  for (const p of data.particles) {
    const forms = p.form.split("/");
    if (forms.some((f) => f.trim() === segment) || p.form === segment) return p.id;
  }
  return undefined;
}

const EMPTY_CARD: Omit<Flashcard, "id"> = {
  front: "",
  back: "",
  type: "other",
};

function SortableCardItem({
  card,
  realIndex,
  isSelected,
  cardsLength,
  hasUnsavedChanges,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  placeholder,
  dragTitle,
  moveUpTitle,
  moveDownTitle,
  duplicateTitle,
  deleteTitle,
}: {
  card: Flashcard;
  realIndex: number;
  isSelected: boolean;
  cardsLength: number;
  hasUnsavedChanges?: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  placeholder: string;
  dragTitle: string;
  moveUpTitle: string;
  moveDownTitle: string;
  duplicateTitle: string;
  deleteTitle: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-lg border px-2 py-2 transition ${
          isSelected
            ? "border-accent bg-accent-muted"
            : "border-transparent hover:bg-surface-muted"
        } ${isDragging ? "opacity-50" : ""}`}
      >
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-secondary active:cursor-grabbing"
          title={dragTitle}
          aria-label={dragTitle}
        >
          <Icon name="gripVertical" size={16} />
        </span>
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left text-sm"
        >
          {isSelected && hasUnsavedChanges && (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-error"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            />
          )}
          <span className="truncate">
            <span className="text-text-muted">{realIndex + 1}.</span>{" "}
            {card.front || placeholder}
          </span>
        </button>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={realIndex === 0}
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted disabled:opacity-30"
            title={moveUpTitle}
          >
            <Icon name="chevronUp" size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={realIndex === cardsLength - 1}
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted disabled:opacity-30"
            title={moveDownTitle}
          >
            <Icon name="chevronDown" size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted"
            title={duplicateTitle}
          >
            <Icon name="copy" size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-0.5 text-destructive hover:bg-destructive/10"
            title={deleteTitle}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}

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
  const { decks: decksApi, stories: storiesApi } = useApi();

  const [deckId, setDeckId] = useState<string | null>(routeDeckId ?? null);
  const [name, setName] = useState("");
  const [languageId, setLanguageId] = useState(language?.id ?? "ko");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [defaultEase, setDefaultEase] = useState<string>("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewReviewMode, setPreviewReviewMode] = useState<ReviewMode>("word-first");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [showDeckSettings, setShowDeckSettings] = useState(false);
  const [companionStory, setCompanionStory] = useState<{ id: string; title: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setDeckId(routeDeckId ?? null);
    if (!routeDeckId) {
      setLoadError(null);
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

  useEffect(() => {
    if (!deckId || deckId === "new" || !decksApi) return;
    decksApi
      .getDeck(deckId)
      .then((deck) => {
        setName(deck.name);
        setLanguageId(deck.languageId);
        setDescription(deck.description ?? "");
        setImage(deck.image ?? "");
        setDefaultEase(
          deck.defaultEase != null ? String(deck.defaultEase) : ""
        );
        const loadedCards = (deck.cards ?? []) as Flashcard[];
        setCards(loadedCards);
        setLoadError(null);
        const cardId = returnState?.cardId;
        if (cardId && loadedCards.length > 0) {
          const idx = loadedCards.findIndex((c) => c.id === cardId);
          if (idx >= 0) setSelectedIndex(idx);
          const cur = (window.history.state ?? {}) as Record<string, unknown>;
          const { cardId: _, ...rest } = cur;
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
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load deck");
      });
  }, [deckId, decksApi, storiesApi, returnState?.cardId]);

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

  const selectedCard = selectedIndex != null ? cards[selectedIndex] : null;

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

  const addCard = useCallback(() => {
    const newCard: Flashcard = { ...EMPTY_CARD, id: generateId() };
    setCards((prev) => [...prev, newCard]);
    setSelectedIndex(cards.length);
    setHasUnsavedChanges(true);
  }, [cards.length]);

  const updateCard = useCallback((index: number, updates: Partial<Flashcard>) => {
    setCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  const deleteCard = useCallback((index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((prev) => {
      if (prev == null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setHasUnsavedChanges(true);
  }, []);

  const duplicateCard = useCallback((index: number) => {
    const card = cards[index];
    const newCard: Flashcard = { ...card, id: generateId() };
    setCards((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newCard);
      return next;
    });
    setSelectedIndex(index + 1);
    setHasUnsavedChanges(true);
  }, [cards]);

  const moveCard = useCallback((from: number, dir: number) => {
    const to = from + dir;
    if (to < 0 || to >= cards.length) return;
    setCards((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setSelectedIndex(to);
    setHasUnsavedChanges(true);
  }, [cards.length]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      setCards((prev) => arrayMove(prev, oldIndex, newIndex));
      setSelectedIndex(newIndex);
      setHasUnsavedChanges(true);
    },
    [cards],
  );

  /** Any card with a blank front blocks the deck-level save. */
  const hasInvalidCards = useMemo(
    () => cards.some((c) => !c.front.trim()),
    [cards],
  );

  const handleSaveDraft = async () => {
    if (!name.trim()) return;
    if (hasInvalidCards) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (deckId) {
        const res = await decksApi.updateDeck(deckId, payload);
        setDeckId(res.id);
      } else {
        const res = await decksApi.createDeck(payload);
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
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...buildPayload(), status: "published" as const };
      if (deckId) {
        await decksApi.updateDeck(deckId, payload);
        navigate(langPath("community/contribute"), { state: { bypassBlocker: true } });
      } else {
        const res = await decksApi.createDeck(payload);
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
    } finally {
      setSaving(false);
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

  function buildPayload() {
    const base = {
      languageId,
      name: name.trim(),
      description: description.trim() || undefined,
      image: image.trim() || undefined,
      defaultEase: parseDefaultEase(defaultEase),
      status: "draft" as const,
      cards: cards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        type: c.type,
        note: c.note,
        image: c.image,
        reasoning: c.reasoning,
        definition: c.definition,
        context: c.context,
        parts: c.type === "word" ? c.parts : undefined,
        words: c.type === "sentence" ? c.words : undefined,
      })),
    };
    if (!deckId && returnState?.isCompanionDeck) {
      return { ...base, companionToStoryId: "pending" as const };
    }
    return base;
  }

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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("community.breadcrumbCommunity"), to: langPath("community") },
    {
      label: t("community.breadcrumbMyDecks"),
      to: langPath("community/library?tab=mine"),
    },
    { label: name.trim() || t("community.deckCreateTitle") },
  ];

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
        <div className="flex items-center gap-4 border-b border-border bg-surface-muted px-4 py-2">
            <div>
              <label className="mr-2 text-xs text-text-muted">{t("forum.language")}</label>
              <select
                value={languageId}
                onChange={(e) => {
                  setLanguageId(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
              >
                {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="mr-2 text-xs text-text-muted">
                {t("community.contributeDescription")}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder={t("community.contributeDescriptionPlaceholder")}
                className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
              />
            </div>
            <div className="min-w-[200px]">
              <label className="mr-2 text-xs text-text-muted">
                {t("community.editorDeckImageUrl")}
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => {
                  setImage(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder={t("community.editorDeckImageUrlPlaceholder")}
                className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="mr-2 text-xs text-text-muted">
                {t("community.editorDefaultEase")}
              </label>
              <input
                type="number"
                min={1.3}
                max={3}
                step={0.1}
                value={defaultEase}
                onChange={(e) => {
                  setDefaultEase(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder={t("community.editorDefaultEasePlaceholder")}
                className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
              />
            </div>
          </div>
        )}

      {/* Three-pane layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Card Navigator */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface-muted">
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              placeholder={t("community.editorSearchCards")}
              className="w-full rounded border border-border px-2 py-1.5 text-sm bg-surface text-text-primary"
            />
            <button
              type="button"
              onClick={addCard}
              className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              + {t("community.editorAddCard")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cards.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                {t("community.editorNoCards")}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredCards.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-1">
                    {filteredCards.map((card) => {
                      const realIndex = cards.indexOf(card);
                      return (
                        <SortableCardItem
                          key={card.id}
                          card={card}
                          realIndex={realIndex}
                          isSelected={selectedIndex === realIndex}
                          cardsLength={cards.length}
                          hasUnsavedChanges={hasUnsavedChanges}
                          onSelect={() => setSelectedIndex(realIndex)}
                          onMoveUp={() => moveCard(realIndex, -1)}
                          onMoveDown={() => moveCard(realIndex, 1)}
                          onDuplicate={() => duplicateCard(realIndex)}
                          onDelete={() => deleteCard(realIndex)}
                          placeholder={t("community.editorCardFrontPlaceholder")}
                          dragTitle={t("community.editorDragToReorder")}
                          moveUpTitle={t("community.editorMoveUp")}
                          moveDownTitle={t("community.editorMoveDown")}
                          duplicateTitle={t("community.editorDuplicateCard")}
                          deleteTitle={t("community.editorDeleteCard")}
                        />
                      );
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </aside>

        {/* Center: Card Preview (half width) */}
        <section className="flex min-w-0 flex-1 basis-0 flex-col border-r border-border bg-background p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-secondary">
              {t("community.editorLivePreview")}
            </h3>
            <select
              value={previewReviewMode}
              onChange={(e) => setPreviewReviewMode(e.target.value as ReviewMode)}
              className="rounded border border-border px-2 py-1 text-xs bg-surface text-text-primary"
              title={t("flashcards.reviewModeLabel")}
            >
              {REVIEW_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(REVIEW_MODE_LABELS[m])}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            {selectedCard ? (
              <div className="w-full max-w-[640px]">
                <CardPreview
                  card={selectedCard}
                  languageId={languageId}
                  compact={false}
                  reviewMode={previewReviewMode}
                  infoPosition="side"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-text-muted">
                  {cards.length === 0
                    ? t("community.editorAddFirstCard")
                    : t("community.editorSelectCardToPreview")}
                </p>
                {cards.length === 0 && (
                  <button
                    type="button"
                    onClick={addCard}
                    className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
                  >
                    {t("community.editorAddFirstCard")}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right: Card Editor (half width) */}
        <aside className="flex min-w-0 flex-1 basis-0 flex-col overflow-y-auto bg-surface p-6">
          {selectedCard ? (
            <ActiveCardEditor
              key={selectedCard.id}
              card={selectedCard}
              index={selectedIndex!}
              languageId={languageId}
              onUpdate={(u) => updateCard(selectedIndex!, u)}
              t={t}
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

const inputClass =
  "min-w-0 w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary";
const textareaClass = inputClass + " min-h-[80px] resize-y";

function ActiveCardEditor({
  card,
  index,
  languageId,
  onUpdate,
  t,
}: {
  card: Flashcard;
  index: number;
  languageId: string;
  onUpdate: (u: Partial<Flashcard>) => void;
  t: (key: string) => string;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [frontTouched, setFrontTouched] = useState(false);
  const [backTouched, setBackTouched] = useState(false);

  useEffect(() => {
    setFrontTouched(false);
    setBackTouched(false);
  }, [index]);

  const isSimple = card.type === "other";
  const mode: CardMode = isSimple ? CARD_MODE_SIMPLE : CARD_MODE_SEGMENTED;

  // Switching simple<->segmented drops parts/words, so confirm first when the
  // card has content. pendingMode holds the requested mode while the confirm
  // modal is open.
  const [pendingMode, setPendingMode] = useState<CardMode | null>(null);

  const applyMode = (m: CardMode) => {
    if (m === CARD_MODE_SIMPLE) {
      onUpdate({ type: "other", front: card.front || "" } as Partial<Flashcard>);
    } else {
      onUpdate({
        type: "word",
        parts: card.front ? [{ segment: card.front }] : undefined,
        front: card.front || "",
      } as Partial<Flashcard>);
    }
  };

  const setMode = (m: CardMode) => {
    const partsLen = "parts" in card ? card.parts?.length ?? 0 : 0;
    const wordsLen = "words" in card ? card.words?.length ?? 0 : 0;
    const hasContent = partsLen > 0 || wordsLen > 0 || !!card.front.trim();
    if (hasContent) {
      setPendingMode(m);
      return;
    }
    applyMode(m);
  };

  const setSegmentedType = (type: "word" | "sentence") => {
    const parts = "parts" in card ? card.parts : undefined;
    const words = "words" in card ? card.words : undefined;
    const existing = type === "word" ? parts : words;
    const reused = (type === "word" ? words : parts) ?? existing;
    const segments = reused?.length ? reused : [{ segment: "" }];
    const front = segmentsToFront(segments, type === "sentence");
    onUpdate({
      type,
      front,
      parts: type === "word" ? segments : undefined,
      words: type === "sentence" ? segments : undefined,
    });
  };

  const frontInvalid = frontTouched && !card.front.trim();
  const backInvalid = backTouched && !card.back.trim();

  const handleSegmentsChange = (segments: CardSegment[]) => {
    const isSentence = card.type === "sentence";
    const front = segmentsToFront(segments, isSentence);
    const updates =
      card.type === "word"
        ? ({ parts: segments, front } as Partial<Flashcard>)
        : ({ words: segments, front } as Partial<Flashcard>);
    onUpdate(updates);
  };

  const hasAdvanced =
    (card.reasoning ?? "") !== "" ||
    (card.definition ?? "") !== "" ||
    (card.context ?? "") !== "";

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {pendingMode !== null ? (
        <ConfirmModal
          title={t("community.editorModeSwitchTitle")}
          message={t("community.editorModeSwitchWarning")}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("community.editorModeSwitchConfirm")}
          danger
          onConfirm={() => {
            applyMode(pendingMode);
            setPendingMode(null);
          }}
          onCancel={() => setPendingMode(null)}
        />
      ) : null}
      {/* Card mode: Simple | Segmented */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          {t("community.editorCardMode")}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="cardMode"
              checked={mode === CARD_MODE_SIMPLE}
              onChange={() => setMode(CARD_MODE_SIMPLE)}
              className="rounded border-border"
            />
            {t("community.editorCardModeSimple")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="cardMode"
              checked={mode === CARD_MODE_SEGMENTED}
              onChange={() => setMode(CARD_MODE_SEGMENTED)}
              className="rounded border-border"
            />
            {t("community.editorCardModeSegmented")}
          </label>
        </div>
      </div>

      {isSimple ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              {t("community.editorFront")}
            </label>
            <textarea
              value={card.front}
              onChange={(e) => onUpdate({ front: e.target.value })}
              onBlur={() => setFrontTouched(true)}
              placeholder={t("community.editorCardFrontPlaceholder")}
              className={
                frontInvalid
                  ? textareaClass.replace("border-border", "border-error")
                  : textareaClass
              }
              rows={2}
              aria-invalid={frontInvalid || undefined}
            />
            {frontInvalid && (
              <p className="mt-1 text-xs text-error">
                {t("community.editorRequiredField")}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              {t("community.editorBack")}
            </label>
            <textarea
              value={card.back}
              onChange={(e) => onUpdate({ back: e.target.value })}
              onBlur={() => setBackTouched(true)}
              placeholder={t("community.editorCardBackPlaceholder")}
              className={
                backInvalid
                  ? textareaClass.replace("border-border", "border-error")
                  : textareaClass
              }
              rows={2}
              aria-invalid={backInvalid || undefined}
            />
            {backInvalid && (
              <p className="mt-1 text-xs text-error">
                {t("community.editorRequiredField")}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm text-text-muted">
              {t("community.editorCardType")}
            </label>
            <select
              value={card.type}
              onChange={(e) => setSegmentedType(e.target.value as "word" | "sentence")}
              className={inputClass}
            >
              {SEGMENTED_TYPES.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
          <PartsEditor
            segments={card.type === "word" ? card.parts : card.words}
            languageId={languageId}
            onChange={handleSegmentsChange}
            t={t}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              {t("community.editorBack")}
            </label>
            <textarea
              value={card.back}
              onChange={(e) => onUpdate({ back: e.target.value })}
              onBlur={() => setBackTouched(true)}
              placeholder={t("community.editorCardBackPlaceholder")}
              className={
                backInvalid
                  ? textareaClass.replace("border-border", "border-error")
                  : textareaClass
              }
              rows={2}
              aria-invalid={backInvalid || undefined}
            />
            {backInvalid && (
              <p className="mt-1 text-xs text-error">
                {t("community.editorRequiredField")}
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm text-text-muted">
          {t("community.editorNote")}
        </label>
        <textarea
          value={card.note ?? ""}
          onChange={(e) => onUpdate({ note: e.target.value || undefined })}
          placeholder={t("community.editorNotePlaceholder")}
          className={textareaClass}
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-muted">
          {t("community.editorImageUrl")}
        </label>
        <input
          type="url"
          value={card.image ?? ""}
          onChange={(e) => onUpdate({ image: e.target.value || undefined })}
          placeholder={t("community.editorImageUrlPlaceholder")}
          className={inputClass}
        />
      </div>

      {/* Collapsible Advanced */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-text-secondary"
        >
          {t("community.editorAdvanced")}
          {hasAdvanced && (
            <span className="rounded bg-surface-muted px-1.5 text-xs">1</span>
          )}
          <Icon name="chevronDown" size={14} className={`text-text-muted transition ${advancedOpen ? "" : "-rotate-90"}`} />
        </button>
        {advancedOpen && (
          <div className="space-y-4 border-t border-border p-3">
            <div>
              <label className="mb-1 block text-sm text-text-muted">
                {t("community.editorReasoning")}
              </label>
              <textarea
                value={card.reasoning ?? ""}
                onChange={(e) => onUpdate({ reasoning: e.target.value || undefined })}
                placeholder={t("community.editorReasoningPlaceholder")}
                className={textareaClass}
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-muted">
                {t("community.editorDefinition")}
              </label>
              <textarea
                value={card.definition ?? ""}
                onChange={(e) => onUpdate({ definition: e.target.value || undefined })}
                placeholder={t("community.editorDefinition")}
                className={textareaClass}
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-muted">
                {t("community.editorContext")}
              </label>
              <textarea
                value={card.context ?? ""}
                onChange={(e) => onUpdate({ context: e.target.value || undefined })}
                placeholder={t("community.editorContext")}
                className={textareaClass}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const segmentInputClass =
  "min-w-0 flex-1 rounded-lg border border-border px-3 py-2 bg-surface text-text-primary";

function PartsEditor({
  segments,
  languageId,
  onChange,
  t,
}: {
  segments?: CardSegment[];
  languageId: string;
  onChange: (segments: CardSegment[]) => void;
  t: (key: string) => string;
}) {
  const items = segments ?? [];
  // Stable per-row keys: CardSegment has no id, so index-as-key would reuse the
  // wrong input rows (focus/IME loss) when a middle part is removed. Keys are
  // seeded from the initial segments and tracked through add/remove. This
  // PartsEditor remounts per card (ActiveCardEditor is keyed by card id), so the
  // seed re-runs for each card and can't drift out of sync with `items`.
  const keySeq = useRef(0);
  const [rowKeys, setRowKeys] = useState<number[]>(() =>
    items.map(() => keySeq.current++),
  );
  const addPart = () => {
    setRowKeys((k) => [...k, keySeq.current++]);
    onChange([...items, { segment: "" }]);
  };
  const updatePart = (i: number, u: Partial<CardSegment>) => {
    const next = [...items];
    next[i] = { ...next[i], ...u };
    onChange(next);
  };
  const handleSegmentChange = (i: number, segment: string) => {
    const particleId = inferParticleId(segment, languageId);
    updatePart(i, { segment, particleId });
  };
  const removePart = (i: number) => {
    setRowKeys((k) => k.filter((_, idx) => idx !== i));
    onChange(items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-text-muted">
          {t("community.editorParts")}
        </label>
        <button
          type="button"
          onClick={addPart}
          className="shrink-0 text-sm font-medium text-accent hover:text-accent-hover"
        >
          + {t("community.editorAddPart")}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={rowKeys[i] ?? i} className="flex min-w-0 gap-2">
            <input
              type="text"
              value={item.segment}
              onChange={(e) => handleSegmentChange(i, e.target.value)}
              placeholder={t("community.editorSegmentPlaceholder")}
              className={segmentInputClass}
            />
            <input
              type="text"
              value={item.meaning ?? ""}
              onChange={(e) => updatePart(i, { meaning: e.target.value || undefined })}
              placeholder={t("community.editorMeaningPlaceholder")}
              className={segmentInputClass}
            />
            <button
              type="button"
              onClick={() => removePart(i)}
              className="shrink-0 rounded-lg p-2 text-destructive hover:bg-destructive/10"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
