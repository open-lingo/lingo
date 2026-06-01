import { useMemo, useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { getLanguageConfig, LANGUAGE_CONFIGS } from "@/shared/domain/languageConfig";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getExternalContent } from "./mockExternalContent";
import { parseUrlPlatform, PLATFORM_ICON_NAMES } from "./parseUrlPlatform";
import { CONTENT_TYPE_ICONS } from "./contentTypeIcons";
import { useExternalContentSubscriptions } from "./useExternalContentSubscriptions";
import { sortByCreatedAtDesc } from "@/shared/utils/dateUtils";
import type {
  ExternalContentItem,
  ExternalContentType,
  ExternalContentLevel,
  ExternalContentSkill,
} from "./types";

type SortOption = "newest" | "upvotes" | "az";

const CONTENT_TYPES: (ExternalContentType | "all")[] = [
  "all",
  "song",
  "podcast",
  "video",
  "movie",
  "tv_show",
  "article",
  "website",
  "text",
  "app",
  "other",
];

const LEVELS: (ExternalContentLevel | "all")[] = [
  "all",
  "new",
  "beginner",
  "intermediate",
  "hard",
  "advanced",
];

const SKILLS: (ExternalContentSkill | "all")[] = [
  "all",
  "listening",
  "reading",
  "both",
  "other",
];

function matchesSearch(item: ExternalContentItem, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  const titleMatch = item.title.toLowerCase().includes(lower);
  const descMatch = (item.description ?? "").toLowerCase().includes(lower);
  const linkMatch = item.links.some(
    (l) => (l.label ?? "").toLowerCase().includes(lower)
  );
  return titleMatch || descMatch || linkMatch;
}

function ExternalContentCard({
  item,
  t,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
}: {
  item: ExternalContentItem;
  t: (k: string) => string;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
}) {
  const contentLang = getLanguageConfig(item.contentLanguageId);
  const transLang = item.translationLanguageId
    ? getLanguageConfig(item.translationLanguageId)
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <h3 className="font-semibold text-text-primary">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
          <Icon name={CONTENT_TYPE_ICONS[item.contentType]} size={12} className="shrink-0" />
          {t(`externalContent.contentType.${item.contentType}`)}
        </span>
        <span className="rounded bg-surface-muted px-2 py-0.5 text-xs text-text-secondary">
          {t(`externalContent.level.${item.level}`)}
        </span>
        <span
          className="text-base"
          role="img"
          aria-label={contentLang?.name ?? item.contentLanguageId}
          title={contentLang?.name}
        >
          {contentLang?.flag ?? "🌐"}
        </span>
        {transLang && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            {transLang.name} {t("externalContent.available")}
          </span>
        )}
        {item.skill && item.skill !== "other" && (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            {t(`externalContent.skill.${item.skill}`)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {item.links.map((link, i) => {
const platform = parseUrlPlatform(link.url);
              const iconName = PLATFORM_ICON_NAMES[platform];
          const label = link.label ?? t("externalContent.open");
          const title = link.description ?? label;
          return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-muted"
          >
              <Icon name={iconName} size={16} className="shrink-0" aria-hidden />
              {label}
            </a>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span>
            <Icon name="chevronUp" size={14} className="inline" /> {item.upvoteCount} {t("externalContent.upvotes")}
          </span>
          {onSubscribe != null && onUnsubscribe != null && (
            <button
              type="button"
              onClick={isSubscribed ? onUnsubscribe : onSubscribe}
              className={`rounded px-2 py-1 font-medium transition ${
                isSubscribed
                  ? "bg-accent-muted text-accent"
                  : "text-accent hover:bg-accent-muted"
              }`}
            >
              {isSubscribed ? t("flashcards.subscribed") : t("flashcards.subscribe")}
            </button>
          )}
        </div>
        {item.submittedBy && (
          <span>{t("externalContent.by")} {item.submittedBy}</span>
        )}
      </div>
    </div>
  );
}

export function ExternalContentPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";

  const [search, setSearch] = useState("");
  const [contentLanguage, setContentLanguage] = useState<string>(langId);
  const { isSubscribed, subscribe, unsubscribe } = useExternalContentSubscriptions();
  const [contentType, setContentType] = useState<ExternalContentType | "all">("all");
  const [level, setLevel] = useState<ExternalContentLevel | "all">("all");
  const [translationFilter, setTranslationFilter] = useState<string>("all");
  const [skill, setSkill] = useState<ExternalContentSkill | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const allItems = useMemo(() => {
    const lang = contentLanguage === "all" ? undefined : contentLanguage;
    return getExternalContent(lang);
  }, [contentLanguage]);

  const filteredItems = useMemo(() => {
    let list = allItems.filter((item) => {
      if (!matchesSearch(item, search)) return false;
      if (contentType !== "all" && item.contentType !== contentType) return false;
      if (level !== "all" && item.level !== level) return false;
      if (skill !== "all" && item.skill !== skill) return false;
      if (translationFilter === "has_en" && item.translationLanguageId !== "en")
        return false;
      if (translationFilter === "has_ko" && item.translationLanguageId !== "ko")
        return false;
      if (translationFilter === "any" && !item.translationLanguageId) return false;
      return true;
    });

    if (sortBy === "newest") {
      list = sortByCreatedAtDesc(list);
    } else if (sortBy === "upvotes") {
      list = [...list].sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else if (sortBy === "az") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [allItems, search, contentType, level, skill, translationFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">
          {t("externalContent.title")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t("externalContent.intro")}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4/50">
        <div>
          <label htmlFor="ext-search" className="sr-only">
            {t("externalContent.searchPlaceholder")}
          </label>
          <input
            id="ext-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("externalContent.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2 text-xs text-gray-500">
              {t("externalContent.filterContentLanguage")}
            </label>
            <select
              value={contentLanguage}
              onChange={(e) => setContentLanguage(e.target.value)}
              className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
            >
              <option value="all">{t("externalContent.filterAll")}</option>
              {Object.entries(LANGUAGE_CONFIGS).map(([id, cfg]) => (
                <option key={id} value={id}>
                  {cfg.flag} {cfg.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs text-gray-500">
              {t("externalContent.filterContentType")}
            </label>
            <select
              value={contentType}
              onChange={(e) =>
                setContentType(e.target.value as ExternalContentType | "all")
              }
              className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
            >
              {CONTENT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {ct === "all"
                    ? t("externalContent.filterAll")
                    : t(`externalContent.contentType.${ct}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs text-gray-500">
              {t("externalContent.filterLevel")}
            </label>
            <select
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as ExternalContentLevel | "all")
              }
              className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === "all"
                    ? t("externalContent.filterAll")
                    : t(`externalContent.level.${l}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs text-gray-500">
              {t("externalContent.filterTranslation")}
            </label>
            <select
              value={translationFilter}
              onChange={(e) => setTranslationFilter(e.target.value)}
              className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
            >
              <option value="all">{t("externalContent.filterAll")}</option>
              <option value="any">{t("externalContent.filterTranslationAny")}</option>
              <option value="has_en">{t("externalContent.filterTranslationEn")}</option>
              <option value="has_ko">{t("externalContent.filterTranslationKo")}</option>
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs text-gray-500">
              {t("externalContent.filterSkill")}
            </label>
            <select
              value={skill}
              onChange={(e) =>
                setSkill(e.target.value as ExternalContentSkill | "all")
              }
              className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
            >
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s === "all"
                    ? t("externalContent.filterAll")
                    : t(`externalContent.skill.${s}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs text-gray-500">
              {t("externalContent.sortBy")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
            >
              <option value="newest">{t("externalContent.sortNewest")}</option>
              <option value="upvotes">{t("externalContent.sortUpvotes")}</option>
              <option value="az">{t("externalContent.sortAz")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {filteredItems.length} {t("externalContent.results")}
        </p>
        <button
          type="button"
          disabled
          className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-500"
        >
          {t("externalContent.addComingSoon")}
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 py-6 text-center text-gray-500/50">
          {t("externalContent.noResults")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <ExternalContentCard
                item={item}
                t={t}
                isSubscribed={isSubscribed(item.id)}
                onSubscribe={() => subscribe(item.id)}
                onUnsubscribe={() => unsubscribe(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
