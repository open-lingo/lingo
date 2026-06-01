import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import { ApiError } from "@/shared/api/client";

export type OwnProfileDraft = {
  displayName: string;
  bio: string;
  avatarUrl: string;
};

/**
 * Manages edit-mode state and the save mutation for the own-profile case
 * on PublicProfilePage. Extracted so the page file doesn't grow further.
 */
export function useOwnProfile(initial: OwnProfileDraft) {
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
    mutationFn: () =>
      users.updateMe({
        display_name: draft.displayName.trim() || undefined,
        bio: draft.bio.trim() || undefined,
        profile_picture_key: draft.avatarUrl.trim() || undefined,
      }),
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
