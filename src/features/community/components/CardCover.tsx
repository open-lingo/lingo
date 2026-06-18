import { useState } from "react";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";
import type { MarketplaceKind } from "../hooks/useMarketplaceContent";

const KIND_ICON: Record<MarketplaceKind, IconName> = {
  "flashcard-pack": "decks",
  story: "stories",
  course: "graduationCap",
};

/**
 * Deterministic gradient seed from a string id so a placeholder cover is stable
 * per item (no flicker between renders) without depending on the network.
 */
function seedHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export type CardCoverProps = {
  id: string;
  kind: MarketplaceKind;
  /** Resolved cover URL, or null/undefined when the item has no image. */
  src?: string | null;
  className?: string;
  /** Tailwind hover transform applied to the <img> (and skipped on the placeholder). */
  imgClassName?: string;
};

/**
 * CardCover — content cover art with a built-in local placeholder.
 *
 * When there is no image (or the remote image fails to load) we render a
 * branded gradient tile with the content-kind glyph instead of leaving a hole
 * in the mosaic. The gradient hue is seeded from the item id so it stays
 * stable and visually varied across the grid.
 */
export function CardCover({ id, kind, src, className, imgClassName }: CardCoverProps) {
  const [errored, setErrored] = useState(false);
  const showPlaceholder = !src || errored;
  const hue = seedHue(id);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-surface-muted", className)}>
      {showPlaceholder ? (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 30%))`,
          }}
        >
          <Icon name={KIND_ICON[kind]} size={40} className="text-white/45" aria-hidden />
        </div>
      ) : (
        <img
          src={src ?? undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
