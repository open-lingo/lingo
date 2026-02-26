import type { AlphabetSection } from "@/shared/domain/languageConfig";
import { CharacterCard } from "./CharacterCard";

type AlphabetSectionBlockProps = {
  section: AlphabetSection;
  romanizationMap?: Record<string, string>;
};

export function AlphabetSectionBlock({
  section,
  romanizationMap,
}: AlphabetSectionBlockProps) {
  if (!section.characters.length) return null;
  const sectionId = `alphabet-section-${section.id}`;
  return (
    <section aria-labelledby={sectionId} className="space-y-3">
      <h2
        id={sectionId}
        className="text-lg font-semibold text-text-primary"
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
            <CharacterCard character={ch} romanization={romanizationMap?.[ch]} />
          </li>
        ))}
      </ul>
    </section>
  );
}
