import { Sheet } from "@/shared/components/ui";
import type { DictionaryEntry } from "@/shared/dictionary";
import { DictionaryEntryDetail } from "./DictionaryEntryDetail";

type Props = {
  open: boolean;
  onClose: () => void;
  entry: DictionaryEntry | null;
  /** Deep-link into the conjugation trainer for conjugable entries. */
  conjugationTo?: string;
};

/**
 * Right-side drawer drill-in for a single dictionary word (the full-page
 * Dictionary surface). The read-only body is shared with `DictionaryModal`
 * via `DictionaryEntryDetail`.
 */
export function DictionaryEntrySheet({ open, onClose, entry, conjugationTo }: Props) {
  return (
    <Sheet open={open} onClose={onClose} side="right" title={entry?.surface ?? ""}>
      {entry ? (
        <DictionaryEntryDetail entry={entry} conjugationTo={conjugationTo} />
      ) : null}
    </Sheet>
  );
}
