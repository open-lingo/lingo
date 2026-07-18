import { useState } from "react";
import type { TFunction } from "i18next";
import { useApi } from "@/shared/api/provider";
import { Button } from "@/shared/components/ui/Button";
import { ModalBase } from "@/shared/components/ModalBase";
import { apiErrorDetail } from "../_profileFormatters";

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
export function AvatarUrlModal({
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
      setError(
        apiErrorDetail(
          err,
          t("profile.publicActionFailed", "Could not complete that action."),
        ),
      );
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
