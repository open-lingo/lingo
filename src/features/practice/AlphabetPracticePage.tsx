import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguageConfig, getAlphabetById } from "@/core/languageConfig";
import { ALPHABET_QUERY } from "@/hooks/usePathParams";

export function AlphabetPracticePage() {
  const { language } = useLanguage();
  const { alphabetId: pathAlphabetId } = useParams<{ alphabetId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryName = searchParams.get(ALPHABET_QUERY);

  const config = language ? getLanguageConfig(language.id) : null;
  const defaultAlphabet = config?.alphabet;

  const resolvedId = pathAlphabetId ?? queryName ?? defaultAlphabet?.id;
  const alphabet = resolvedId && language
    ? getAlphabetById(language.id, resolvedId) ?? defaultAlphabet
    : defaultAlphabet;

  useEffect(() => {
    if (defaultAlphabet && resolvedId && !pathAlphabetId && queryName) {
      setSearchParams({}, { replace: true });
    }
  }, [defaultAlphabet?.id, resolvedId, pathAlphabetId, queryName, setSearchParams]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alphabet</h1>
      {alphabet ? (
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          <strong>{alphabet.name}</strong>
          {alphabet.description && ` — ${alphabet.description}`}. Character learner coming soon.
        </p>
      ) : (
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          No alphabet for this language, or invalid <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">name</code> / path. Character learner coming soon.
        </p>
      )}
      {defaultAlphabet && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Shareable URL: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">/practice/alphabet/{defaultAlphabet.id}</code> or <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">?name={defaultAlphabet.id}</code>
        </p>
      )}
    </div>
  );
}
