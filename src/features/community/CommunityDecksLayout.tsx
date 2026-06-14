import { type ReactNode } from "react";
import { CommunityDiscoveryLayout } from "./CommunityDiscoveryLayout";

type CommunityDecksLayoutProps = {
  /** Optional search input rendered next to the primary CTA in the header row. */
  searchSlot?: ReactNode;
  /** Optional right rail (e.g. the create-page tips column). */
  rightRail?: ReactNode;
  /** Suppress the right rail entirely (focused-form pages). */
  hideRightRail?: boolean;
  children: ReactNode;
};

/**
 * CommunityDecksLayout — thin compatibility wrapper around the unified
 * CommunityDiscoveryLayout. Retained only for focused form pages (deck create)
 * that want the discovery nav plus an optional helper rail. New surfaces should
 * use CommunityDiscoveryLayout (discovery) or CommunityLibraryLayout (personal)
 * directly.
 */
export function CommunityDecksLayout({
  searchSlot,
  rightRail,
  hideRightRail = false,
  children,
}: CommunityDecksLayoutProps) {
  const showRail = !hideRightRail && rightRail;
  return (
    <CommunityDiscoveryLayout searchSlot={searchSlot}>
      {showRail ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">{children}</div>
          <aside className="hidden lg:block">
            <div className="sticky top-4">{rightRail}</div>
          </aside>
        </div>
      ) : (
        children
      )}
    </CommunityDiscoveryLayout>
  );
}
