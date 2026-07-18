import type { CSSProperties } from "react";
import type { PublicProfileLeague } from "@/shared/api/social";

/**
 * League emblem — brass-foil gradient with a subtle ring, positioned over
 * the avatar's lower-right like a decoration pin. Brass reads as brass on
 * any theme so the hardcoded color values stay put.
 */
export function LeagueEmblem({ league }: { league: PublicProfileLeague }) {
  const BRASS_GRADIENT =
    "linear-gradient(135deg, #d4a857 0%, #f7e2a3 38%, #c08a3a 62%, #efd382 100%)";
  const ringStyle: CSSProperties = {
    backgroundImage: BRASS_GRADIENT,
    boxShadow:
      "0 0 0 2px var(--color-surface), 0 4px 12px -2px rgba(193,138,55,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
  };
  return (
    <div
      className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full"
      style={ringStyle}
      role="img"
      aria-label={`${league.name} league`}
      title={league.name}
    >
      <span className="text-base leading-none drop-shadow-sm" aria-hidden>
        {league.emoji}
      </span>
    </div>
  );
}
