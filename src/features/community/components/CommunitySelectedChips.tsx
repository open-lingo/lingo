import { Icon } from "@/shared/components/Icon";

export type ChipDescriptor = {
  facetId: string;
  value: string;
  label: string;
};

type Props = {
  chips: ChipDescriptor[];
  onRemove: (facetId: string, value: string) => void;
  onClearAll: () => void;
  clearAllLabel: string;
};

export function CommunitySelectedChips({
  chips,
  onRemove,
  onClearAll,
  clearAllLabel,
}: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.facetId}:${c.value}`}
          type="button"
          onClick={() => onRemove(c.facetId, c.value)}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary transition hover:bg-surface hover:text-text-primary"
        >
          <span>{c.label}</span>
          <Icon name="close" size={12} aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-xs font-medium text-text-muted hover:text-text-primary"
      >
        {clearAllLabel}
      </button>
    </div>
  );
}
