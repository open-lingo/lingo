import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Flashcard, CardSegment } from "@/features/flashcards/data/types";
import { Icon } from "@/shared/components/Icon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  CARD_MODE_SIMPLE,
  CARD_MODE_SEGMENTED,
  SEGMENTED_TYPES,
  segmentsToFront,
  type CardMode,
} from "../_deckEditorHelpers";
import { PartsEditor } from "./PartsEditor";

const inputClass =
  "min-w-0 w-full rounded-lg border border-border px-3 py-2 bg-surface text-text-primary";
const textareaClass = inputClass + " min-h-[80px] resize-y";

export function ActiveCardEditor({
  card,
  index,
  languageId,
  onUpdate,
}: {
  card: Flashcard;
  index: number;
  languageId: string;
  onUpdate: (u: Partial<Flashcard>) => void;
}) {
  const { t } = useTranslation();
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
