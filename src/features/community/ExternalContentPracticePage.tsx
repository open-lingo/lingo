import { useMemo } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { parseUrlPlatform, PLATFORM_ICON_NAMES } from "./parseUrlPlatform";
import { CONTENT_TYPE_ICONS } from "./contentTypeIcons";
import { useExternalContentSubscriptions } from "./useExternalContentSubscriptions";
import type { ExternalContentItem } from "./types";

// Why: external_content backend domain doesn't exist yet. The flag-gated
// page would normally render subscribed items here, but with no source of
// items we render an empty state. Local subscription state is still
// retained via the hook (localStorage) for when the backend lands.
const NO_ITEMS: ExternalContentItem[] = [];

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
          ? "border-green-200 bg-green-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">
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
                ? "border-green-600 bg-green-600 text-white"
                : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
            }`}
            aria-label={isDone ? t("externalContent.practice.done") : t("externalContent.practice.notDone")}
          >
            <Icon name={isDone ? "check" : "circle"} size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onUnsubscribe}
            className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600"
          >
            {t("externalContent.practice.unsubscribe")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <Icon name={CONTENT_TYPE_ICONS[item.contentType]} size={14} aria-hidden />
          {t(`externalContent.contentType.${item.contentType}`)}
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
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
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
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
  const flags = useFeatureFlags();
  const langId = language?.id ?? "ko";
  const { subscribedIds, toggleDone, isDone, unsubscribe } =
    useExternalContentSubscriptions();

  const subscribedItems = useMemo(() => {
    void subscribedIds;
    return NO_ITEMS;
  }, [subscribedIds]);

  if (!flags.community.tabs.externalContent) {
    return (
      <EmptyState
        title={t(
          "externalContent.comingSoonTitle",
          "External content coming soon",
        )}
        description={t(
          "externalContent.comingSoonDescription",
          "We're building a directory of community-curated learning resources. Check back later.",
        )}
      />
    );
  }

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
        <h2 className="text-lg font-semibold text-text-primary">
          {t("externalContent.practice.title")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t("externalContent.practice.intro")}
        </p>
      </div>

      {subscribedItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center/50">
          <p className="text-text-muted">
            {t("externalContent.practice.noSubscriptions")}
          </p>
          <Link
            to={langPath("community/external-content")}
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            {t("externalContent.practice.browseToAdd")}
          </Link>
        </div>
      ) : (
        <>
          {forLanguage.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-text-secondary">
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
              <h3 className="mb-3 text-sm font-medium text-text-secondary">
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
            className="inline-block text-sm font-medium text-green-600 hover:underline"
          >
            {t("externalContent.practice.browseMore")}
          </Link>
        </>
      )}
    </div>
  );
}
