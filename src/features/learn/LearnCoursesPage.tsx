import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useModal } from "@/shared/contexts/ModalContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { useApi } from "@/shared/api/provider";
import type { CommunityAddon } from "@/shared/api/community";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { ModuleCard } from "@/features/course/components";

const TRENDING_COURSE_LIMIT = 4;

export function LearnCoursesPage() {
  const { t } = useTranslation();
  const { openSettings } = useModal();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { community } = useApi();
  const course = language ? getMockCourse(language.id) : null;
  const completedIds = useCompletedLessonIds();

  const trendingQuery = useQuery<CommunityAddon[]>({
    queryKey: ["community", "addons", { kind: "course", languageId: language?.id }],
    queryFn: ({ signal }) =>
      community.listAddons(
        { kind: "course", languageId: language?.id, limit: 50 },
        signal,
      ),
    staleTime: 5 * 60_000,
    enabled: Boolean(language?.id),
  });
  const customCourses = useMemo(() => {
    const list = trendingQuery.data ?? [];
    return [...list]
      .sort((a, b) => b.upvoteCount - a.upvoteCount)
      .slice(0, TRENDING_COURSE_LIMIT);
  }, [trendingQuery.data]);

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-text-muted">
          Select a learning language in Settings to see your courses.
        </p>
        <button type="button" onClick={() => openSettings()} className="text-sm text-link">
          <Icon name="arrowBigRight" size={14} className="inline" /> Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          {course.title}
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {t("learn.officialCourseDesc")}
        </p>
        <div className="space-y-3">
          {course.modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              completedLessonIds={completedIds}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          {t("learn.customCourseModules")}
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {t("learn.customCourseModulesDesc")}
        </p>
        {customCourses.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("learn.noCustomModules")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customCourses.map((addon) => {
              const lang = getLanguageConfig(addon.languageId);
              const flag = lang?.flag ?? "🌐";
              return (
                <Link
                  key={addon.id}
                  to={langPath("community/explore")}
                  className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4 transition hover:border-border-muted"
                >
                  <span className="text-2xl" role="img">
                    {flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">
                      {addon.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                      {addon.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link
          to={langPath("community/explore")}
          className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover"
        >
          {t("learn.browseAllCourses")} <Icon name="arrowBigRight" size={14} className="inline" />
        </Link>
      </section>

      <Link
        to={langPath("")}
        className="inline-block text-sm text-text-muted hover:text-text-primary"
      >
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
