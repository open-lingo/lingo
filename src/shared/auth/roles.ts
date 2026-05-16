/** Server roles aligned with `@/shared/api/admin` UserRole. */
export function canAccessSiteAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/** Moderation UI (creator deck queue) — not the `/admin` dashboard. */
export function canModerateCommunityContent(role: string | null | undefined): boolean {
  return (
    role === "moderator" || role === "admin" || role === "super_admin"
  );
}
