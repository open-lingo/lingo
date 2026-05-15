import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import { StudioHeader } from "@/features/studio/StudioHeader";
import {
  loadStoryDraft,
  saveStoryDraft,
  clearStoryDraft,
} from "./storyDraftStorage";
import { getCardIdsFromBody } from "./parseStoryEmbeds";
import { CardPicker } from "./CardPicker";
import { CardQuickEditor } from "./CardQuickEditor";
import { StoryPreview } from "./StoryPreview";
import type { DeckCard } from "@/shared/api/decks";

export function StoryEditor() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const location = useLocation();
  const { storyId } = useParams<{ storyId: string }>();
  const { language } = useLanguage();
  const { decks: decksApi, stories: storiesApi } = useApi();
  const showToast = useToast().showToast;
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [languageId, setLanguageId] = useState(language?.id ?? "ko");
  const [body, setBody] = useState("");
  const [companionDeckId, setCompanionDeckId] = useState<string | null>(null);
  const [companionDeck, setCompanionDeck] = useState<{ name: string; cardCount: number } | null>(null);
  const [companionCards, setCompanionCards] = useState<DeckCard[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showCardEditor, setShowCardEditor] = useState(false);
  const [cardEditorInitialFront, setCardEditorInitialFront] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [linkDeckOpen, setLinkDeckOpen] = useState(false);
  const [myDecks, setMyDecks] = useState<{ id: string; name: string; cardCount: number }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing story or restore draft
  useEffect(() => {
    if (storyId && storiesApi) {
      storiesApi
        .getStory(storyId)
        .then((story) => {
          setTitle(story.title);
          setDescription(story.description ?? "");
          setLanguageId(story.languageId);
          setBody(story.body ?? "");
          setCompanionDeckId(story.companionDeckId);
          setCompanionDeck(null);
          setLoadError(null);
        })
        .catch(() => setLoadError("Story not found"));
    } else {
      const draft = loadStoryDraft();
      setTitle(draft.title);
      setDescription(draft.description);
      setLanguageId(draft.languageId);
      setBody(draft.body);
      setCompanionDeckId(draft.companionDeckId);
      setCompanionDeck(draft.companionDeck);
    }
  }, [storyId, storiesApi]);

  // When returning from deck creation, link the new deck
  useEffect(() => {
    const state = location.state as {
      createdDeckId?: string;
      createdDeckName?: string;
      createdDeckCardCount?: number;
    } | null;
    if (state?.createdDeckId) {
      setCompanionDeckId(state.createdDeckId);
      setCompanionDeck({
        name: state.createdDeckName ?? "Deck",
        cardCount: state.createdDeckCardCount ?? 0,
      });
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  // Fetch companion deck cards
  useEffect(() => {
    if (!companionDeckId || !decksApi) return;
    decksApi
      .getDeck(companionDeckId)
      .then((deck) => {
        setCompanionCards(deck.cards ?? []);
        setCompanionDeck({ name: deck.name, cardCount: deck.cards?.length ?? 0 });
      })
      .catch(() => setCompanionCards([]));
  }, [companionDeckId, decksApi]);

  // Fetch user decks for link existing
  useEffect(() => {
    if (!linkDeckOpen || !decksApi) return;
    decksApi
      .listMyDecks()
      .then((decks) =>
        setMyDecks(
          decks.map((d) => ({ id: d.id, name: d.name, cardCount: d.cards?.length ?? 0 }))
        )
      )
      .catch(() => setMyDecks([]));
  }, [linkDeckOpen, decksApi]);

  // Escape closes CardPicker
  useEffect(() => {
    if (!showCardPicker) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCardPicker(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCardPicker]);

  const canSave = !!title.trim();
  const canSubmit = !!title.trim() && !!body.trim() && !!companionDeckId;

  const persistDraft = useCallback(() => {
    saveStoryDraft({
      title,
      description,
      languageId,
      body,
      companionDeckId,
      companionDeck,
    });
  }, [title, description, languageId, body, companionDeckId, companionDeck]);

  const handleSaveDraft = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (storyId && companionDeckId && storiesApi) {
        await storiesApi.updateStory(storyId, {
          title: title.trim(),
          description: description.trim() || undefined,
          languageId,
          companionDeckId,
          body,
        });
        setHasUnsavedChanges(false);
        showToast(t("community.storyEditorDraftSaved", "Draft saved"), "success");
      } else {
        persistDraft();
        setHasUnsavedChanges(false);
        showToast(t("community.storyEditorDraftSaved", "Draft saved"), "success");
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !companionDeckId) return;
    setSaving(true);
    try {
      if (storyId && storiesApi) {
        await storiesApi.updateStory(storyId, {
          title: title.trim(),
          description: description.trim() || undefined,
          languageId,
          companionDeckId,
          body,
        });
        clearStoryDraft();
        navigate(langPath("community/contribute"));
      } else if (storiesApi) {
        await storiesApi.createStory({
          languageId,
          title: title.trim(),
          description: description.trim() || undefined,
          companionDeckId,
          body,
        });
        clearStoryDraft();
        navigate(langPath("community/contribute"), { state: { bypassBlocker: true } });
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Submit failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDeck = () => {
    persistDraft();
    showToast(t("community.storyEditorDraftSaved", "Draft saved"), "success");
    navigate(langPath("studio/decks/new"), {
      state: {
        returnTo: "story-editor",
        returnPath: storyId
          ? langPath(`community/contribute/create/story/${storyId}`)
          : langPath("community/contribute/create/story"),
        isCompanionDeck: true,
        storyId: storyId ?? undefined,
        storyTitle: title.trim() || undefined,
      },
    });
  };

  const handleLinkDeck = (deckId: string, deckName: string, cardCount: number) => {
    setCompanionDeckId(deckId);
    setCompanionDeck({ name: deckName, cardCount });
    setLinkDeckOpen(false);
  };

  const getSelection = useCallback(() => {
    const ta = bodyRef.current;
    if (!ta) return null;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return null;
    return { text: body.slice(start, end), start, end };
  }, [body]);

  const insertEmbed = useCallback((cardId: string, displayText: string) => {
    const sel = getSelection();
    const ta = bodyRef.current;
    if (!ta) return;
    const embed = `[card:${cardId}]${displayText}[/card]`;
    let newBody: string;
    let newCursor: number;
    if (sel) {
      newBody = body.slice(0, sel.start) + embed + body.slice(sel.end);
      newCursor = sel.start + embed.length;
    } else {
      newBody = body + embed;
      newCursor = newBody.length;
    }
    setBody(newBody);
    setHasUnsavedChanges(true);
    setShowCardPicker(false);
    setShowCardEditor(false);
    ta.focus();
    requestAnimationFrame(() => {
      ta.setSelectionRange(newCursor, newCursor);
    });
  }, [body, getSelection]);

  const handleLinkToCard = () => {
    if (!companionDeckId) {
      showToast(t("community.storyEditorDeckRequired"), "error");
      return;
    }
    const sel = getSelection();
    if (!sel?.text?.trim()) {
      showToast(t("community.storyEditorSelectTextFirst", "Select a word or phrase first"), "error");
      return;
    }
    setCardEditorInitialFront(sel.text);
    setShowCardPicker(true);
  };

  const handlePickCard = (cardId: string, displayText: string) => {
    insertEmbed(cardId, displayText);
  };

  const handleCreateNewCard = (initialFront: string) => {
    setEditingCardId(null);
    setCardEditorInitialFront(initialFront);
    setShowCardPicker(false);
    setShowCardEditor(true);
  };

  const handleEditCard = (cardId: string) => {
    setEditingCardId(cardId);
    setCardEditorInitialFront("");
    setShowCardEditor(true);
  };

  const handleSaveCard = async (
    card: Pick<DeckCard, "id" | "front" | "back" | "type" | "note" | "image">
  ) => {
    if (!companionDeckId || !decksApi) return;
    try {
      const deck = await decksApi.getDeck(companionDeckId);
      const cards = deck.cards ?? [];
      const idx = cards.findIndex((c) => c.id === card.id);
      const updated =
        idx >= 0
          ? cards.map((c, i) => (i === idx ? { ...c, ...card } : c))
          : [...cards, card];
      await decksApi.updateDeck(companionDeckId, { cards: updated });
      setCompanionCards(updated);
      setCompanionDeck((prev) =>
        prev ? { ...prev, cardCount: updated.length } : { name: "Deck", cardCount: updated.length }
      );
      if (idx < 0) {
        const sel = getSelection();
        insertEmbed(card.id, sel?.text || card.front);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save card", "error");
    }
    setShowCardEditor(false);
    setEditingCardId(null);
  };

  const cardIdsInBody = getCardIdsFromBody(body);
  const cardsById = Object.fromEntries(companionCards.map((c) => [c.id, c]));
  const brokenCardIds = cardIdsInBody.filter((id) => !cardsById[id]);

  if (loadError) {
    return (
      <div className="space-y-6 p-6">
        <p className="text-red-600 dark:text-red-400">{loadError}</p>
        <a
          href={langPath("community/contribute")}
          className="text-sm text-green-600 hover:underline dark:text-green-400"
        >
          {t("community.contribute")}
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <StudioHeader
        deckName={title || t("community.storyEditorTitlePlaceholder")}
        status="draft"
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        canSave={canSave}
        canSubmit={canSubmit}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        nameInput={
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder={t("community.storyEditorTitlePlaceholder", "Untitled story")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-base font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        }
      />

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-gray-50/50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
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
        <div className="min-w-[200px] flex-1">
          <label className="mr-2 text-xs text-gray-500">{t("community.contributeDescription")}</label>
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
      </div>

      {/* Three-pane layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Companion deck panel */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("community.storyEditorCompanionDeck", "Companion deck")}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!companionDeckId ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("community.storyEditorDeckRequired", "Link or create a deck to add vocab links.")}
                </p>
                <button
                  type="button"
                  onClick={handleCreateDeck}
                  className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-green-600 dark:hover:text-green-400"
                >
                  + {t("community.storyEditorCreateDeck", "Create deck")}
                </button>
                <button
                  type="button"
                  onClick={() => setLinkDeckOpen(true)}
                  className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-green-600 dark:hover:text-green-400"
                >
                  {t("community.storyEditorLinkDeck", "Link existing")}
                </button>
                {linkDeckOpen && (
                  <div className="space-y-1 border-t border-gray-200 pt-2 dark:border-gray-700">
                    {myDecks.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleLinkDeck(d.id, d.name, d.cardCount)}
                        className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {d.name} ({d.cardCount})
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLinkDeckOpen(false)}
                      className="text-xs text-gray-500"
                    >
                      {t("forum.cancel")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {companionDeck?.name ?? "Deck"} ({companionDeck?.cardCount ?? 0} cards)
                </p>
                {companionCards.slice(0, 15).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleEditCard(c.id)}
                    className="block w-full truncate rounded px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                    title={c.back}
                  >
                    {c.front} → {c.back}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Body editor */}
        <main className="relative min-w-0 flex-1 overflow-y-auto border-r border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("community.storyEditorBodyHint", "Write your story. Use [card:id]word[/card] to link vocab.")}
            </span>
            <div className="flex gap-2">
              {companionDeckId && (
                <button
                  type="button"
                  onClick={handleLinkToCard}
                  className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  {t("community.storyEditorLinkToCard", "Link to card")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {showPreview ? t("common.hidePreview") : t("common.showPreview")}
              </button>
            </div>
          </div>
          {showCardPicker && (
            <>
              <div
                role="presentation"
                className="fixed inset-0 z-10 bg-transparent"
                onClick={() => setShowCardPicker(false)}
              />
              <div className="absolute left-6 top-24 z-20">
                <CardPicker
                cards={companionCards}
                selectedText={getSelection()?.text ?? ""}
                onPick={handlePickCard}
                onCreateNew={handleCreateNewCard}
                onClose={() => setShowCardPicker(false)}
                anchorRef={bodyRef}
              />
              </div>
            </>
          )}
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder={t("community.storyEditorBodyPlaceholder", "Write your story here…")}
            className="min-h-[400px] w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-base leading-relaxed text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </main>

        {/* Right: Preview */}
        {showPreview && (
          <aside className="flex w-80 shrink-0 flex-col bg-gray-50/50 p-4 dark:bg-gray-800/50">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("community.editorLivePreview")}
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {body ? (
                <>
                  <StoryPreview
                    body={body}
                    cardsById={cardsById}
                    brokenCardIds={brokenCardIds}
                    onCardClick={handleEditCard}
                  />
                  {brokenCardIds.length > 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      {t("community.storyEditorBrokenRefs", "{{count}} broken card reference(s)", {
                        count: brokenCardIds.length,
                      })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("community.storyEditorPreviewEmpty")}
                </p>
              )}
            </div>
          </aside>
        )}
      </div>

      {showCardEditor && (
        <CardQuickEditor
          deckId={companionDeckId!}
          cardId={editingCardId}
          initialFront={cardEditorInitialFront}
          initialCard={editingCardId ? cardsById[editingCardId] ?? null : null}
          onSave={handleSaveCard}
          onCancel={() => {
            setShowCardEditor(false);
            setEditingCardId(null);
          }}
        />
      )}
    </div>
  );
}
