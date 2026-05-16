import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useSettings } from "@/shared/contexts/SettingsContext";
import type { StudyOption } from "@/shared/settings/types";
import type { ManagedDeck } from "./useDeckManagerData";

export function StudyOptionsEditor({ decks }: { decks: ManagedDeck[] }) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { settings, updateFlashcards } = useSettings();
  const options = settings.flashcards?.studyOptions ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const persist = (next: StudyOption[]) => {
    updateFlashcards({ studyOptions: next });
  };

  const addOption = () => {
    const name = newName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    persist([...options, { id, name, deckIds: [] }]);
    setNewName("");
    setExpandedId(id);
  };

  const removeOption = (id: string) => {
    persist(options.filter((o) => o.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleDeckInOption = (optionId: string, deckId: string, checked: boolean) => {
    persist(
      options.map((o) => {
        if (o.id !== optionId) return o;
        const nextIds = new Set(o.deckIds);
        if (checked) nextIds.add(deckId);
        else nextIds.delete(deckId);
        return { ...o, deckIds: [...nextIds] };
      })
    );
  };

  const reviewBase = langPath("practice/flashcards/review");

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
        {t("flashcards.studyOptions.title", "Study options")}
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {t(
          "flashcards.studyOptions.subtitle",
          "Create named sets of decks (a deck can be in several options). Use Study to review only those cards."
        )}
      </p>

      <div className="space-y-3">
        {options.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("flashcards.studyOptions.empty", "No study options yet. Add one below.")}
          </p>
        ) : (
          options.map((opt) => (
            <div
              key={opt.id}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{opt.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("flashcards.studyOptions.deckCount", "{{count}} decks", {
                      count: opt.deckIds.length,
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`${reviewBase}?studyOption=${encodeURIComponent(opt.id)}`}
                    className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
                  >
                    {t("flashcards.studyOptions.study", "Study")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === opt.id ? null : opt.id)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {expandedId === opt.id
                      ? t("flashcards.studyOptions.collapse", "Hide decks")
                      : t("flashcards.studyOptions.chooseDecks", "Choose decks")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {t("flashcards.studyOptions.remove", "Remove")}
                  </button>
                </div>
              </div>
              {expandedId === opt.id && (
                <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto border-t border-gray-100 pt-3 dark:border-gray-700">
                  {decks.length === 0 ? (
                    <li className="text-sm text-gray-500">
                      {t("flashcards.studyOptions.noSubscribedDecks", "Subscribe to decks first.")}
                    </li>
                  ) : (
                    decks.map((d) => (
                      <li key={d.id}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600"
                            checked={opt.deckIds.includes(d.id)}
                            onChange={(e) => toggleDeckInOption(opt.id, d.id, e.target.checked)}
                          />
                          <span className="truncate">{d.name}</span>
                        </label>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("flashcards.studyOptions.newPlaceholder", "New study option name")}
          className="min-w-[12rem] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="button"
          onClick={addOption}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {t("flashcards.studyOptions.add", "Add study option")}
        </button>
      </div>
    </section>
  );
}
