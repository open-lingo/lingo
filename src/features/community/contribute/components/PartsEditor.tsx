import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CardSegment } from "@/features/flashcards/data/types";
import { Icon } from "@/shared/components/Icon";
import { inferParticleId } from "../_deckEditorHelpers";

const segmentInputClass =
  "min-w-0 flex-1 rounded-lg border border-border px-3 py-2 bg-surface text-text-primary";

export function PartsEditor({
  segments,
  languageId,
  onChange,
}: {
  segments?: CardSegment[];
  languageId: string;
  onChange: (segments: CardSegment[]) => void;
}) {
  const { t } = useTranslation();
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
