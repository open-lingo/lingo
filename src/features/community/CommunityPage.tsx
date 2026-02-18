import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COMMUNITY_TAB_QUERY } from "@/hooks/usePathParams";

export function CommunityPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get(COMMUNITY_TAB_QUERY);
  const contributeRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (tab === "contribute" && contributeRef.current) {
      contributeRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (tab === "links" && linksRef.current) {
      linksRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tab]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("community.title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("community.intro")}
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t("community.shareable")}{" "}
          <Link to="/community?tab=contribute" className="underline">{t("community.tabContribute")}</Link>
          {" · "}
          <Link to="/community?tab=links" className="underline">{t("community.tabLinks")}</Link>
        </p>
      </div>

      <section
        id="contribute"
        ref={contributeRef}
        className="scroll-mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("community.contribute")}
        </h2>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>{t("community.contributeCourses")}</li>
          <li>{t("community.contributeFeedback")}</li>
          <li>{t("community.contributeCode")}</li>
        </ul>
      </section>

      <section
        id="links"
        ref={linksRef}
        className="scroll-mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">{t("community.links")}</h2>
        <ul className="space-y-2 text-sm">
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
          <li>
            <span className="text-gray-500 dark:text-gray-400">
              {t("community.linkDiscord")}
            </span>
          </li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        This page is intentionally minimal. If something’s missing or wrong,
        open an issue or send a PR — that’s how we improve it.
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
