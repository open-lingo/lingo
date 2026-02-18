import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getLanguageConfig,
  getAlphabetById,
  getAlphabetDisplaySections,
  type AlphabetDef,
  type AlphabetSection,
} from "@/core/languageConfig";
import { ALPHABET_QUERY } from "@/hooks/usePathParams";

function CharacterCard({
  character,
  romanization,
  size = "default",
}: {
  character: string;
  romanization?: string;
  size?: "compact" | "default";
}) {
  const isCompact = size === "compact";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500 ${
        isCompact
          ? "min-h-[2.25rem] min-w-[2.25rem] text-xl"
          : "min-h-[4rem] min-w-[3rem] text-3xl py-2"
      }`}
      role="listitem"
      aria-label={romanization ? `Character ${character}, ${romanization}` : `Character ${character}`}
    >
      <span>{character}</span>
      {!isCompact && romanization && (
        <span className="mt-0.5 text-sm font-normal text-gray-500 dark:text-gray-400">
          {romanization}
        </span>
      )}
    </div>
  );
}

function AlphabetSectionBlock({
  section,
  romanizationMap,
}: {
  section: AlphabetSection;
  romanizationMap?: Record<string, string>;
}) {
  if (!section.characters.length) return null;
  const sectionId = `alphabet-section-${section.id}`;
  return (
    <section
      aria-labelledby={sectionId}
      className="space-y-3"
    >
      <h2
        id={sectionId}
        className="text-lg font-semibold text-gray-800 dark:text-gray-200"
      >
        {section.name}
      </h2>
      <ul
        className="grid list-none grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
        role="list"
        aria-label={`${section.name} characters`}
      >
        {section.characters.map((ch, i) => (
          <li key={`${ch}-${i}`}>
            <CharacterCard
              character={ch}
              romanization={romanizationMap?.[ch]}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

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
