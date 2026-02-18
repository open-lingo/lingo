import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SuggestionType } from "./types";

const GITHUB_ISSUES_BASE = "https://github.com/open-lingo/lingo/issues/new";

function buildIssueUrl(type: SuggestionType, title: string, description: string): string {
  const label = type === "bug" ? "bug" : type === "feature" ? "enhancement" : "community";
  const body = [
    "## Description",
    description || "(No description provided)",
    "",
    "---",
    "*Submitted via Open Lingo Community*",
    `*Type: ${type}*`,
  ].join("\n");

  const params = new URLSearchParams({
    title: title || "Community suggestion",
    body,
    labels: label,
  });
  return `${GITHUB_ISSUES_BASE}?${params.toString()}`;
}

export function SuggestionForm() {
  const { t } = useTranslation();
  const [type, setType] = useState<SuggestionType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const issueUrl = buildIssueUrl(type, title, description);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("community.suggestionsFormHelp")}
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          window.open(issueUrl, "_blank", "noopener,noreferrer");
        }}
      >
        <div>
          <label htmlFor="suggestion-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("community.suggestionsType")}
          </label>
          <select
            id="suggestion-type"
            value={type}
            onChange={(e) => setType(e.target.value as SuggestionType)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="bug">{t("community.suggestionsTypeBug")}</option>
            <option value="feature">{t("community.suggestionsTypeFeature")}</option>
            <option value="content">{t("community.suggestionsTypeContent")}</option>
            <option value="other">{t("community.suggestionsTypeOther")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="suggestion-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("community.suggestionsTitle")}
          </label>
          <input
            id="suggestion-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("community.suggestionsTitlePlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="suggestion-description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("community.suggestionsDescription")}
          </label>
          <textarea
            id="suggestion-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("community.suggestionsDescriptionPlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t("community.suggestionsCreateIssue")}
          </button>
          <a
            href="https://github.com/open-lingo/lingo/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("community.suggestionsViewAllIssues")}
          </a>
        </div>
      </form>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("community.suggestionsOpensNewTab")}
      </p>
    </div>
  );
}
