import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FacetSidebar, type Facet } from "@/shared/components/ui/FacetSidebar";
import { SearchInput, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import {
  getDictionaryEntries,
  searchDictionary,
  type DictionaryEntry,
  type DictionarySource,
  type PartOfSpeech,
} from "@/shared/dictionary";
import { DictionaryEntrySheet } from "./DictionaryEntrySheet";
import { DictionaryResultsList } from "./DictionaryResultsList";
import { posLabel, sourceLabel, unlockModuleOrder } from "./dictionaryLabels";

/** How many browse rows to render before "show more" is required. */
const PAGE_SIZE = 60;
/** Cap on ranked search results. */
const SEARCH_LIMIT = 60;

const SOURCE_ORDER: DictionarySource[] = ["course", "both", "frequency"];

export function DictionaryPage() {
  const { t } = useTranslation();
  // Scope the dictionary to the active course language (from `/:lang/…`).
  const activeLang = useLang();
  const langPath = useLangPath();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({
    pos: [],
    source: [],
    module: [],
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  // Whole-language entry list (frequency-sorted) — drives facet counts.
  const allEntries = useMemo(() => getDictionaryEntries(activeLang), [activeLang]);

  // Reset transient view state when the language changes.
  useEffect(() => {
    setSelections({ pos: [], source: [], module: [] });
    setQuery("");
    setVisibleCount(PAGE_SIZE);
    setOpenId(null);
  }, [activeLang]);

  // Deep link: ?word=ja:inu opens that entry.
  useEffect(() => {
    const word = searchParams.get("word");
    if (word) setOpenId(word);
  }, [searchParams]);

  const facets: Facet[] = useMemo(() => {
    const count = (pred: (e: DictionaryEntry) => boolean) =>
      allEntries.filter(pred).length;

    const posValues = [...new Set(allEntries.map((e) => e.pos))];
    const modules = [...new Set(allEntries.map((e) => e.unlockModule).filter(Boolean))]
      .map((m) => m as string)
      .sort((a, b) => unlockModuleOrder(a) - unlockModuleOrder(b));

    return [
      {
        id: "source",
        label: t("dictionary.facet.source", "Source"),
        options: SOURCE_ORDER.map((s) => ({
          value: s,
          label: sourceLabel(t, s),
          count: count((e) => e.source === s),
        })).filter((o) => o.count > 0),
      },
      {
        id: "pos",
        label: t("dictionary.facet.pos", "Part of speech"),
        options: posValues
          .map((p) => ({
            value: p,
            label: posLabel(t, p),
            count: count((e) => e.pos === p),
          }))
          .filter((o) => o.count > 0)
          .sort((a, b) => b.count - a.count),
      },
      {
        id: "module",
        label: t("dictionary.facet.module", "Unlocks at"),
        options: modules.map((m) => ({
          value: m,
          label: m,
          count: count((e) => e.unlockModule === m),
        })),
      },
    ];
  }, [allEntries, t]);

  // Browse list: feed pos/source straight into the service, then filter by
  // module membership client-side (same pattern as VocabPage's module facet).
  const browseEntries = useMemo(() => {
    const pos = selections.pos as PartOfSpeech[];
    const source = selections.source as DictionarySource[];
    const base = getDictionaryEntries(activeLang, {
      sort: "frequency",
      ...(pos.length ? { pos } : {}),
      ...(source.length ? { source } : {}),
    });
    const modules = selections.module ?? [];
    if (modules.length === 0) return base;
    const allowed = new Set(modules);
    return base.filter((e) => e.unlockModule != null && allowed.has(e.unlockModule));
  }, [activeLang, selections]);

  const trimmed = query.trim();
  const searchResults = useMemo(
    () =>
      trimmed ? searchDictionary(activeLang, trimmed, { limit: SEARCH_LIMIT }) : [],
    [activeLang, trimmed],
  );

  const isSearching = trimmed.length > 0;
  const rows = isSearching ? searchResults : browseEntries;
  const visible = isSearching ? rows : rows.slice(0, visibleCount);

  const openEntry =
    allEntries.find((e) => e.id === openId) ??
    searchResults.find((e) => e.id === openId) ??
    null;

  const toggle = (facetId: string, value: string) =>
    setSelections((s) => {
      const cur = s[facetId] ?? [];
      setVisibleCount(PAGE_SIZE);
      return {
        ...s,
        [facetId]: cur.includes(value)
          ? cur.filter((v) => v !== value)
          : [...cur, value],
      };
    });

  const closeSheet = () => {
    setOpenId(null);
    if (searchParams.get("word")) {
      const next = new URLSearchParams(searchParams);
      next.delete("word");
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("dictionary.title", "Dictionary")}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {t(
            "dictionary.subtitle",
            "Look up any word — course vocabulary and the frequency list, with readings, meanings, and conjugations.",
          )}
        </p>
      </header>

      <div className="mb-4">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("dictionary.searchPlaceholder", "Search word, reading, or meaning…")}
          aria-label={t("dictionary.searchLabel", "Search the dictionary")}
        />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="lg:w-60 lg:shrink-0">
          <FacetSidebar
            facets={facets}
            selections={selections}
            onToggle={toggle}
            onClear={(facetId) =>
              setSelections((s) => ({ ...s, [facetId]: [] }))
            }
            onClearAll={() =>
              setSelections({ pos: [], source: [], module: [] })
            }
            onOnly={(facetId, value) =>
              setSelections((s) => ({ ...s, [facetId]: [value] }))
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-sm text-text-muted">
            {isSearching
              ? t("dictionary.searchCount", "{{count}} results for “{{query}}”", {
                  count: rows.length,
                  query: trimmed,
                })
              : t("dictionary.browseCount", "Showing {{count}} of {{total}} words", {
                  count: Math.min(visible.length, rows.length),
                  total: allEntries.length,
                })}
          </p>

          {rows.length === 0 ? (
            <EmptyState
              icon={<Icon name="search" size={28} />}
              title={t("dictionary.noMatches.title", "No words found")}
              description={t(
                "dictionary.noMatches.body",
                "Try a different search or clear a filter.",
              )}
            />
          ) : (
            <>
              <DictionaryResultsList
                entries={visible}
                onOpen={(entry) => setOpenId(entry.id)}
              />

              {!isSearching && visible.length < rows.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-accent hover:text-accent"
                  >
                    {t("dictionary.showMore", "Show more")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DictionaryEntrySheet
        open={openEntry !== null}
        onClose={closeSheet}
        entry={openEntry}
        conjugationTo={
          openEntry?.conjugation ? langPath("practice/grammar/conjugation") : undefined
        }
      />
    </div>
  );
}
