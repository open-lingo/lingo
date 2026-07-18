import type { TFunction } from "i18next";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

/**
 * RegisterForm — first-time username + display name capture. Rendered
 * when the page is reached via the HomePage 404→register redirect.
 *
 * The same ``useOwnProfile`` draft state powers this form; the parent
 * passes ``registerMode: true`` so save POSTs to ``users.register``.
 */
export function RegisterForm({
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
      className="space-y-5 rounded-card border border-border bg-surface p-6"
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
