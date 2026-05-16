import { getStoredProfile } from "@/features/settings/profileStorage";

type MeLike = { profile_picture_key?: string | null } | undefined;
type AuthUserLike = { sub?: string; picture?: string } | null | undefined;

/** Same precedence as the header account menu: API → local profile → IdP picture. */
export function resolveUserAvatarUrl(me: MeLike, user: AuthUserLike): string | undefined {
  return (
    me?.profile_picture_key?.trim() ||
    (user?.sub ? getStoredProfile(user.sub)?.avatarUrl : undefined) ||
    user?.picture ||
    undefined
  );
}
