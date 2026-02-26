import { useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  getLanguageConfig,
  getAlphabetById,
  getAlphabetDisplaySections,
  type AlphabetDef,
} from "@/shared/domain/languageConfig";
import { ALPHABET_QUERY } from "@/shared/hooks/usePathParams";
import { CharacterCard, AlphabetSectionBlock } from "./components/characters";
import { getOrCreateProgress } from "./alphabet/alphabetProgress";

export function AlphabetPracticePage() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { alphabetId: pathAlphabetId } = useParams<{ alphabetId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryName = searchParams.get(ALPHABET_QUERY);

  const config = language ? getLanguageConfig(language.id) : null;
  const defaultAlphabet = config?.alphabet;

  const resolvedId = pathAlphabetId ?? queryName ?? defaultAlphabet?.id;
  const alphabet: AlphabetDef | undefined =
    resolvedId && language
      ? getAlphabetById(language.id, resolvedId) ?? defaultAlphabet ?? undefined
      : defaultAlphabet ?? undefined;

  const displaySections = useMemo(
    () => (alphabet ? getAlphabetDisplaySections(alphabet) : []),
    [alphabet]
  );

  const allCharacters = useMemo(() => {
    if (!alphabet) return [];
    if (alphabet.characters?.length) return alphabet.characters;
    return displaySections.flatMap((s) => s.characters);
  }, [alphabet, displaySections]);

  const progress = useMemo(() => {
    if (!language || !resolvedId) return null;
    return getOrCreateProgress(language.id, resolvedId);
  }, [language, resolvedId]);

  const hasAnyProgress = progress && Object.keys(progress.letters).length > 0;

  useEffect(() => {
    if (defaultAlphabet && resolvedId && !pathAlphabetId && queryName) {
      setSearchParams({}, { replace: true });
    }
  }, [defaultAlphabet?.id, resolvedId, pathAlphabetId, queryName, setSearchParams]);

  if (!alphabet) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-text-primary">
          Alphabet
        </h1>
        <p className="mt-2 text-text-secondary">
          No alphabet for this language, or invalid{" "}
          <code className="rounded bg-surface-muted px-1">name</code>{" "}
          / path.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {alphabet.name}
        </h1>
        {alphabet.description && (
          <p className="mt-1 text-text-secondary">
            {alphabet.description}
          </p>
        )}
        {resolvedId && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(langPath(`practice/alphabet/${resolvedId}/learn`))
              }
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {hasAnyProgress
                ? t("practice.alphabetLearner.continueLearning")
                : t("practice.alphabetLearner.startLearning")}
            </button>
            {allCharacters.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    langPath(
                      `practice/alphabet/${resolvedId}/learn?mode=test`
                    )
                  )
                }
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted"
              >
                {t("practice.alphabetLearner.testOutOfAlphabet")}
              </button>
            )}
          </div>
        )}
      </header>

      {displaySections.length === 0 ? (
        <p className="text-text-secondary">
          Character list for this alphabet is not yet configured.
        </p>
      ) : (
        <>
          {allCharacters.length > 0 && (
            <section
              className="mb-8"
              aria-labelledby="alphabet-overview-heading"
            >
              <h2
                id="alphabet-overview-heading"
                className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted"
              >
                {t("practice.alphabetLearner.fullAlphabet")}
              </h2>
              <ul
                className="flex flex-wrap gap-1.5"
                role="list"
                aria-label="All alphabet characters"
              >
                {allCharacters.map((ch, i) => (
                  <li key={`overview-${ch}-${i}`}>
                    <CharacterCard
                      character={ch}
                      romanization={alphabet.characterRomanization?.[ch]}
                      size="compact"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-col gap-10">
            {displaySections.map((section) => (
              <div key={section.id} className="space-y-2">
                <AlphabetSectionBlock
                  section={section}
                  romanizationMap={alphabet.characterRomanization}
                />
                {resolvedId && section.characters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {progress?.sectionTests[section.id] ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        {t("practice.alphabetLearner.sectionPassed")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            langPath(
                              `practice/alphabet/${resolvedId}/learn?mode=test&section=${encodeURIComponent(section.id)}`
                            )
                          )
                        }
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-muted"
                      >
                        {t("practice.alphabetLearner.testOutOfSection")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {defaultAlphabet && (
        <p className="mt-8 text-xs text-text-muted">
          Shareable:{" "}
          <code className="rounded bg-surface-muted px-1">
            /practice/alphabet/{defaultAlphabet.id}
          </code>{" "}
          or{" "}
          <code className="rounded bg-surface-muted px-1">
            ?name={defaultAlphabet.id}
          </code>
        </p>
      )}
    </div>
  );
}
