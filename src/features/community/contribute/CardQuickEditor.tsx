import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ModalBase } from "@/shared/components/ModalBase";
import type { DeckCard } from "@/shared/api/decks";
import type { FlashcardType } from "@/features/flashcards/data/types";

type CardQuickEditorProps = {
  deckId: string;
  cardId?: string | null;
  initialFront?: string;
  /** When editing, pass the full card to pre-fill fields */
  initialCard?: DeckCard | null;
  onSave: (card: Pick<DeckCard, "id" | "front" | "back" | "type" | "note" | "image">) => void;
  onCancel: () => void;
};

const CARD_TYPES: { value: FlashcardType; labelKey: string }[] = [
  { value: "word", labelKey: "community.editorCardTypeWord" },
  { value: "sentence", labelKey: "community.editorCardTypeSentence" },
  { value: "other", labelKey: "community.editorCardTypeOther" },
];

function generateCardId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CardQuickEditor({
  deckId: _deckId,
  cardId,
  initialFront = "",
  initialCard,
  onSave,
  onCancel,
}: CardQuickEditorProps) {
  const { t } = useTranslation();
  const [front, setFront] = useState(initialCard?.front ?? initialFront);
  const [back, setBack] = useState(initialCard?.back ?? "");
  const [type, setType] = useState<FlashcardType>(initialCard?.type ?? "word");
  const [note, setNote] = useState(initialCard?.note ?? "");
  const [image, setImage] = useState(initialCard?.image ?? "");

  useEffect(() => {
    if (initialCard) {
      setFront(initialCard.front);
      setBack(initialCard.back);
      setType(initialCard.type as FlashcardType);
      setNote(initialCard.note ?? "");
      setImage(initialCard.image ?? "");
    } else {
      setFront((prev) => initialFront || prev);
    }
  }, [initialCard, initialFront]);

  const handleSave = () => {
    if (!front.trim() || !back.trim()) return;
    onSave({
      id: cardId ?? generateCardId(),
      front: front.trim(),
      back: back.trim(),
      type,
      note: note.trim() || undefined,
      image: image.trim() || undefined,
    });
  };

  const canSave = !!front.trim() && !!back.trim();

  return (
    <ModalBase
      onClose={onCancel}
      title={cardId ? t("community.storyEditorEditCard", "Edit card") : t("community.storyEditorNewCard", "New card")}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("community.editorFront")}
          </label>
          <input
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder={t("community.editorCardFrontPlaceholder")}
            className="w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("community.editorBack")}
          </label>
          <input
            type="text"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Translation"
            className="w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">
            {t("community.editorCardType")}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FlashcardType)}
            className="w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary"
          >
            {CARD_TYPES.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">
            {t("community.editorNote")}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("community.editorNotePlaceholder")}
            className="w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">
            {t("community.editorImageUrl")}
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder={t("community.editorImageUrlPlaceholder")}
            className="w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("forum.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {t("community.storyEditorSaveCard", "Save card")}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
