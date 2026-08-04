import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, SearchInput, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import {
  lookupWordSenses,
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
 * A homograph shows its OTHER senses under the detail. One entry carries one
 * meaning, so answering a tap with a single entry told a learner reading
 * 열이 나요 ("has a fever") that 열 means "ten" — confidently wrong, and
 * unfalsifiable from their side. The alternates are always one tap away.
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
      const entry = lookupWordSenses(activeLang, initialWord)[0] ?? null;
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

  // Sibling senses of whatever is on screen — resolved from the surface, so it
  // works for a tapped word and for an entry reached through search alike.
  // Compared by IDENTITY, not id: the course data registers distinct senses of
  // one surface under the same atom id (KO 저 is both "I / me" and "that over
  // there" as `ko:저`), so filtering by id would drop a sibling sense as well
  // as the selected one. The index hands out stable objects, so `!==` is exact.
  const otherSenses = useMemo(
    () =>
      selected
        ? lookupWordSenses(activeLang, selected.surface).filter(
            (e) => e !== selected,
          )
        : [],
    [activeLang, selected],
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
          <div className="space-y-5">
            <DictionaryEntryDetail
              entry={selected}
              conjugationTo={
                selected.conjugation
                  ? langPath("practice/grammar/conjugation")
                  : undefined
              }
            />
            {otherSenses.length > 0 && (
              <section className="border-t border-border pt-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-text-muted">
                  {t(
                    "dictionary.otherMeanings",
                    "{{word}} also means",
                    { word: selected.surface },
                  )}
                </p>
                <DictionaryResultsList
                  entries={otherSenses}
                  onOpen={setSelected}
                />
              </section>
            )}
          </div>
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
