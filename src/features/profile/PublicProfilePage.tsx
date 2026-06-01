/**
 * PublicProfilePage — global ``/u/:username`` route. Visible to logged-out
 * viewers; works for self / friend / stranger views.
 *
 * Renders the correct primary action for the viewer↔target relationship:
 *
 *   ``self``         → "Edit profile" (opens settings)
 *   ``none``         → "Add friend" (POST /social/v1/friends/requests)
 *   ``request_out``  → "Request sent" (disabled)
 *   ``request_in``   → "Accept request" (POST .../accept)
 *   ``friend``       → "Friends" w/ dropdown to Unfriend / Block
 *   ``blocked``      → "Unblock" (DELETE /social/v1/blocks/{id})
 *
 * When the social endpoint 404s the page renders a "private profile" panel
 * — see usePublicProfile for the visibility flow.
 *
 * ## Visual direction (2026-05-27)
 *
 * Editorial / magazine. Hierarchy is encoded in the type ramp itself —
 * Fraunces display serif for the name (one cliff drop to body sans), IBM
 * Plex Mono for the numeric stat row, IBM Plex Sans for everything else.
 * The page reads top-to-bottom like a feature opener: masthead → byline →
 * numeric "by the numbers" rail → bylined works (authored decks).
 *
 * Fonts are injected via <link> on mount so the rest of the app's lazy
 * font system is untouched.
 *
 * The league chip is the only place a hardcoded color lands — a brass
 * foil gradient that reads as "earned" in every theme. Everything else
 * goes through theme tokens (bg-surface / text-text-primary / etc.).
 */

import { useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { ApiError } from "@/shared/api/client";
import type { AuthoredDeckSample, FriendshipStatus } from "@/shared/api/social";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { DecoratedAvatar } from "@/shared/components/DecoratedAvatar";
import { useEquippedDecorator } from "@/features/shop/useEquippedDecorator";
import { InventorySection } from "@/features/shop/InventorySection";
import { usePublicProfile } from "./usePublicProfile";
import { useOwnProfile } from "./useOwnProfile";

type ActionState = "idle" | "pending" | "done";

// ─── Theme-driven typography ────────────────────────────────────────────────
// The page used to inject Fraunces + IBM Plex on mount. That made the profile
// page render in a fixed serif/sans pair regardless of which theme the user
// picked, which leaks aesthetic across the rest of the app. Now headings
// resolve to `var(--font-display)` (themes can set it) and numerics to
// `var(--font-family-mono)` (ditto). Both default to inherit so a vanilla
// theme renders in the body font — a theme like "Academia" can override.
const DISPLAY_FONT = "var(--font-display, inherit)";
const BODY_FONT = "var(--font-family, inherit)";
const MONO_FONT = "var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)";

/** No-op kept for the call-site below; previously injected Google Fonts at
 *  mount. Removed — theme system owns font loading via fontLoader.ts. */
function useEditorialFonts() {
  // Intentionally empty.
}

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
    // Future clock skew; render as "active now" rather than "in 2h".
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
  const { t, i18n } = useTranslation();
  const { social } = useApi();
  const { login, isAuthenticated } = useAuth();

  useEditorialFonts();

  const { user, social: socialProfile, isPrivate, notFound, isLoading, isError, refetch } =
    usePublicProfile(username);

  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  const friendship: FriendshipStatus | null | undefined = socialProfile?.friendship_status;

  // Prefer enriched social fields, fall back to plain user fields.
  // These are derived before any early return so they’re stable across renders.
  const displayName = socialProfile?.display_name ?? user?.display_name ?? username ?? "";
  const avatarSrc =
    socialProfile?.profile_picture_key ?? user?.profile_picture_key ?? undefined;
  const bio = socialProfile?.bio ?? user?.bio ?? null;

  // Own-profile hooks — must be above any early returns (Rules of Hooks).
  const isSelf = friendship === "self";
  const ownProfileInitial = {
    displayName,
    bio: bio ?? "",
    avatarUrl: avatarSrc ?? "",
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
  } = useOwnProfile(ownProfileInitial);

  const { style: decoratorStyle } = useEquippedDecorator();

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
  // Enriched fields. All optional on the type — degrade gracefully.
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

  return (
    <main
      className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14"
      style={{ fontFamily: BODY_FONT }}
    >
      <article data-testid="public-profile-card" className="relative">
        {/* ── Masthead ────────────────────────────────────────────── */}
        <header className="relative">
          {/* Eyebrow: small-caps "profile" label, sits above the name like a
              kicker on a magazine feature. */}
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            {t("profile.publicKicker", "Learner Profile")}
            <span aria-hidden className="mx-2 text-text-muted/50">·</span>
            <span className="text-text-muted">@{username}</span>
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
            <div className="min-w-0">
              {/* Name — display serif, large, the answer to "who is this".
                  Mobile: 40px; desktop scales up to 64px via clamp. */}
              <h1
                className="break-words text-text-primary"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 900,
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.025em",
                  fontFeatureSettings: '"ss01", "ss02"',
                }}
              >
                {displayName}
              </h1>

              {/* Byline row: friendship pill + last-active. The "is this person
                  active and how do I relate to them" answer in one sentence. */}
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <FriendshipPill status={friendship ?? null} t={t} />
                {lastActiveLabel && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full bg-text-muted/60"
                    />
                    {lastActiveLabel}
                  </span>
                )}
                {joined && (
                  <span className="text-xs text-text-muted">
                    <span aria-hidden className="mr-1.5 opacity-50">·</span>
                    {t("profile.publicJoinedShort", "Joined")} {joined}
                  </span>
                )}
              </div>

              {bio && (
                <p
                  className="mt-5 max-w-prose text-[15px] leading-relaxed text-text-secondary"
                  style={{ fontFamily: BODY_FONT }}
                >
                  {bio}
                </p>
              )}
            </div>

            {/* Right column: avatar + league emblem floats above it. On mobile
                this stacks under the name. */}
            <div className="flex items-start justify-start gap-4 sm:flex-col sm:items-end sm:gap-3">
              <div className="relative">
                <DecoratedAvatar
                  name={displayName}
                  src={avatarSrc}
                  size="lg"
                  className="!h-20 !w-20 !text-3xl"
                  decoratorStyle={decoratorStyle}
                />
                {league && <LeagueEmblem league={league} />}
              </div>
              <div className="hidden sm:block" aria-hidden>
                {/* hairline divider that visually anchors the action column */}
                <div className="mt-1 h-px w-16 bg-border" />
              </div>
              <PrimaryAction
                status={friendship ?? null}
                actionState={actionState}
                onAddFriend={handleAddFriend}
                onAccept={handleAccept}
                onUnblock={handleUnblock}
                onUnfriend={handleUnfriend}
                onBlock={handleBlock}
                onEditProfile={() =>
                  openEdit({
                    displayName: displayName,
                    bio: bio ?? "",
                    avatarUrl: avatarSrc ?? "",
                  })
                }
                t={t}
              />
            </div>
          </div>

          {/* Thick separator between masthead and stats — the only rule on the
              page that isn't a hairline. Marks "above the fold" identity. */}
          <div
            aria-hidden
            className="mt-8 h-[3px] w-full bg-text-primary/85"
          />
        </header>

        {/* ── Inline edit form (self only) ────────────────────────── */}
        {isSelf && editMode && (
          <section
            aria-label="Edit profile"
            className="mt-8 rounded-xl border border-border bg-surface p-6 space-y-5"
          >
            <h2 className="text-base font-semibold text-text-primary">
              {t("profile.editTitle", "Edit profile")}
            </h2>

            {saveError && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
                {saveError}
              </p>
            )}

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

            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {t("profile.status", "Bio")}
              </label>
              <Textarea
                value={draft.bio}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, bio: e.target.value }))
                }
                placeholder={t(
                  "profile.statusPlaceholder",
                  "Tell people about yourself",
                )}
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {t("profile.avatarUrl", "Avatar URL")}
              </label>
              <Input
                type="url"
                value={draft.avatarUrl}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, avatarUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-3">
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
              >
                {t("common.cancel", "Cancel")}
              </Button>
            </div>
          </section>
        )}

        {/* ── By-the-numbers rail ─────────────────────────────────── */}
        <section
          aria-label={t("profile.publicStatsLabel", "Profile stats")}
          data-testid="public-profile-stats"
          className="mt-8"
        >
          <dl className="grid grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-y-0">
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

        {/* ── Decorator inventory (self only) ─────────────────────── */}
        {isSelf && <InventorySection />}

        {/* ── Secondary context strip: learning language ──────────── */}
        {lang && (
          <section className="mt-10 flex items-baseline gap-3">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted"
            >
              {t("profile.publicLearningLabel", "Learning")}
            </span>
            <span
              className="flex items-baseline gap-2 text-text-primary"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 500,
                fontStyle: "italic",
                fontSize: "1.5rem",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {lang.flag && (
                <span aria-hidden className="text-xl not-italic">
                  {lang.flag}
                </span>
              )}
              {lang.label}
            </span>
          </section>
        )}

        {/* ── Authored decks — "Bylined Works" ────────────────────── */}
        {authoredCount > 0 && (
          <section
            className="mt-12"
            data-testid="public-profile-authored"
            aria-labelledby="authored-heading"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
              <h2
                id="authored-heading"
                className="text-text-primary"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.015em",
                }}
              >
                {t("profile.publicAuthoredHeading", "Bylined Decks")}
              </h2>
              <span
                className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted"
                style={{ fontFamily: MONO_FONT }}
              >
                {authoredCount.toString().padStart(2, "0")} {t("profile.publicAuthoredCount", "total")}
              </span>
            </div>
            <ul className="mt-2 divide-y divide-border-muted">
              {authoredSample.map((d, i) => (
                <DeckRow
                  key={d.id}
                  deck={d}
                  index={i + 1}
                  unnamedFallback={t("profile.publicUnnamedDeck", "(unnamed deck)")}
                />
              ))}
            </ul>
            {authoredCount > authoredSample.length && (
              <p
                className="mt-4 text-xs italic text-text-muted"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                {t("profile.publicAuthoredMore", "and")}{" "}
                {(authoredCount - authoredSample.length).toLocaleString()}{" "}
                {t("profile.publicAuthoredMoreSuffix", "more in the archive")}
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
 * One slot in the by-the-numbers rail. The numeral is the loud part —
 * Plex Mono at 30-40px, slightly tighter tracking; the label is the
 * small-cap kicker above it. No box, no border — separation comes from
 * the vertical rule between siblings (sm and up).
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
        <Icon name={icon} size={12} strokeWidth={2.25} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
          {label}
        </span>
      </div>
      <div
        className={
          "mt-2 tabular-nums " +
          (accentValue ? "text-accent" : "text-text-primary")
        }
        style={{
          fontFamily: MONO_FONT,
          fontWeight: 600,
          fontSize: "clamp(1.875rem, 4.5vw, 2.5rem)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {caption && (
        <div
          className="mt-2 text-[11px] text-text-muted"
          style={{ fontFamily: MONO_FONT }}
        >
          {caption}
        </div>
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
 * League emblem — the one place hardcoded colors live. Brass-foil gradient
 * with a subtle ring; positioned over the avatar's lower-right like a
 * decoration pin. Works on every theme because brass reads as brass on
 * any background.
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
 * One bylined-work row. Magazine-feature treatment: oversized index numeral
 * on the left (Plex Mono, faint), deck name as the title, language as a
 * "filed under" small-cap tag, and an arrow that animates on hover.
 */
function DeckRow({
  deck,
  index,
  unnamedFallback,
}: {
  deck: AuthoredDeckSample;
  index: number;
  unnamedFallback: string;
}) {
  return (
    <li>
      <Link
        to={`/decks/${deck.id}`}
        className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          aria-hidden
          className="text-text-muted/40 group-hover:text-accent/70 transition-colors tabular-nums"
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 500,
            fontSize: "1.125rem",
          }}
        >
          {index.toString().padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3
            className="truncate text-text-primary group-hover:text-accent transition-colors"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            {deck.name || unnamedFallback}
          </h3>
          {deck.language && (
            <p
              className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted"
            >
              <span className="opacity-60">filed under</span>{" "}
              <span className="text-text-secondary">{deck.language}</span>
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
    <main
      className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14"
      style={{ fontFamily: BODY_FONT }}
    >
      <h1
        className="text-text-primary"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: "clamp(1.875rem, 4vw, 2.5rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        {heading}
      </h1>
      {children && <div className="mt-4">{children}</div>}
    </main>
  );
}

/**
 * Friendship pill — small, lowercase-typographic chip that sits inline with
 * the byline. No background fill except for the destructive states; this is
 * metadata, not a call to action.
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${labelAndIcon.tone}`}
    >
      <Icon name={labelAndIcon.icon} size={11} strokeWidth={2.5} />
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
  onEditProfile,
  t,
}: {
  status: FriendshipStatus | null;
  actionState: ActionState;
  onAddFriend: () => void;
  onAccept: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  onEditProfile: () => void;
  t: TFunction;
}) {
  const busy = actionState === "pending";

  if (status === "self") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEditProfile}
        className="!gap-1.5"
      >
        <Icon name="pencil" size={14} strokeWidth={2.25} />
        {t("profile.publicEditProfile", "Edit profile")}
      </Button>
    );
  }
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
        <Icon name="chevronDown" size={13} strokeWidth={2.25} />
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

export default PublicProfilePage;
