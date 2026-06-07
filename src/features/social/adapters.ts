import type { HomeFriendPreview, SocialUser } from "./types";

export function toHomeFriendPreview(user: SocialUser): HomeFriendPreview {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    streak: user.streakDays,
    status: user.status,
  };
}
