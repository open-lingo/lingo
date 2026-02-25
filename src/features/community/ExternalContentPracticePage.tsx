import { useMemo } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { MOCK_EXTERNAL_CONTENT } from "./mockExternalContent";
import { parseUrlPlatform, PLATFORM_ICON_NAMES } from "./parseUrlPlatform";
import { CONTENT_TYPE_ICONS } from "./contentTypeIcons";
import { useExternalContentSubscriptions } from "./useExternalContentSubscriptions";
import type { ExternalContentItem } from "./types";

function PracticeCard({
  item,
  isDone,
  onToggleDone,
  onUnsubscribe,
  t,
}: {
  item: ExternalContentItem;
  isDone: boolean;
  onToggleDone: () => void;
  onUnsubscribe: () => void;
  t: (k: string) => string;
}) {
  const contentLang = getLanguageConfig(item.contentLanguageId);
  const transLang = item.translationLanguageId
    ? getLanguageConfig(item.translationLanguageId)
    : null;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
        isDone
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleDone}
            title={isDone ? t("externalContent.practice.markNotDone") : t("externalContent.practice.markDone")}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 transition ${
              isDone
                ? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-500"
                : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:text-gray-300"
            }`}
            aria-label={isDone ? t("externalContent.practice.done") : t("externalContent.practice.notDone")}
          >
            <Icon name={isDone ? "check" : "circle"} size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onUnsubscribe}
            className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
          >
            {t("externalContent.practice.unsubscribe")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          {t(`externalContent.contentType.${item.contentType}`)}
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {t(`externalContent.level.${item.level}`)}
        </span>
        <span
          className="text-base"
          role="img"
          aria-label={contentLang?.name ?? item.contentLanguageId}
        >
          {contentLang?.flag ?? "🌐"}
        </span>
        {transLang && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {transLang.name} {t("externalContent.available")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {item.links.map((link, i) => {
          const platform = parseUrlPlatform(link.url);
          const iconName = PLATFORM_ICON_NAMES[platform];
          const label = link.label ?? t("externalContent.open");
          return (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.description ?? label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <Icon name={iconName} size={16} className="shrink-0" aria-hidden />
              {label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function ExternalContentPracticePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const { subscribedIds, toggleDone, isDone, unsubscribe } =
    useExternalContentSubscriptions();

  const subscribedItems = useMemo(() => {
    const idSet = new Set(subscribedIds);
    return MOCK_EXTERNAL_CONTENT.filter((item) => idSet.has(item.id));
  }, [subscribedIds]);

  const forLanguage = useMemo(
    () => subscribedItems.filter((i) => i.contentLanguageId === langId),
    [subscribedItems, langId]
  );
  const other = useMemo(
    () => subscribedItems.filter((i) => i.contentLanguageId !== langId),
    [subscribedItems, langId]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("externalContent.practice.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("externalContent.practice.intro")}
        </p>
      </div>

      {subscribedItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-gray-600 dark:text-gray-400">
            {t("externalContent.practice.noSubscriptions")}
          </p>
          <Link
            to={langPath("community/external-content")}
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t("externalContent.practice.browseToAdd")}
          </Link>
        </div>
      ) : (
        <>
          {forLanguage.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("externalContent.practice.forYourLanguage")}
              </h3>
              <ul className="grid gap-4 sm:grid-cols-2">
                {forLanguage.map((item) => (
                  <li key={item.id}>
                    <PracticeCard
                      item={item}
                      isDone={isDone(item.id)}
                      onToggleDone={() => toggleDone(item.id)}
                      onUnsubscribe={() => unsubscribe(item.id)}
                      t={t}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {other.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("externalContent.practice.otherLanguages")}
              </h3>
              <ul className="grid gap-4 sm:grid-cols-2">
                {other.map((item) => (
                  <li key={item.id}>
                    <PracticeCard
                      item={item}
                      isDone={isDone(item.id)}
                      onToggleDone={() => toggleDone(item.id)}
                      onUnsubscribe={() => unsubscribe(item.id)}
                      t={t}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            to={langPath("community/external-content")}
            className="inline-block text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            {t("externalContent.practice.browseMore")}
          </Link>
        </>
      )}
    </div>
  );
}
