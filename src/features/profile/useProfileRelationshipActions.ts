/**
 * useProfileRelationshipActions — owns the friend/block action state + the
 * add / accept / unblock / unfriend / block handlers for PublicProfilePage.
 * Extracted so the page file stays composition-focused.
 */
import { useState } from "react";
import type { TFunction } from "i18next";
import type { SocialApi } from "@/shared/api/social";
import type { PublicProfile } from "@/shared/api/social";
import { apiErrorDetail } from "./_profileFormatters";

export type ActionState = "idle" | "pending" | "done";

type Params = {
  social: SocialApi;
  socialProfile: PublicProfile | null;
  username: string | undefined;
  isAuthenticated: boolean;
  login: () => void;
  refetch: () => Promise<unknown>;
  t: TFunction;
};

export function useProfileRelationshipActions({
  social,
  socialProfile,
  username,
  isAuthenticated,
  login,
  refetch,
  t,
}: Params) {
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionError, setActionError] = useState<string | null>(null);

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
        apiErrorDetail(
          err,
          t("profile.publicActionFailed", "Could not complete that action."),
        ),
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

  return {
    actionState,
    actionError,
    handleAddFriend,
    handleAccept,
    handleUnblock,
    handleUnfriend,
    handleBlock,
  };
}
