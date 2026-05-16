/** Public legal / contact configuration (override via Vite env in production). */
export const LEGAL_LAST_UPDATED = "2026-05-16";

export const LEGAL_ENTITY_NAME = "Open Lingo";

export const GITHUB_REPO_URL = "https://github.com/open-lingo/lingo";

export const PRIVACY_CONTACT_EMAIL =
  (import.meta.env.VITE_LEGAL_CONTACT_EMAIL as string | undefined)?.trim() ||
  "";

export function privacyContactHref(): string {
  if (PRIVACY_CONTACT_EMAIL) {
    return `mailto:${PRIVACY_CONTACT_EMAIL}?subject=${encodeURIComponent("Open Lingo privacy request")}`;
  }
  return `${GITHUB_REPO_URL}/issues/new?labels=privacy&title=${encodeURIComponent("Privacy request")}`;
}

export function privacyContactLabel(): string {
  return PRIVACY_CONTACT_EMAIL || "GitHub Issues (privacy label)";
}
