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
 * The page is a composition shell: the masthead, stats, friendship actions,
 * modals, and formatters live in sibling files under `features/profile/`.
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import type { FriendshipStatus } from "@/shared/api/social";
import { useMe } from "@/shared/hooks/useMe";
import { canAccessSiteAdmin } from "@/shared/auth/roles";
import { useStartImpersonation } from "@/features/admin/impersonation/useStartImpersonation";
import { ImpersonateConfirmModal } from "@/features/admin/impersonation/ImpersonateConfirmModal";
import { useAuthoredDecks } from "./useAuthoredDecks";
import { getDecoratorStyle } from "@/features/shop/decoratorStyles";
import { getBannerStyle } from "@/features/shop/bannerStyles";
import { TITLE_ITEMS } from "@/features/shop/shopCatalog";
import { InventorySection } from "@/features/shop/InventorySection";
import { InventoryPopout } from "@/features/shop/InventoryPopout";
import { usePublicProfile } from "./usePublicProfile";
import { useOwnProfile } from "./useOwnProfile";
import { useProfileRelationshipActions } from "./useProfileRelationshipActions";
import {
  formatJoinDate,
  formatLastActive,
  formatLearningLanguage,
  levelProgress,
  xpToNextLevel,
} from "./_profileFormatters";
import { ProfileShell } from "./components/ProfileShell";
import { ProfileMasthead } from "./components/ProfileMasthead";
import { NumberStat } from "./components/NumberStat";
import { AuthoredDecksTable } from "./components/AuthoredDecksTable";
import { AvatarUrlModal } from "./components/AvatarUrlModal";
import { RegisterForm } from "./components/RegisterForm";

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { social } = useApi();
  const { login, isAuthenticated } = useAuth();
  const { me } = useMe();
  const viewerIsAdmin = canAccessSiteAdmin(me?.role);

  const { user, social: socialProfile, isPrivate, notFound, isLoading, isError, refetch } =
    usePublicProfile(username);

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const { start: startImpersonation, pending: impersonating } =
    useStartImpersonation();

  // Per-deck upvotes + total, derived from the marketplace feed (the only
  // wire signal carrying voteCount). Used for the authored-decks table and
  // the "total upvotes" community-standing chip.
  const authored = useAuthoredDecks(socialProfile?.user_id);

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

  // Own-profile detection — friendship_status is the primary signal, but it's
  // absent when social is disabled. Fall back to matching the viewer's own
  // username (case-insensitive) / user id so the owner still gets the edit
  // affordance with social off.
  const isSelf =
    friendship === "self" ||
    (!!me?.username &&
      !!username &&
      me.username.toLowerCase() === username.toLowerCase()) ||
    (!!me?.id && !!socialProfile?.user_id && me.id === socialProfile.user_id);

  // Own-profile hooks — must be above any early returns (Rules of Hooks).
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

  const {
    actionState,
    actionError,
    handleAddFriend,
    handleAccept,
    handleUnblock,
    handleUnfriend,
    handleBlock,
  } = useProfileRelationshipActions({
    social,
    socialProfile,
    username,
    isAuthenticated,
    login,
    refetch,
    t,
  });

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

  // Equipped cosmetics come from the server-resolved owner state on the
  // public-profile response. Falling back to null gives the bare profile
  // for owners who haven't equipped anything (or older BEs that don't
  // ship the fields). Every viewer sees the owner's choices — not their
  // own — and the viewer's local equip mutations invalidate the
  // public-profile query so self-profile reflects the change instantly.
  const decoratorStyle = getDecoratorStyle(socialProfile?.equipped_decorator_id ?? null);
  const bannerStyle = getBannerStyle(socialProfile?.equipped_banner_id ?? null);
  const equippedTitleId = socialProfile?.equipped_title_id ?? null;

  // Resolve the wear-text for the equipped title (e.g. "Night Owl") so it
  // renders on every viewer's profile page (not just the owner).
  const equippedTitleText = (() => {
    if (!equippedTitleId) return null;
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
      <ProfileShell heading={t("profile.registerHeading", "Pick your username")}>
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
  // Prefer the live marketplace-derived deck count (carries upvotes); fall
  // back to the profile's authored_deck_count when the owner isn't in the
  // marketplace feed (e.g. unpublished-only authors).
  const authoredCount = authored.decks.length || (socialProfile?.authored_deck_count ?? 0);
  const xpRemaining = xpToNextLevel(level, xp);
  const progress = levelProgress(level, xp);
  const league = socialProfile?.league ?? null;

  const hasBanner = !!bannerStyle;
  // Per-button surface-pill backdrop so the ghost-variant owner
  // controls stay legible over any banner art (otherwise icon + label
  // can smear into vaporwave magenta / sunset orange).
  const ownerPillOverBanner =
    "!bg-surface/85 !backdrop-blur-sm !shadow-sm hover:!bg-surface";

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <article data-testid="public-profile-card" className="relative">
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

        <ProfileMasthead
          username={username}
          displayName={displayName}
          avatarSrc={avatarSrc}
          bio={bio}
          isSelf={isSelf}
          editMode={editMode}
          draft={draft}
          setDraft={setDraft}
          saveError={saveError}
          hasBanner={hasBanner}
          bannerStyle={bannerStyle}
          decoratorStyle={decoratorStyle}
          equippedTitleText={equippedTitleText}
          friendship={friendship ?? null}
          lastActiveLabel={lastActiveLabel}
          joined={joined}
          league={league}
          actionState={actionState}
          onAddFriend={handleAddFriend}
          onAccept={handleAccept}
          onUnblock={handleUnblock}
          onUnfriend={handleUnfriend}
          onBlock={handleBlock}
          viewerIsAdmin={viewerIsAdmin}
          onImpersonate={() => setImpersonateOpen(true)}
          onEditAvatar={() => setAvatarModalOpen(true)}
          t={t}
        />

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

        {/* ── Admin: act-as-user confirmation ─────────────────────── */}
        {viewerIsAdmin && impersonateOpen && socialProfile && (
          <ImpersonateConfirmModal
            targetUsername={socialProfile.username}
            targetDisplayName={socialProfile.display_name ?? ""}
            busy={impersonating}
            onCancel={() => setImpersonateOpen(false)}
            onConfirm={() => {
              void startImpersonation(socialProfile.user_id);
            }}
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

        {/* ── Authored decks ───────────────────────────────────────
              Deliberately narrower than the masthead/stats (max-w-2xl) so
              the creator section reads as a focused sub-panel rather than a
              full-width feature. The learner-profile portion above stays
              full width. */}
        {authoredCount > 0 && (
          <section
            className="mt-10 max-w-2xl"
            data-testid="public-profile-authored"
            aria-labelledby="authored-heading"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
              <h2
                id="authored-heading"
                className="text-lg font-semibold text-text-primary"
              >
                {t("profile.publicAuthoredHeading", "Authored decks")}
              </h2>
              <div className="flex items-center gap-3 text-xs font-medium text-text-muted">
                <span className="uppercase tracking-wide">
                  {authoredCount.toLocaleString()} {t("profile.publicAuthoredCount", "total")}
                </span>
                {/* Total upvotes across this creator's decks — a quick read
                    on their community standing. */}
                <span
                  className="inline-flex items-center gap-1 tabular-nums text-accent"
                  title={t("profile.publicTotalUpvotes", "Total upvotes")}
                >
                  <Icon name="chevronUp" size={13} strokeWidth={2.5} aria-hidden />
                  {authored.totalUpvotes.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <AuthoredDecksTable decks={authored.decks} t={t} />
            </div>
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

export default PublicProfilePage;
