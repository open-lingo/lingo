import type { Dispatch, SetStateAction } from "react";
import type { TFunction } from "i18next";
import { Icon } from "@/shared/components/Icon";
import { DecoratedAvatar } from "@/shared/components/DecoratedAvatar";
import type { FriendshipStatus, PublicProfileLeague } from "@/shared/api/social";
import type { getBannerStyle } from "@/features/shop/bannerStyles";
import type { getDecoratorStyle } from "@/features/shop/decoratorStyles";
import type { OwnProfileDraft } from "../useOwnProfile";
import type { ActionState } from "../useProfileRelationshipActions";
import { FriendshipPill, PrimaryAction } from "./FriendshipActions";
import { LeagueEmblem } from "./LeagueEmblem";

type ProfileMastheadProps = {
  username: string;
  displayName: string;
  avatarSrc?: string;
  bio: string | null;
  isSelf: boolean;
  editMode: boolean;
  draft: OwnProfileDraft;
  setDraft: Dispatch<SetStateAction<OwnProfileDraft>>;
  saveError: string | null;
  hasBanner: boolean;
  bannerStyle: ReturnType<typeof getBannerStyle>;
  decoratorStyle: ReturnType<typeof getDecoratorStyle>;
  equippedTitleText: string | null;
  friendship: FriendshipStatus | null;
  lastActiveLabel: string;
  joined: string;
  league: PublicProfileLeague | null;
  actionState: ActionState;
  onAddFriend: () => void;
  onAccept: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  viewerIsAdmin: boolean;
  onImpersonate: () => void;
  onEditAvatar: () => void;
  t: TFunction;
};

/**
 * ProfileMasthead — the profile header block. When a banner is equipped it
 * becomes the backdrop the masthead sits ON TOP of (Twitter/Discord
 * profile-header pattern): the SVG fills the block as an absolute
 * background under a legibility scrim, the avatar straddles the banner's
 * bottom edge, and masthead text picks up banner text-shadows.
 *
 * In edit mode (self only) the display-name heading and bio paragraph swap
 * their text for inline inputs positioned to match — the page IS the editor,
 * there's no separate form section.
 */
export function ProfileMasthead({
  username,
  displayName,
  avatarSrc,
  bio,
  isSelf,
  editMode,
  draft,
  setDraft,
  saveError,
  hasBanner,
  bannerStyle,
  decoratorStyle,
  equippedTitleText,
  friendship,
  lastActiveLabel,
  joined,
  league,
  actionState,
  onAddFriend,
  onAccept,
  onUnblock,
  onUnfriend,
  onBlock,
  viewerIsAdmin,
  onImpersonate,
  onEditAvatar,
  t,
}: ProfileMastheadProps) {
  return (
    <header
      className={
        "relative " +
        (hasBanner ? "overflow-hidden rounded-card p-4 sm:p-5" : "")
      }
    >
      {/* Banner fills the entire masthead block as a background. The
          SVG slices to cover at any aspect ratio so the art always
          fills edge-to-edge. A scrim layer above the SVG keeps the
          text legible regardless of banner brightness. */}
      {bannerStyle && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <bannerStyle.Svg
              preserveAspectRatio="xMidYMid slice"
              className="block h-full w-full"
            />
          </div>
          <div
            aria-hidden
            role="img"
            aria-label={bannerStyle.label}
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/45"
          />
        </>
      )}
      <div className="relative z-10">
        <p
          className={
            "text-xs font-medium uppercase tracking-wide " +
            (hasBanner
              ? "text-white/90 text-shadow-banner-soft"
              : "text-text-muted")
          }
        >
          {t("profile.publicKicker", "Learner Profile")}
          <span aria-hidden className="mx-2 opacity-50">·</span>
          <span>@{username}</span>
        </p>

        {isSelf && editMode && saveError && (
          <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {saveError}
          </p>
        )}

        <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
          <div className="min-w-0">
            {isSelf && editMode ? (
              <input
                type="text"
                value={draft.displayName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, displayName: e.target.value }))
                }
                placeholder={t("profile.realNamePlaceholder", "Your name")}
                aria-label={t("profile.realName", "Display name")}
                className="w-full break-words border-b-2 border-accent/40 bg-transparent text-3xl font-bold tracking-tight text-text-primary outline-none focus:border-accent sm:text-4xl"
              />
            ) : (
              <h1
                className={
                  "break-words text-3xl font-bold tracking-tight sm:text-4xl " +
                  (hasBanner
                    ? "text-white text-shadow-banner"
                    : "text-text-primary")
                }
              >
                {displayName}
              </h1>
            )}

            {/* Equipped title — render under the heading. Acts as a
                subtitle / honorific. */}
            {equippedTitleText && (
              <p
                className={
                  "mt-1 inline-flex items-center gap-1.5 text-sm font-medium " +
                  (hasBanner
                    ? "text-white/95 text-shadow-banner-soft"
                    : "text-accent")
                }
              >
                <Icon name="crown" size={14} strokeWidth={2.25} aria-hidden />
                {equippedTitleText}
              </p>
            )}

            {/* Byline row: friendship pill + last-active. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <FriendshipPill status={friendship} t={t} />
              {lastActiveLabel && (
                <span
                  className={
                    "inline-flex items-center gap-1.5 text-xs " +
                    (hasBanner
                      ? "text-white/90 text-shadow-banner-soft"
                      : "text-text-muted")
                  }
                >
                  <span
                    aria-hidden
                    className={
                      "inline-block h-1.5 w-1.5 rounded-full " +
                      (hasBanner ? "bg-white/70" : "bg-text-muted/60")
                    }
                  />
                  {lastActiveLabel}
                </span>
              )}
              {joined && (
                <span
                  className={
                    "text-xs " +
                    (hasBanner
                      ? "text-white/90 text-shadow-banner-soft"
                      : "text-text-muted")
                  }
                >
                  <span aria-hidden className="mr-1.5 opacity-50">·</span>
                  {t("profile.publicJoinedShort", "Joined")} {joined}
                </span>
              )}
            </div>

            {/* Bio. In edit mode this becomes a textarea inline at
                the same visual position; otherwise it's a paragraph. */}
            {isSelf && editMode ? (
              <textarea
                value={draft.bio}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, bio: e.target.value }))
                }
                placeholder={t(
                  "profile.statusPlaceholder",
                  "Tell people about yourself",
                )}
                aria-label={t("profile.status", "Bio")}
                rows={2}
                className="mt-4 w-full max-w-prose resize-y rounded-md border border-border bg-transparent px-2 py-1.5 text-sm leading-relaxed text-text-secondary outline-none focus:border-accent"
              />
            ) : (
              bio && (
                <p
                  className={
                    "mt-4 max-w-prose text-sm leading-relaxed " +
                    (hasBanner
                      ? "text-white/95 text-shadow-banner-soft"
                      : "text-text-secondary")
                  }
                >
                  {bio}
                </p>
              )
            )}
          </div>

          {/* Right column: avatar + non-self friendship action.
              Self-owner controls (edit / inventory / save / cancel)
              live exclusively in the top-right action bar above.

              When a banner is equipped, the avatar gets pulled UP so
              it straddles the banner/content boundary. The
              surface-colored ring acts as a halo against any banner
              hue and gives a "lifted out of the banner" affordance. */}
          <div className="flex items-start justify-start gap-4 sm:flex-col sm:items-end sm:gap-3">
            <div
              className={
                "relative " +
                (hasBanner
                  ? "rounded-full bg-surface p-1 shadow-lg ring-4 ring-surface"
                  : "")
              }
            >
              <DecoratedAvatar
                name={displayName}
                src={avatarSrc}
                size="lg"
                className="!h-20 !w-20 !text-3xl"
                decoratorStyle={decoratorStyle}
              />
              {league && <LeagueEmblem league={league} />}
              {/* Camera overlay — only when the owner is editing.
                  Sits on the bottom-right of the avatar. Stops event
                  propagation so the avatar itself never reacts. */}
              {isSelf && editMode && (
                <button
                  type="button"
                  aria-label={t(
                    "profile.avatarEditAria",
                    "Change profile picture",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAvatar();
                  }}
                  className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md ring-2 ring-surface transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <Icon name="camera" size={14} strokeWidth={2.25} aria-hidden />
                </button>
              )}
            </div>
            {!isSelf && (
              <div className="flex items-center gap-2">
                <PrimaryAction
                  status={friendship}
                  actionState={actionState}
                  onAddFriend={onAddFriend}
                  onAccept={onAccept}
                  onUnblock={onUnblock}
                  onUnfriend={onUnfriend}
                  onBlock={onBlock}
                  canImpersonate={viewerIsAdmin}
                  onImpersonate={onImpersonate}
                  t={t}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
