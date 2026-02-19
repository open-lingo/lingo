type CharacterCardProps = {
  character: string;
  romanization?: string;
  size?: "compact" | "default";
};

export function CharacterCard({
  character,
  romanization,
  size = "default",
}: CharacterCardProps) {
  const isCompact = size === "compact";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500 ${
        isCompact
          ? "min-h-[2.25rem] min-w-[2.25rem] text-xl"
          : "min-h-[4rem] min-w-[3rem] py-2 text-3xl"
      }`}
      role="listitem"
      aria-label={
        romanization ? `Character ${character}, ${romanization}` : `Character ${character}`
      }
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
