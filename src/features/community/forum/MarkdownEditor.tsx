import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

type Tab = "write" | "preview";

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 6,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  id?: string;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("write");

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            tab === "write"
              ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          {t("forum.write")}
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            tab === "preview"
              ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          {t("forum.preview")}
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800">
        {tab === "write" ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={minRows}
            className="w-full resize-y border-0 bg-transparent p-4 text-gray-900 placeholder-gray-500 focus:ring-0 dark:text-white dark:placeholder-gray-400"
          />
        ) : (
          <div className="prose prose-sm max-w-none p-4 dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">{t("forum.nothingToPreview")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
