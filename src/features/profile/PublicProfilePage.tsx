/**
 * PublicProfilePage — global ``/u/:username`` route. Visible to logged-out
 * viewers; works for self / friend / stranger views.
 *
 * Renders the correct primary action for the viewer↔target relationship:
 *
 *   ``self``         → "Edit profile" (toggles the inline edit form)
 *   ``none``         → "Add friend" (POST /social/v1/friends/requests)
 *   ``request_out``  → "Request sent" (disabled)
 *   ``request_in``   → "Accept request" (POST .../accept)
 *   ``friend``       → "Friends" w/ dropdown to Unfriend / Block
 *   ``blocked``      → "Unblock" (DELETE /social/v1/blocks/{id})
 *
 * When the social endpoint 404s the page renders a "private profile" panel
 * — see usePublicProfile for the visibility flow.
 *
 * Self-only affordances:
 *   - Inline edit form (toggled by "Edit profile")
 *   - "Inventory" button → slides a popout in from the right with
 *     `InventorySection` (equip / unequip decorators)
 *
 * Typography: uses the app's standard font tokens (Tailwind defaults +
 * theme tokens). No custom Google Fonts injection — the page should look
 * like the rest of the app, not a magazine feature.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { ApiError } from "@/shared/api/client";
import type { AuthoredDeckSample, FriendshipStatus } from "@/shared/api/social";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { DecoratedAvatar } from "@/shared/components/DecoratedAvatar";
import { useEquippedDecorator } from "@/features/shop/useEquippedDecorator";
import { useEquippedTitle } from "@/features/shop/useEquippedTitle";
import { useEquippedBanner } from "@/features/shop/useEquippedBanner";
import { TITLE_ITEMS } from "@/features/shop/shopCatalog";
import { InventorySection } from "@/features/shop/InventorySection";
import { InventoryPopout } from "@/features/shop/InventoryPopout";
import { ModalBase } from "@/shared/components/ModalBase";
import { usePublicProfile } from "./usePublicProfile";
import { useOwnProfile } from "./useOwnProfile";

type ActionState = "idle" | "pending" | "done";

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatJoinDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
}

/**
 * Format a last-active timestamp. Recent activity collapses to relative
 * ("active 2h ago"), older falls back to absolute ("last seen May 25").
 */
function formatLastActive(
  iso: string | null | undefined,
  locale: string,
  t: TFunction,
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const deltaMs = Date.now() - d.getTime();
  if (deltaMs < 0) {
    return t("profile.publicLastActiveNow", "active now");
  }
  const mins = Math.floor(deltaMs / 60_000);
  if (mins < 1) return t("profile.publicLastActiveNow", "active now");
  if (mins < 60) return `active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `active ${days}d ago`;
  return `last seen ${d.toLocaleDateString(locale, { month: "short", day: "numeric" })}`;
}

/**
 * Approximate XP curve for the "XP to next level" display. Mirrors the
 * back-end progression at a glance; exact values aren't load-bearing here
 * since the backend authoritatively assigns levels.
 */
function xpToNextLevel(level: number, xp: number): number {
  const nextThreshold = (level + 1) * 100 * (1 + (level - 1) * 0.15);
  const remaining = Math.max(0, Math.ceil(nextThreshold - xp));
  return remaining;
}

/**
 * Progress through the current level as a 0..1 fraction. Used by the
 * hairline progress bar under the level chip; same approximation as
 * xpToNextLevel above (backend is authoritative for the level number).
 */
function levelProgress(level: number, xp: number): number {
  const prev = level * 100 * (1 + Math.max(0, level - 2) * 0.15);
  const next = (level + 1) * 100 * (1 + (level - 1) * 0.15);
  const span = Math.max(1, next - prev);
  return Math.min(1, Math.max(0, (xp - prev) / span));
}

function formatLearningLanguage(
  code: string | null | undefined,
): { label: string; flag: string | null } | null {
  if (!code) return null;
  const cfg = getLanguageConfig(code);
  if (cfg) return { label: cfg.name, flag: cfg.flag };
  return { label: code.toUpperCase(), flag: null };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { social } = useApi();
  const { login, isAuthenticated } = useAuth();

  const { user, social: socialProfile, isPrivate, notFound, isLoading, isError, refetch } =
    usePublicProfile(username);

  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const friendship: FriendshipStatus | null | undefined = socialProfile?.friendship_status;

  // Prefer enriched social fields, fall back to plain user fields.
  // These are derived before any early return so they’re stable across renders.
  const displayName = socialProfile?.display_name ?? user?.display_name ?? username ?? "";
  const avatarSrc =
    socialProfile?.profile_picture_key ?? user?.profile_picture_key ?? undefined;
  const bio = socialProfile?.bio ?? user?.bio ?? null;

  // Register mode — set when HomePage redirects an authenticated viewer
  // here because their backend record doesn't exist yet (?register=1).
  // The page treats the URL username as the seed for the registration
  // form and calls ``users.register`` on save.
  const registerMode = isAuthenticated && notFound && searchParams.get("register") === "1";

  // Own-profile hooks — must be above any early returns (Rules of Hooks).
  const isSelf = friendship === "self";
  const ownProfileInitial = {
    displayName,
    bio: bio ?? "",
    avatarUrl: avatarSrc ?? "",
    username: username ?? "",
  };
  const {
    editMode,
    draft,
    setDraft,
    openEdit,
    cancelEdit,
    save,
    isSaving,
    saveError,
  } = useOwnProfile(ownProfileInitial, { registerMode });

  // Auto-open the edit form when arriving in register mode so the form is
  // the page's primary content rather than buried behind a button.
  useEffect(() => {
    if (registerMode) {
      openEdit({
        displayName: "",
        bio: "",
        avatarUrl: "",
        username: username ?? "",
      });
    }
    // openEdit is stable enough — depending on it would re-fire the
    // effect every state change on the hook; we only want this once
    // per arrival in register mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerMode, username]);

  const { style: decoratorStyle } = useEquippedDecorator();
  const { equippedId: equippedTitleId } = useEquippedTitle();
  const { style: bannerStyle } = useEquippedBanner();

  // Resolve the wear-text for the equipped title (e.g. "Night Owl"). Only
  // shown when the viewer is on their OWN profile — until the social
  // endpoint surfaces another user's equipped title, leaking the viewer's
  // title onto a stranger's masthead would be misleading.
  const equippedTitleText = (() => {
    if (!isSelf || !equippedTitleId) return null;
    const item = TITLE_ITEMS.find((i) => i.id === equippedTitleId);
    if (!item) return null;
    const base = item.titleKey.replace(/\.title$/, "");
    return t(`shop.items.${base}.wear`, {
      defaultValue: t(`shop.items.${item.titleKey}`, { defaultValue: item.id }),
    });
  })();

  if (!username) {
    return <ProfileShell heading={t("profile.publicNotFound", "Profile not found")} />;
  }
  if (isLoading) {
    return (
      <ProfileShell heading={t("profile.publicLoading", "Loading profile…")}>
        <div className="motion-safe:animate-pulse text-sm text-text-muted">…</div>
      </ProfileShell>
    );
  }
  if (registerMode) {
    return (
      <ProfileShell
        heading={t("profile.registerHeading", "Pick your username")}
      >
        <p className="mb-6 text-sm text-text-secondary">
          {t(
            "profile.registerDesc",
            "Your username is how friends find you. You can edit your display name and bio later.",
          )}
        </p>
        <RegisterForm
          draft={draft}
          setDraft={setDraft}
          save={save}
          isSaving={isSaving}
          saveError={saveError}
          t={t}
        />
      </ProfileShell>
    );
  }
  if (notFound || (!user && !socialProfile && !isPrivate)) {
    return (
      <ProfileShell heading={t("profile.publicNotFound", "Profile not found")}>
        <p className="text-sm text-text-secondary">
          {t(
            "profile.publicNotFoundDesc",
            "We couldn’t find a learner with that username.",
          )}
        </p>
      </ProfileShell>
    );
  }
  if (isPrivate) {
    return (
      <ProfileShell heading={t("profile.publicPrivate", "This profile is private")}>
        <p className="text-sm text-text-secondary">
          {t(
            "profile.publicPrivateDesc",
            "Only friends can view this learner’s profile.",
          )}
        </p>
      </ProfileShell>
    );
  }
  if (isError) {
    return (
      <ProfileShell heading={t("profile.publicError", "Something went wrong")}>
        <p className="text-sm text-text-secondary">
          {t("profile.publicErrorDesc", "Please try again.")}
        </p>
      </ProfileShell>
    );
  }

  const learningLanguage = socialProfile?.learning_language ?? null;
  const xp = socialProfile?.xp ?? 0;
  const streak = socialProfile?.streak ?? 0;
  const joined = formatJoinDate(socialProfile?.joined_at ?? user?.created_at, i18n.language);
  const lingots = socialProfile?.lingots ?? 0;
  const level = socialProfile?.level ?? 1;
  const lastActiveLabel = formatLastActive(
    socialProfile?.last_active_date,
    i18n.language,
    t,
  );
  const lang = formatLearningLanguage(learningLanguage);
  const authoredCount = socialProfile?.authored_deck_count ?? 0;
  const authoredSample: AuthoredDeckSample[] =
    socialProfile?.authored_decks_sample ?? [];
  const xpRemaining = xpToNextLevel(level, xp);
  const progress = levelProgress(level, xp);
  const league = socialProfile?.league ?? null;

  async function runAction(p: Promise<unknown>, successOnDone = true) {
    setActionState("pending");
    setActionError(null);
    try {
      await p;
      setActionState(successOnDone ? "done" : "idle");
      await refetch();
    } catch (err) {
      setActionState("idle");
      setActionError(
        err instanceof ApiError && typeof err.body === "object" && err.body && "detail" in err.body
          ? String((err.body as { detail?: unknown }).detail)
          : t("profile.publicActionFailed", "Could not complete that action."),
      );
    }
  }

  function handleAddFriend() {
    if (!isAuthenticated) {
      login();
      return;
    }
    // Backend expects snake_case body fields. The legacy SocialApi types alias
    // them as camelCase; spread both so the request lands intact regardless of
    // which spelling Pydantic reads.
    void runAction(
      social.sendFriendRequest({
        toUsername: username!,
        ...({ to_username: username! } as Record<string, string>),
      } as Parameters<typeof social.sendFriendRequest>[0]),
    );
  }
  function handleAccept() {
    if (!socialProfile) return;
    void runAction(social.acceptFriendRequest(socialProfile.user_id));
  }
  function handleUnblock() {
    if (!socialProfile) return;
    void runAction(social.unblockUser(socialProfile.user_id));
  }
  function handleUnfriend() {
    if (!socialProfile) return;
    void runAction(social.unfriend(socialProfile.user_id));
  }
  function handleBlock() {
    if (!socialProfile) return;
    void runAction(social.blockUser(socialProfile.user_id));
  }

  // Banner-as-header mode: the equipped banner becomes a backdrop the
  // masthead sits ON TOP of (Twitter/Discord profile-header pattern).
  // We reserve vertical space on the article via top padding so the
  // header content slides down behind/onto the absolutely-positioned
  // banner. The avatar is pulled up (negative margin) so it straddles
  // the banner's bottom edge, and the owner action bar (Edit / Save /
  // Cancel / Inventory) floats top-right ON the banner with a subtle
  // surface-pill so it stays legible against any banner art.
  const hasBanner = !!bannerStyle;
  // Banner sizing — Twitter/Discord proportions. Tall enough to read as a
  // real header, not a thin accent stripe. Banner is also shifted down a
  // tinge from the article's top edge so there's a small breath of page
  // background above it (avoids the slammed-against-the-top look).
  const bannerBackdropClass = hasBanner ? "h-[200px] sm:h-[280px]" : "";
  const bannerTopOffsetClass = hasBanner ? "top-4 sm:top-5" : "";
  // Per-button surface-pill backdrop so the ghost-variant owner
  // controls stay legible over any banner art (otherwise icon + label
  // can smear into vaporwave magenta / sunset orange).
  const ownerPillOverBanner =
    "!bg-surface/85 !backdrop-blur-sm !shadow-sm hover:!bg-surface";

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <article data-testid="public-profile-card" className="relative">
        {/* ── Banner backdrop (optional) ───────────────────────────
              When the viewer has equipped a banner, it renders as an
              absolutely-positioned strip behind the masthead. The
              article reserves vertical room via padding-top below, and
              the masthead sits with raised z-index so it overlays.
              When no banner is equipped, nothing here renders and the
              page looks identical to its pre-banner state. */}
        {bannerStyle && (
          <div
            className={`pointer-events-none absolute inset-x-0 -mx-5 overflow-hidden rounded-xl sm:-mx-8 ${bannerTopOffsetClass} ${bannerBackdropClass}`}
            role="img"
            aria-label={bannerStyle.label}
          >
            <bannerStyle.Svg
              preserveAspectRatio="xMidYMid slice"
              className="block h-full w-full"
            />
            {/* Bottom-to-top gradient so the byline metadata + bio that
                spills past the banner's bottom edge fades into the page
                background instead of slamming into it. */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-black/15"
            />
          </div>
        )}

        {/* ── Owner action bar (top-right) ─────────────────────────
              The canonical home for owner controls (Edit / Save /
              Cancel / Inventory). Floated above the masthead so it's
              available regardless of where in the profile the user is
              reading, and it never collides with content. Renders
              only when the viewer owns the profile.

              When a banner is equipped, each button gets a subtle
              surface-pill background so it stays legible over busy
              banner art (the underlying Button "ghost" variant has no
              fill on its own). */}
        {isSelf && (
          <div
            data-testid="public-profile-actions"
            className={
              "z-20 flex flex-wrap items-center justify-end gap-2 " +
              (hasBanner
                ? "absolute right-3 top-3 sm:right-4 sm:top-4"
                : "relative mb-4")
            }
          >
            {editMode ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => save()}
                >
                  {isSaving
                    ? t("common.loading", "Saving…")
                    : t("profile.save", "Save")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  className={hasBanner ? ownerPillOverBanner : undefined}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  openEdit({
                    displayName,
                    bio: bio ?? "",
                    avatarUrl: avatarSrc ?? "",
                  })
                }
                className={`!gap-1.5 ${hasBanner ? ownerPillOverBanner : ""}`}
              >
                <Icon name="pencil" size={14} strokeWidth={2.25} aria-hidden />
                {t("profile.publicEditProfile", "Edit profile")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setInventoryOpen(true)}
              className={`!gap-1.5 ${hasBanner ? ownerPillOverBanner : ""}`}
            >
              <Icon name="package" size={14} strokeWidth={2.25} aria-hidden />
              {t("profile.publicInventoryCta", "Inventory")}
            </Button>
          </div>
        )}

        {/* ── Masthead ─────────────────────────────────────────────
              When the owner toggles "Edit profile" the display-name
              heading and the bio paragraph swap their text for inline
              <Input>/<Textarea> elements positioned and sized to match
              the displayed text. No separate "edit form" section — the
              page IS the editor.

              When a banner is equipped the masthead pads its top so the
              kicker + display name sit against the banner art, and the
              avatar's column gets a negative top offset so the avatar
              straddles the banner's bottom edge. */}
        <header
          className={
            "relative z-10 " +
            // Padding-top reserves room for the absolutely-positioned
            // banner so the masthead text sits ON the lower half of the
            // banner art. Sizes pair with bannerBackdropClass +
            // bannerTopOffsetClass above (banner ends at top + height:
            // 4+200=204 mobile / 5+280=285 desktop).
            (hasBanner ? "pt-[150px] sm:pt-[220px]" : "")
          }
        >
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
                  placeholder={t(
                    "profile.realNamePlaceholder",
                    "Your name",
                  )}
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
                  subtitle / honorific. Only visible on self profiles
                  until the social endpoint exposes other users' titles. */}
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
                <FriendshipPill status={friendship ?? null} t={t} />
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
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-text-secondary">
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
            <div
              className={
                "flex items-start justify-start gap-4 sm:flex-col sm:items-end sm:gap-3 " +
                // Negative margin tuned so the avatar straddles the
                // banner's bottom edge given the new taller banner +
                // top offset. See bannerBackdropClass math.
                (hasBanner ? "-mt-2 sm:-mt-4" : "")
              }
            >
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
                      setAvatarModalOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-md ring-2 ring-surface transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <Icon name="camera" size={14} strokeWidth={2.25} aria-hidden />
                  </button>
                )}
              </div>
              {!isSelf && (
                <PrimaryAction
                  status={friendship ?? null}
                  actionState={actionState}
                  onAddFriend={handleAddFriend}
                  onAccept={handleAccept}
                  onUnblock={handleUnblock}
                  onUnfriend={handleUnfriend}
                  onBlock={handleBlock}
                  t={t}
                />
              )}
            </div>
          </div>

          {/* Hairline divider between masthead and stats. */}
          <div aria-hidden className="mt-6 h-px w-full bg-border" />
        </header>

        {/* ── Stats grid ──────────────────────────────────────────── */}
        <section
          aria-label={t("profile.publicStatsLabel", "Profile stats")}
          data-testid="public-profile-stats"
          className="mt-8"
        >
          <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-y-0">
            <NumberStat
              icon="sparkles"
              label={t("profile.publicXpLabel", "XP")}
              value={xp.toLocaleString()}
            />
            <NumberStat
              icon="flame"
              label={t("profile.publicStreakLabel", "Day streak")}
              value={streak.toLocaleString()}
              accentValue={streak > 0}
            />
            <NumberStat
              icon="gem"
              label={t("profile.publicLingotsLabel", "Lingots")}
              value={lingots.toLocaleString()}
            />
            <NumberStat
              icon="graduationCap"
              label={t("profile.publicLevelLabel", "Level")}
              value={level.toLocaleString()}
              caption={`+${xpRemaining.toLocaleString()} XP to ${level + 1}`}
              progress={progress}
            />
          </dl>
        </section>

        {/* ── Decorator inventory popout (self only) ──────────────── */}
        {isSelf && (
          <InventoryPopout
            open={inventoryOpen}
            onClose={() => setInventoryOpen(false)}
          >
            <InventorySection
              hideHeading
              onAfterEquip={() => setInventoryOpen(false)}
            />
          </InventoryPopout>
        )}

        {/* ── Avatar URL modal (self + edit mode) ──────────────────
              Self-contained: the modal owns its pending/error state
              and calls `users.updateMe({ profile_picture_key })`
              directly so a user can change their picture without
              committing the rest of their inline edits. On success it
              syncs the draft so a subsequent Save doesn't clobber the
              new value, then closes + refetches. */}
        {isSelf && avatarModalOpen && (
          <AvatarUrlModal
            currentUrl={draft.avatarUrl}
            onClose={() => setAvatarModalOpen(false)}
            onSaved={(nextUrl) => {
              setDraft((d) => ({ ...d, avatarUrl: nextUrl }));
              setAvatarModalOpen(false);
              void refetch();
            }}
            t={t}
          />
        )}

        {/* ── Secondary context strip: learning language ──────────── */}
        {lang && (
          <section className="mt-10 flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("profile.publicLearningLabel", "Learning")}
            </span>
            <span className="inline-flex items-center gap-2 text-base font-medium text-text-primary">
              {lang.flag && (
                <span aria-hidden className="text-xl">
                  {lang.flag}
                </span>
              )}
              {lang.label}
            </span>
          </section>
        )}

        {/* ── Authored decks ──────────────────────────────────────── */}
        {authoredCount > 0 && (
          <section
            className="mt-10"
            data-testid="public-profile-authored"
            aria-labelledby="authored-heading"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
              <h2
                id="authored-heading"
                className="text-lg font-semibold text-text-primary"
              >
                {t("profile.publicAuthoredHeading", "Authored decks")}
              </h2>
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {authoredCount.toLocaleString()} {t("profile.publicAuthoredCount", "total")}
              </span>
            </div>
            <ul className="mt-2 divide-y divide-border-muted">
              {authoredSample.map((d) => (
                <DeckRow
                  key={d.id}
                  deck={d}
                  unnamedFallback={t("profile.publicUnnamedDeck", "(unnamed deck)")}
                />
              ))}
            </ul>
            {authoredCount > authoredSample.length && (
              <p className="mt-4 text-xs text-text-muted">
                {t("profile.publicAuthoredMore", "and")}{" "}
                {(authoredCount - authoredSample.length).toLocaleString()}{" "}
                {t("profile.publicAuthoredMoreSuffix", "more")}
              </p>
            )}
          </section>
        )}

        {actionError && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {actionError}
          </p>
        )}
      </article>
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * One slot in the stats grid. The numeral is the loud part; the label is
 * the small kicker above it. Separation comes from a vertical border
 * between siblings on tablet+.
 */
function NumberStat({
  icon,
  label,
  value,
  caption,
  accentValue,
  progress,
}: {
  icon: IconName;
  label: string;
  value: string;
  caption?: string;
  accentValue?: boolean;
  progress?: number; // 0..1, optional micro progress bar
}) {
  return (
    <div className="relative px-1 sm:px-5 sm:first:pl-0 sm:last:pr-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-border">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Icon name={icon} size={14} strokeWidth={2.25} aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div
        className={
          "mt-1.5 text-2xl font-semibold tabular-nums sm:text-3xl " +
          (accentValue ? "text-accent" : "text-text-primary")
        }
      >
        {value}
      </div>
      {caption && (
        <div className="mt-1.5 text-xs text-text-muted">{caption}</div>
      )}
      {typeof progress === "number" && (
        <div
          className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-border"
          aria-hidden
        >
          <div
            className="h-full bg-text-primary/70 transition-[width] duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * League emblem — brass-foil gradient with a subtle ring, positioned over
 * the avatar's lower-right like a decoration pin. Brass reads as brass on
 * any theme so the hardcoded color values stay put.
 */
function LeagueEmblem({
  league,
}: {
  league: { name: string; tier_index: number; emoji: string };
}) {
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

/**
 * One authored-deck row. Standard list item with arrow affordance on
 * hover — matches the rest of the app's list patterns.
 */
function DeckRow({
  deck,
  unnamedFallback,
}: {
  deck: AuthoredDeckSample;
  unnamedFallback: string;
}) {
  return (
    <li>
      <Link
        to={`/decks/${deck.id}`}
        className="group grid grid-cols-[1fr_auto] items-center gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-text-primary group-hover:text-accent">
            {deck.name || unnamedFallback}
          </h3>
          {deck.language && (
            <p className="mt-0.5 text-xs text-text-muted">
              {deck.language}
            </p>
          )}
        </div>
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-muted transition-all duration-200 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground group-hover:translate-x-0.5"
        >
          <Icon name="arrowRight" size={14} strokeWidth={2.25} />
        </span>
      </Link>
    </li>
  );
}

/** Fallback shell for loading / not-found / private / error states. */
function ProfileShell({
  heading,
  children,
}: {
  heading: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
        {heading}
      </h1>
      {children && <div className="mt-4">{children}</div>}
    </main>
  );
}

/**
 * Friendship pill — small chip that sits inline with the byline. No
 * background fill except for the destructive states; this is metadata,
 * not a call to action.
 */
function FriendshipPill({
  status,
  t,
}: {
  status: FriendshipStatus | null;
  t: TFunction;
}) {
  if (!status || status === "self" || status === "none") return null;

  const labelAndIcon: { label: string; icon: IconName; tone: string } | null =
    status === "friend"
      ? {
          label: t("profile.badgeFriend", "Friends"),
          icon: "check",
          tone: "border-accent/40 text-accent bg-accent-muted/40",
        }
      : status === "request_in"
        ? {
            label: t("profile.badgeRequestIn", "Wants to be friends"),
            icon: "userPlus",
            tone: "border-border text-text-secondary bg-surface-muted",
          }
        : status === "request_out"
          ? {
              label: t("profile.badgeRequestOut", "Request pending"),
              icon: "users",
              tone: "border-border text-text-muted bg-surface-muted",
            }
          : status === "blocked"
            ? {
                label: t("profile.badgeBlocked", "Blocked"),
                icon: "shield",
                tone: "border-error/40 text-error bg-error/10",
              }
            : null;

  if (!labelAndIcon) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${labelAndIcon.tone}`}
    >
      <Icon name={labelAndIcon.icon} size={12} strokeWidth={2.5} aria-hidden />
      {labelAndIcon.label}
    </span>
  );
}

function PrimaryAction({
  status,
  actionState,
  onAddFriend,
  onAccept,
  onUnblock,
  onUnfriend,
  onBlock,
  t,
}: {
  status: FriendshipStatus | null;
  actionState: ActionState;
  onAddFriend: () => void;
  onAccept: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  t: TFunction;
}) {
  const busy = actionState === "pending";

  // status === "self" is handled by the top-right action bar; the right
  // column never renders a self action here.
  if (status === "self") return null;
  if (status === "request_out") {
    return (
      <Button type="button" disabled variant="ghost" size="sm">
        {t("profile.publicRequestSent", "Request sent")}
      </Button>
    );
  }
  if (status === "request_in") {
    return (
      <Button type="button" onClick={onAccept} disabled={busy} variant="primary" size="sm">
        {busy ? "…" : t("profile.publicAcceptRequest", "Accept request")}
      </Button>
    );
  }
  if (status === "friend") {
    return (
      <FriendDropdown
        onUnfriend={onUnfriend}
        onBlock={onBlock}
        busy={busy}
        t={t}
      />
    );
  }
  if (status === "blocked") {
    return (
      <Button type="button" onClick={onUnblock} disabled={busy} variant="ghost" size="sm">
        {busy ? "…" : t("profile.publicUnblock", "Unblock")}
      </Button>
    );
  }
  // status === "none" or null (logged-out viewer)
  return (
    <Button type="button" onClick={onAddFriend} disabled={busy} variant="primary" size="sm">
      {busy ? "…" : t("profile.publicAddFriend", "Add friend")}
    </Button>
  );
}

function FriendDropdown({
  onUnfriend,
  onBlock,
  busy,
  t,
}: {
  onUnfriend: () => void;
  onBlock: () => void;
  busy: boolean;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        className="!gap-1.5"
      >
        {busy ? "…" : t("profile.publicFriends", "Friends")}
        <Icon name="chevronDown" size={13} strokeWidth={2.25} aria-hidden />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-border bg-surface py-1 shadow-popover"
        >
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
            onClick={() => {
              setOpen(false);
              onUnfriend();
            }}
          >
            {t("profile.publicUnfriend", "Unfriend")}
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10"
            onClick={() => {
              setOpen(false);
              onBlock();
            }}
          >
            {t("profile.publicBlock", "Block")}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * AvatarUrlModal — owner-only modal for changing the profile picture.
 *
 * Two sections:
 *   - Paste a URL (live): text input + Save. Validates basic shape.
 *   - Upload from device (disabled): visible affordance but `<input
 *     disabled>` + capture overlay + tooltip explaining custom uploads
 *     are intentional-future, not broken.
 *
 * Backend field: `profile_picture_key` (see UpdateUserPayload). The
 * field name is historical — it accepts a full URL string today.
 */
function AvatarUrlModal({
  currentUrl,
  onClose,
  onSaved,
  t,
}: {
  currentUrl: string;
  onClose: () => void;
  onSaved: (nextUrl: string) => void;
  t: TFunction;
}) {
  const { users } = useApi();
  const [url, setUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function isValidUrl(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true; // empty = clear, allowed
    if (!/^https?:\/\//i.test(trimmed)) return false;
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSave() {
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setError(
        t("profile.avatarModalUrlInvalid", "Enter a valid http:// or https:// URL."),
      );
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await users.updateMe({ profile_picture_key: trimmed || null });
      onSaved(trimmed);
    } catch (err) {
      if (
        err instanceof ApiError &&
        typeof err.body === "object" &&
        err.body &&
        "detail" in err.body
      ) {
        setError(String((err.body as { detail?: unknown }).detail));
      } else {
        setError(t("profile.publicActionFailed", "Could not complete that action."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalBase
      title={t("profile.avatarModalTitle", "Profile picture")}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-6 px-6 py-5">
        {/* ── URL section ──────────────────────────────────────── */}
        <section>
          <h3 className="text-sm font-semibold text-text-primary">
            {t("profile.avatarModalUrlSection", "Paste a URL")}
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            {t(
              "profile.avatarModalUrlDesc",
              "Link to a publicly-hosted image (JPG, PNG, or WebP).",
            )}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSave();
                }
              }}
              placeholder="https://..."
              aria-label={t("profile.avatarUrl", "Profile picture URL")}
              className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving
                ? t("common.loading", "Saving…")
                : t("profile.avatarModalUrlSave", "Save")}
            </Button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-2 rounded-md border border-error/40 bg-error/10 px-2.5 py-1.5 text-xs text-error"
            >
              {error}
            </p>
          )}
        </section>

        {/* ── Upload section (disabled placeholder) ────────────── */}
        <section className="border-t border-border pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-text-muted">
              {t("profile.avatarModalUploadSection", "Upload from your device")}
            </h3>
            <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {t("profile.avatarModalUploadComingSoon", "Coming soon")}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {t(
              "profile.avatarModalUploadDesc",
              "Custom uploads aren't supported yet — coming soon.",
            )}
          </p>
          {/* Wrapper absorbs clicks so the disabled <input> can't even
              open a file picker — defends against browser quirks where
              `disabled` is treated as advisory. */}
          <div
            className="relative mt-3 cursor-not-allowed"
            title={t(
              "profile.avatarModalUploadDisabledTitle",
              "Coming soon — we'll support custom uploads once storage is cheaper",
            )}
          >
            <input
              type="file"
              accept="image/*"
              disabled
              aria-disabled="true"
              tabIndex={-1}
              className="block w-full cursor-not-allowed rounded-md border border-dashed border-border bg-surface-muted px-3 py-2 text-xs text-text-muted opacity-60"
            />
            {/* Transparent overlay that swallows clicks. */}
            <div
              aria-hidden
              className="absolute inset-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>
        </section>
      </div>
    </ModalBase>
  );
}

/**
 * RegisterForm — first-time username + display name capture. Rendered
 * when the page is reached via the HomePage 404→register redirect.
 *
 * The same ``useOwnProfile`` draft state powers this form; the parent
 * passes ``registerMode: true`` so save POSTs to ``users.register``.
 */
function RegisterForm({
  draft,
  setDraft,
  save,
  isSaving,
  saveError,
  t,
}: {
  draft: {
    displayName: string;
    bio: string;
    avatarUrl: string;
    username?: string;
  };
  setDraft: React.Dispatch<
    React.SetStateAction<{
      displayName: string;
      bio: string;
      avatarUrl: string;
      username?: string;
    }>
  >;
  save: () => void;
  isSaving: boolean;
  saveError: string | null;
  t: TFunction;
}) {
  return (
    <form
      className="space-y-5 rounded-xl border border-border bg-surface p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {saveError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {saveError}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          {t("profile.username", "Username")}
        </label>
        <Input
          value={draft.username ?? ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, username: e.target.value }))
          }
          placeholder="@username"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          {t("profile.realName", "Display name")}
        </label>
        <Input
          value={draft.displayName}
          onChange={(e) =>
            setDraft((d) => ({ ...d, displayName: e.target.value }))
          }
          placeholder={t("profile.realNamePlaceholder", "Your name")}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
          {isSaving
            ? t("common.loading", "Saving…")
            : t("profile.registerCta", "Continue")}
        </Button>
      </div>
    </form>
  );
}

export default PublicProfilePage;
