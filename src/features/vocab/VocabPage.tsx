import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FacetSidebar, type Facet } from "@/shared/components/ui/FacetSidebar";
import { EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import {
  buildVocabRows,
  filterVocab,
  sortVocab,
  moduleLabel,
  moduleOrder,
  type VocabRow,
  type VocabTier,
} from "./vocabData";
import { useDictionaryModal } from "@/features/dictionary/DictionaryModalContext";
import { VocabArt } from "./VocabArt";
import { VocabCardSheet } from "./VocabCardSheet";
import { CardFront } from "@/features/flashcards/components/CardFront";

/** Cap the rendered grid; facets + search narrow past it. */
const VISIBLE_CAP = 150;

const TIER_DOT: Record<VocabTier, string> = {
  new: "rgb(var(--color-border))",
  learning: "rgb(var(--color-warning))",
  reviewing: "rgb(var(--color-accent))",
  mastered: "rgb(var(--color-success))",
};

const TIER_ORDER: VocabTier[] = ["learning", "reviewing", "mastered", "new"];
const TIER_FALLBACK: Record<VocabTier, string> = {
  new: "Not started",
  learning: "Learning",
  reviewing: "Reviewing",
  mastered: "Mastered",
};
// "phrase" removed 2026-07-13 — sentence atoms no longer surface here
// (vocabData filters them), so the facet would always count 0.
const KIND_ORDER = ["vocab", "particle"] as const;
const LEARNED_ORDER = ["learned", "locked"] as const;

export function VocabPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const langPath = useLangPath();
  const dictionaryModal = useDictionaryModal();
  const [searchParams, setSearchParams] = useSearchParams();
  // Re-derive rows when the SRS store changes (reviews, sync, unlocks).
  const srsRevision = useSRSStoreRevision();

  const rows = useMemo(
    () => buildVocabRows(langId),
    // srsRevision: tier + unlock badges track the live local stores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [langId, srsRevision],
  );

  const [selections, setSelections] = useState<Record<string, string[]>>({
    module: [],
    kind: [],
    mastery: [],
    learned: [],
  });
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Deep link: ?card=ja:biiru opens that card (from the command palette).
  useEffect(() => {
    const card = searchParams.get("card");
    if (card) setOpenId(card);
  }, [searchParams]);

  const facets: Facet[] = useMemo(() => {
    const count = (pred: (r: VocabRow) => boolean) => rows.filter(pred).length;

    const modules = [...new Set(rows.map((r) => r.module))].sort(
      (a, b) => moduleOrder(a) - moduleOrder(b),
    );

    return [
      {
        id: "learned",
        label: t("vocab.facet.learned", "Progress"),
        options: LEARNED_ORDER.map((bucket) => ({
          value: bucket,
          label:
            bucket === "learned"
              ? t("vocab.learnedFacet.learned", "Learned")
              : t("vocab.learnedFacet.locked", "Not yet taught"),
          count: count((r) => (r.unlocked ? "learned" : "locked") === bucket),
        })),
      },
      {
        id: "mastery",
        label: t("vocab.facet.mastery", "Mastery"),
        options: TIER_ORDER.map((tier) => ({
          value: tier,
          label: t(`vocab.tier.${tier}`, TIER_FALLBACK[tier]),
          count: count((r) => r.tier === tier),
        })).filter((o) => o.count > 0),
      },
      {
        id: "kind",
        label: t("vocab.facet.kind", "Type"),
        options: KIND_ORDER.map((kind) => ({
          value: kind,
          label: t(`vocab.kind.${kind}`, kind),
          count: count((r) => r.kind === kind),
        })).filter((o) => o.count > 0),
      },
      {
        id: "module",
        label: t("vocab.facet.module", "Module"),
        options: modules.map((m) => ({
          value: m,
          label: moduleLabel(m),
          count: count((r) => r.module === m),
        })),
      },
    ];
  }, [rows, t]);

  const filtered = useMemo(
    () =>
      sortVocab(
        filterVocab(
          rows,
          {
            module: selections.module ?? [],
            kind: selections.kind ?? [],
            mastery: selections.mastery ?? [],
            learned: selections.learned ?? [],
          },
          search,
        ),
      ),
    [rows, selections, search],
  );

  const openRow =
    filtered.find((r) => r.id === openId) ?? rows.find((r) => r.id === openId) ?? null;

  const toggle = (facetId: string, value: string) =>
    setSelections((s) => {
      const cur = s[facetId] ?? [];
      return {
        ...s,
        [facetId]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    });

  const closeCard = () => {
    setOpenId(null);
    if (searchParams.get("card")) {
      const next = new URLSearchParams(searchParams);
      next.delete("card");
      setSearchParams(next, { replace: true });
    }
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="library" size={32} />}
        title={t("vocab.empty.title", "Vocab browser")}
        description={t("vocab.empty.body", "The word browser isn't available for this language yet.")}
      />
    );
  }

  const visible = filtered.slice(0, VISIBLE_CAP);
  const learnedCount = rows.filter((r) => r.unlocked).length;

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text-primary">{t("vocab.title", "Vocab")}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {t("vocab.subtitle", "Every word in your course — filter by mastery to find what to review.")}
          </p>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            {t("vocab.learnedCount", "{{learned}} of {{total}} words learned", {
              learned: learnedCount,
              total: rows.length,
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dictionaryModal.open()}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-secondary transition hover:border-accent hover:text-accent"
        >
          <Icon name="search" size={16} aria-hidden />
          {t("dictionary.lookUp", "Look up a word")}
        </button>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="lg:w-60 lg:shrink-0">
          <FacetSidebar
            facets={facets}
            selections={selections}
            onToggle={toggle}
            onClear={(facetId) => setSelections((s) => ({ ...s, [facetId]: [] }))}
            onClearAll={() =>
              setSelections({ module: [], kind: [], mastery: [], learned: [] })
            }
            onOnly={(facetId, value) => setSelections((s) => ({ ...s, [facetId]: [value] }))}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("vocab.searchPlaceholder", "Kana, romaji, or meaning…")}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-sm text-text-muted">
            {t("vocab.showing", "Showing {{count}} of {{total}} words", {
              count: Math.min(visible.length, filtered.length),
              total: rows.length,
            })}
            {filtered.length > VISIBLE_CAP ? ` · ${t("vocab.capped", "narrow to see more")}` : ""}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon name="search" size={28} />}
              title={t("vocab.noMatches.title", "No words match")}
              description={t("vocab.noMatches.body", "Try clearing a filter or your search.")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setOpenId(row.id)}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 text-left transition hover:border-accent hover:shadow-card"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                    <VocabArt row={row} size={32} />
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-surface"
                      style={{ backgroundColor: TIER_DOT[row.tier] }}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate font-semibold text-text-primary ${
                        row.kanji ? "leading-[1.9]" : ""
                      }`}
                    >
                      {row.kanji ? (
                        <CardFront
                          text={row.kanji}
                          reading={{ surface: row.kanji, kana: row.kana }}
                          cardId={row.id}
                        />
                      ) : (
                        row.kana
                      )}
                    </p>
                    <p className="truncate text-xs text-text-muted">{row.meaning}</p>
                    <p
                      className={`truncate text-[10px] font-medium ${
                        row.unlocked ? "text-success" : "text-text-muted"
                      }`}
                    >
                      {row.unlocked
                        ? t("vocab.learnedBadge", "Learned")
                        : t("vocab.lockedBadge", "Not yet taught")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <VocabCardSheet
        open={openRow !== null}
        onClose={closeCard}
        row={openRow}
        practiceTo={langPath("practice/flashcards/review")}
      />
    </div>
  );
}
