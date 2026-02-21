import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useBlocker } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
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
import type {
  Flashcard,
  FlashcardType,
  CardSegment,
} from "@/features/flashcards/data/types";

function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse default ease from editor string; returns undefined if empty or invalid (backend uses 2.5). */
function parseDefaultEase(s: string): number | undefined {
  const n = Number(s.trim());
  if (s.trim() === "" || Number.isNaN(n)) return undefined;
  return Math.max(1.3, Math.min(3, n));
}

const CARD_TYPES: { value: FlashcardType; labelKey: string }[] = [
  { value: "word", labelKey: "community.editorCardTypeWord" },
  { value: "sentence", labelKey: "community.editorCardTypeSentence" },
  { value: "other", labelKey: "community.editorCardTypeOther" },
];

const EMPTY_CARD: Omit<Flashcard, "id"> = {
  front: "",
  back: "",
  type: "word",
};

export function DeckEditor() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { deckId: routeDeckId } = useParams<{ deckId?: string }>();
  const { language } = useLanguage();
  const { decks: decksApi } = useApi();

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
    }
  }, [routeDeckId, language?.id]);

  useEffect(() => {
    if (!deckId || !decksApi) return;
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
        setCards((deck.cards ?? []) as Flashcard[]);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load deck");
      });
  }, [deckId, decksApi]);

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

  const handleSaveDraft = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (deckId) {
        const res = await decksApi.updateDeck(deckId, payload);
        setDeckId(res.id);
      } else {
        const res = await decksApi.createDeck(payload);
        setDeckId(res.id);
        navigate(langPath(`studio/decks/${res.id}`), { replace: true, state: { bypassBlocker: true } });
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Save draft failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...buildPayload(), status: "published" as const };
      if (deckId) await decksApi.updateDeck(deckId, payload);
      else {
        const res = await decksApi.createDeck(payload);
        setDeckId(res.id);
      }
      navigate(langPath("community/contribute"), { state: { bypassBlocker: true } });
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSaving(false);
    }
  };

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
    return {
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
        parts: c.type === "word" ? c.parts : undefined,
        words: c.type === "sentence" ? c.words : undefined,
        definition: c.type === "other" ? c.definition : undefined,
        context: c.type === "other" ? c.context : undefined,
      })),
    };
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">{loadError}</p>
        <Link
          to={langPath("community/contribute")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-base font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    />
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-col">
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
        canSave={!!name.trim()}
        canSubmit={!!name.trim() && cards.length > 0}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onToggleDeckSettings={() => setShowDeckSettings((s) => !s)}
        showDeckSettings={showDeckSettings}
        nameInput={nameInput}
      />
      {showDeckSettings && (
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700/50">
            <div>
              <label className="mr-2 text-xs text-gray-500">{t("forum.language")}</label>
              <select
                value={languageId}
                onChange={(e) => {
                  setLanguageId(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="mr-2 text-xs text-gray-500">
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
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="min-w-[200px]">
              <label className="mr-2 text-xs text-gray-500">
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
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="mr-2 text-xs text-gray-500">
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
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      {showDeckSettings && (
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700/50">
            <div>
              <label className="mr-2 text-xs text-gray-500">{t("forum.language")}</label>
              <select
                value={languageId}
                onChange={(e) => {
                  setLanguageId(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="mr-2 text-xs text-gray-500">
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
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="min-w-[200px]">
              <label className="mr-2 text-xs text-gray-500">
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
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="mr-2 text-xs text-gray-500">
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
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Three-pane layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Card Navigator */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="border-b border-gray-200 p-2 dark:border-gray-700">
            <input
              type="search"
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              placeholder={t("community.editorSearchCards")}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={addCard}
              className="mt-2 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              + {t("community.editorAddCard")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cards.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("community.editorNoCards")}
              </p>
            ) : (
              <ul className="space-y-1">
                {filteredCards.map((card) => {
                  const realIndex = cards.indexOf(card);
                  const isSelected = selectedIndex === realIndex;
                  return (
                    <li key={card.id}>
                      <div
                        className={`group flex items-center gap-1 rounded-lg border px-2 py-2 transition ${
                          isSelected
                            ? "border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
                            : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedIndex(realIndex)}
                          className="min-w-0 flex-1 truncate text-left text-sm"
                        >
                          <span className="text-gray-500">{realIndex + 1}.</span>{" "}
                          {card.front || t("community.editorCardFrontPlaceholder")}
                        </button>
                        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveCard(realIndex, -1);
                            }}
                            disabled={realIndex === 0}
                            className="rounded p-0.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-600"
                            title={t("community.editorMoveUp")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveCard(realIndex, 1);
                            }}
                            disabled={realIndex === cards.length - 1}
                            className="rounded p-0.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-600"
                            title={t("community.editorMoveDown")}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateCard(realIndex);
                            }}
                            className="rounded p-0.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title={t("community.editorDuplicateCard")}
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCard(realIndex);
                            }}
                            className="rounded p-0.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            title={t("community.editorDeleteCard")}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Center: Active Card Editor */}
        <main className="min-w-0 flex-1 overflow-y-auto border-r border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {selectedCard ? (
            <ActiveCardEditor
              card={selectedCard}
              index={selectedIndex!}
              onUpdate={(u) => updateCard(selectedIndex!, u)}
              t={t}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {cards.length === 0
                  ? t("community.editorAddFirstCard")
                  : t("community.editorSelectCardToPreview")}
              </p>
              {cards.length === 0 && (
                <button
                  type="button"
                  onClick={addCard}
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {t("community.editorAddFirstCard")}
                </button>
              )}
            </div>
          )}
        </main>

        {/* Right: Preview */}
        <aside className="flex w-80 shrink-0 flex-col bg-gray-50/50 p-4 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("community.editorLivePreview")}
            </h3>
            <select
              value={previewReviewMode}
              onChange={(e) => setPreviewReviewMode(e.target.value as ReviewMode)}
              className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              <div className="w-full max-w-sm">
                <CardPreview
                  card={selectedCard}
                  languageId={languageId}
                  compact={false}
                  reviewMode={previewReviewMode}
                />
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("community.editorSelectCardToPreview")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActiveCardEditor({
  card,
  onUpdate,
  t,
}: {
  card: Flashcard;
  index: number;
  onUpdate: (u: Partial<Flashcard>) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("community.editorFront")}
        </label>
        <textarea
          value={card.front}
          onChange={(e) => onUpdate({ front: e.target.value })}
          placeholder="안녕하세요"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("community.editorBack")}
        </label>
        <textarea
          value={card.back}
          onChange={(e) => onUpdate({ back: e.target.value })}
          placeholder="Hello"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
            {t("community.editorCardType")}
          </label>
          <select
            value={card.type}
            onChange={(e) =>
              onUpdate({
                type: e.target.value as FlashcardType,
                parts: undefined,
                words: undefined,
                definition: undefined,
                context: undefined,
              })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {CARD_TYPES.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
            {t("community.editorNote")}
          </label>
          <input
            type="text"
            value={card.note ?? ""}
            onChange={(e) => onUpdate({ note: e.target.value || undefined })}
            placeholder={t("community.editorNotePlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
          {t("community.editorImageUrl")}
        </label>
        <input
          type="url"
          value={card.image ?? ""}
          onChange={(e) => onUpdate({ image: e.target.value || undefined })}
          placeholder={t("community.editorImageUrlPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
          {t("community.editorReasoning")}
        </label>
        <textarea
          value={card.reasoning ?? ""}
          onChange={(e) => onUpdate({ reasoning: e.target.value || undefined })}
          placeholder={t("community.editorReasoningPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
      {(card.type === "word" || card.type === "sentence") && (
        <PartsEditor
          segments={card.type === "word" ? card.parts : card.words}
          onChange={(segments) =>
            onUpdate(card.type === "word" ? { parts: segments } : { words: segments })
          }
          t={t}
        />
      )}
      {card.type === "other" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
              {t("community.editorDefinition")}
            </label>
            <input
              type="text"
              value={card.definition ?? ""}
              onChange={(e) => onUpdate({ definition: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
              {t("community.editorContext")}
            </label>
            <input
              type="text"
              value={card.context ?? ""}
              onChange={(e) => onUpdate({ context: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PartsEditor({
  segments,
  onChange,
  t,
}: {
  segments?: CardSegment[];
  onChange: (segments: CardSegment[]) => void;
  t: (key: string) => string;
}) {
  const items = segments ?? [];
  const addPart = () => onChange([...items, { segment: "" }]);
  const updatePart = (i: number, u: Partial<CardSegment>) => {
    const next = [...items];
    next[i] = { ...next[i], ...u };
    onChange(next);
  };
  const removePart = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          {t("community.editorParts")}
        </label>
        <button
          type="button"
          onClick={addPart}
          className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
        >
          + {t("community.editorAddPart")}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item.segment}
              onChange={(e) => updatePart(i, { segment: e.target.value })}
              placeholder={t("community.editorSegmentPlaceholder")}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              value={item.meaning ?? ""}
              onChange={(e) => updatePart(i, { meaning: e.target.value || undefined })}
              placeholder={t("community.editorMeaningPlaceholder")}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              value={item.particleId ?? ""}
              onChange={(e) => updatePart(i, { particleId: e.target.value || undefined })}
              placeholder={t("community.editorParticlePlaceholder")}
              className="w-24 rounded-lg border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => removePart(i)}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
