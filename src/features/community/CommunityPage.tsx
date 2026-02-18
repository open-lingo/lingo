import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { COMMUNITY_TAB_QUERY } from "@/hooks/usePathParams";
import { getLanguageConfig } from "@/core/languageConfig";
import {
  getOfficialCoursesByLanguage,
  getAllAddons,
  OFFICIAL_COURSE_LANGUAGES,
} from "./mockCommunity";
import { SuggestionForm } from "./SuggestionForm";
import type { CommunityAddon } from "./types";
import type { AddonKind } from "./types";

const ADDON_KIND_KEYS: Record<AddonKind, string> = {
  course: "community.addonKindCourse",
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  grammar: "community.addonKindGrammar",
};

const REVISION_STATUS_KEYS: Record<string, string> = {
  pending: "community.revisionStatusPending",
  accepted: "community.revisionStatusAccepted",
  rejected: "community.revisionStatusRejected",
};

function AddonKindLabel({ kind }: { kind: AddonKind }) {
  const { t } = useTranslation();
  return <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t(ADDON_KIND_KEYS[kind])}</span>;
}

function AddonCard({ addon }: { addon: CommunityAddon }) {
  const { t } = useTranslation();
  const langConfig = getLanguageConfig(addon.languageId);
  const langName = langConfig?.name ?? addon.languageId;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AddonKindLabel kind={addon.kind} />
            <span className="text-xs text-gray-400 dark:text-gray-500">{langName}</span>
          </div>
          <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{addon.name}</h3>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {addon.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {addon.itemCount != null && (
              <span>{addon.itemCount} {t("community.addonsItems")}</span>
            )}
            <span>↑ {addon.upvoteCount}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            className={`rounded px-2 py-1 text-sm font-medium transition ${
              addon.userUpvoted
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {addon.userUpvoted ? t("community.addonsUpvoted") : t("community.addonsUpvote")}
          </button>
          {addon.sourceUrl && (
            <a
              href={addon.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {t("community.addonsMaintain")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const MAIN_TABS = [
  { id: "official", labelKey: "community.tabOfficial" },
  { id: "community", labelKey: "community.tabCommunity" },
] as const;

export function CommunityPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get(COMMUNITY_TAB_QUERY) ?? "official";

  const [officialLang, setOfficialLang] = useState(() => {
    return language && OFFICIAL_COURSE_LANGUAGES.includes(language.id)
      ? language.id
      : OFFICIAL_COURSE_LANGUAGES[0] ?? "ko";
  });

  const communityRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (tab === "community" && communityRef.current) {
      communityRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tab]);

  const officialCourses = getOfficialCoursesByLanguage(officialLang);
  const addons = getAllAddons();
  const filteredAddons = language ? addons.filter((a) => a.languageId === language.id) : addons;

  const flashcardPacks = filteredAddons.filter((a) => a.kind === "flashcard-pack");
  const otherAddons = filteredAddons.filter((a) => a.kind !== "flashcard-pack");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("community.title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("community.intro")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MAIN_TABS.map(({ id, labelKey }) => (
            <Link
              key={id}
              to={`/community?${COMMUNITY_TAB_QUERY}=${id}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === id
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>
      </div>

      {/* Official tab: language dropdown + selected language's courses */}
      {tab === "official" && (
      <section
        id="official"
        className="scroll-mt-4 space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("community.official")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("community.officialDesc")}
        </p>
        <div>
          <label htmlFor="official-lang" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("community.officialLanguageLabel")}
          </label>
          <select
            id="official-lang"
            value={officialLang}
            onChange={(e) => setOfficialLang(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {OFFICIAL_COURSE_LANGUAGES.map((langId) => {
              const cfg = getLanguageConfig(langId);
              return (
                <option key={langId} value={langId}>
                  {cfg ? `${cfg.flag} ${cfg.name}` : langId}
                </option>
              );
            })}
          </select>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("community.officialRevisionHelp")}
        </p>
        <ul className="space-y-3">
          {officialCourses.map((course) => (
            <li
              key={course.id}
              className="flex flex-col gap-2 rounded border border-gray-100 p-3 dark:border-gray-600"
            >
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{course.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{course.description}</p>
              </div>
              <a
                href={course.revisionGuideUrl ?? "https://github.com/open-lingo/lingo/issues"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                {t("community.officialRevisionTitle")} →
              </a>
              {course.revisions && course.revisions.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("community.officialRevisions")}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {course.revisions.map((rev) => {
                      const statusKey = REVISION_STATUS_KEYS[rev.status] ?? "community.revisionStatusPending";
                      return (
                        <li key={rev.id}>
                          <a
                            href={rev.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {rev.title} ({t(statusKey)})
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      )}

      {/* Community tab: addons, flashcard packs, discussion (suggestion forms) */}
      {tab === "community" && (
      <section
        id="community"
        ref={communityRef}
        className="scroll-mt-4 space-y-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("community.tabCommunity")}
        </h2>

        {/* Addons (courses + other) */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t("community.addons")}
          </h3>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            {t("community.addonsDesc")}
          </p>
          <div className="mt-3 space-y-3">
            {otherAddons.map((addon) => (
              <AddonCard key={addon.id} addon={addon} />
            ))}
          </div>
        </div>

        {/* Flashcard packs */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t("community.addonKindFlashcardPack")}
          </h3>
          <div className="mt-3 space-y-3">
            {flashcardPacks.map((addon) => (
              <AddonCard key={addon.id} addon={addon} />
            ))}
          </div>
        </div>

        <a
          href="https://github.com/open-lingo/lingo/discussions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("community.addonsAddNew")} →
        </a>

        {/* Discussion: suggestion forms */}
        <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t("community.discussion")}
          </h3>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            {t("community.discussionDesc")}
          </p>
          <div className="mt-4">
            <SuggestionForm />
          </div>
        </div>

        {/* Links */}
        <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t("community.links")}
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <a
                href="https://github.com/open-lingo/lingo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t("community.linkGitHub")}
              </a>
            </li>
            <li>
              <a
                href="https://github.com/open-lingo/lingo/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t("community.linkIssues")}
              </a>
            </li>
          </ul>
        </div>
      </section>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("community.footer")}
      </p>

      <Link
        to="/"
        className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {t("community.backToHome")}
      </Link>
    </div>
  );
}
