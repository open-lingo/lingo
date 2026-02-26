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
      className={`flex flex-col items-center justify-center rounded-lg border border-border bg-surface font-medium text-text-primary shadow-card transition hover:border-border-muted hover:shadow-popover ${
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
        <span className="mt-0.5 text-sm font-normal text-text-muted">
          {romanization}
        </span>
      )}
    </div>
  );
}
