import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  getLanguageConfig,
  getAlphabetById,
  getAlphabetDisplaySections,
  type AlphabetDef,
} from "@/shared/domain/languageConfig";
import { ALPHABET_QUERY } from "@/shared/hooks/usePathParams";
import { CharacterCard, AlphabetSectionBlock } from "./components/characters";

export function AlphabetPracticePage() {
  const { language } = useLanguage();
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

  useEffect(() => {
    if (defaultAlphabet && resolvedId && !pathAlphabetId && queryName) {
      setSearchParams({}, { replace: true });
    }
  }, [defaultAlphabet?.id, resolvedId, pathAlphabetId, queryName, setSearchParams]);

  if (!alphabet) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Alphabet
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          No alphabet for this language, or invalid{" "}
          <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">name</code>{" "}
          / path.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {alphabet.name}
        </h1>
        {alphabet.description && (
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {alphabet.description}
          </p>
        )}
      </header>

      {displaySections.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
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
                className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Full alphabet
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
              <AlphabetSectionBlock
                key={section.id}
                section={section}
                romanizationMap={alphabet.characterRomanization}
              />
            ))}
          </div>
        </>
      )}

      {defaultAlphabet && (
        <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          Shareable:{" "}
          <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">
            /practice/alphabet/{defaultAlphabet.id}
          </code>{" "}
          or{" "}
          <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">
            ?name={defaultAlphabet.id}
          </code>
        </p>
      )}
    </div>
  );
}
