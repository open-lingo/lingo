import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, SearchInput, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import {
  lookupWord,
  searchDictionary,
  type DictionaryEntry,
} from "@/shared/dictionary";
import { DictionaryEntryDetail } from "./DictionaryEntryDetail";
import { DictionaryResultsList } from "./DictionaryResultsList";

/** Cap on ranked search results shown in the compact modal. */
const SEARCH_LIMIT = 40;

type Props = {
  open: boolean;
  onClose: () => void;
  /**
   * When set, resolve this surface via `lookupWord` and show its entry
   * immediately (the story / tap-a-word path). `null` opens on the search view.
   */
  initialWord: string | null;
};

/**
 * Reusable dictionary lookup modal, scoped to the ACTIVE course language.
 *
 * Two views inside one Modal:
 *  - search: a search box + ranked results (reusing `DictionaryResultsList`).
 *  - detail: the selected entry's read-only body (`DictionaryEntryDetail`),
 *    reached by clicking a result or by opening directly to a word. A header
 *    back button returns to the search view.
 *
 * Opened directly to a word that isn't found renders a graceful not-found
 * state carrying the query.
 */
export function DictionaryModal({ open, onClose, initialWord }: Props) {
  const { t } = useTranslation();
  const activeLang = useLang();
  const langPath = useLangPath();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DictionaryEntry | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);

  // On each open, either resolve the requested word or reset to the search view.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    if (initialWord) {
      const entry = lookupWord(activeLang, initialWord);
      setSelected(entry);
      setNotFound(entry ? null : initialWord);
    } else {
      setSelected(null);
      setNotFound(null);
    }
  }, [open, initialWord, activeLang]);

  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed ? searchDictionary(activeLang, trimmed, { limit: SEARCH_LIMIT }) : []),
    [activeLang, trimmed],
  );

  const showingDetail = selected !== null || notFound !== null;

  const backToSearch = () => {
    setSelected(null);
    setNotFound(null);
  };

  const backButton = showingDetail ? (
    <button
      type="button"
      onClick={backToSearch}
      aria-label={t("dictionary.modal.back", "Back to search")}
      className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
    >
      <Icon name="arrowLeft" size={20} aria-hidden />
    </button>
  ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        selected
          ? selected.surface
          : t("dictionary.modal.title", "Look up a word")
      }
      headerLeft={backButton}
      size="lg"
    >
      {showingDetail ? (
        selected ? (
          <DictionaryEntryDetail
            entry={selected}
            conjugationTo={
              selected.conjugation
                ? langPath("practice/grammar/conjugation")
                : undefined
            }
          />
        ) : (
          <EmptyState
            icon={<Icon name="search" size={28} />}
            title={t("dictionary.modal.notFound.title", "Word not found")}
            description={t(
              "dictionary.modal.notFound.body",
              "No dictionary entry for “{{query}}”.",
              { query: notFound },
            )}
          />
        )
      ) : (
        <div className="space-y-4">
          <SearchInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={t(
              "dictionary.searchPlaceholder",
              "Search word, reading, or meaning…",
            )}
            aria-label={t("dictionary.searchLabel", "Search the dictionary")}
          />
          {trimmed ? (
            results.length > 0 ? (
              <DictionaryResultsList entries={results} onOpen={setSelected} />
            ) : (
              <EmptyState
                icon={<Icon name="search" size={28} />}
                title={t("dictionary.noMatches.title", "No words found")}
                description={t(
                  "dictionary.noMatches.body",
                  "Try a different search or clear a filter.",
                )}
              />
            )
          ) : (
            <p className="py-6 text-center text-sm text-text-muted">
              {t(
                "dictionary.modal.hint",
                "Type a word, reading, or meaning to look it up.",
              )}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
