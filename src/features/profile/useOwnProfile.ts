import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import { ApiError } from "@/shared/api/client";

export type OwnProfileDraft = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  /** Only used in register mode (no backend record exists yet). */
  username?: string;
};

export type UseOwnProfileOptions = {
  /**
   * When true, the save mutation calls ``users.register`` instead of
   * ``users.updateMe``. The PublicProfilePage flips this on for
   * self-but-unregistered viewers so the first-time username + display
   * name flow lives on the same surface as edit.
   */
  registerMode?: boolean;
};

/**
 * Manages edit-mode state and the save mutation for the own-profile case
 * on PublicProfilePage. Extracted so the page file doesn't grow further.
 */
export function useOwnProfile(
  initial: OwnProfileDraft,
  opts: UseOwnProfileOptions = {},
) {
  const { users } = useApi();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<OwnProfileDraft>(initial);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset draft to current saved values when entering edit mode.
  function openEdit(current: OwnProfileDraft) {
    setDraft(current);
    setSaveError(null);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setSaveError(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (opts.registerMode) {
        const username = (draft.username ?? "").trim();
        const displayName = draft.displayName.trim() || username;
        if (!username) {
          throw new ApiError(400, { detail: "Username is required" });
        }
        return users.register({
          username,
          display_name: displayName,
        });
      }
      return users.updateMe({
        display_name: draft.displayName.trim() || undefined,
        bio: draft.bio.trim() || undefined,
        profile_picture_key: draft.avatarUrl.trim() || undefined,
      });
    },
    onSuccess: () => {
      setEditMode(false);
      setSaveError(null);
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            ((k[0] === "users" && k.includes("me")) ||
              (k[0] === "users" && k.includes("profile")) ||
              (k[0] === "social" && k.includes("profile")))
          );
        },
      });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 409) {
        setSaveError("Username already taken.");
      } else if (err instanceof ApiError && err.status === 400) {
        const detail =
          typeof err.body === "object" && err.body && "detail" in err.body
            ? String((err.body as { detail?: unknown }).detail)
            : "Please fill in the required fields.";
        setSaveError(detail);
      } else {
        setSaveError("Failed to save — try again.");
      }
    },
  });

  return {
    editMode,
    draft,
    setDraft,
    openEdit,
    cancelEdit,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError,
  };
}
