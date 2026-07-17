import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LanguagePickerGrid } from "@/features/home/LanguagePickerGrid";
import { useAuth } from "@/shared/auth/useAuth";
import { Icon } from "@/shared/components/Icon";
import type { Language } from "@/shared/domain/languages";

/**
 * Pre-signup language picker page. Replaces the "Get started → Auth0 →
 * silently land on Korean" trap (Task #88).
 *
 * Flow:
 *   1. User picks a language (controlled state below).
 *   2. CTA copy updates to "Get started learning [Language] →".
 *   3. On click: stash the choice in sessionStorage, then signup() to
 *      Auth0. After the round-trip, LanguageProvider seeds the setting
 *      from the stash and the user lands on /home with the right course.
 */
export const PENDING_LANGUAGE_STORAGE_KEY = "lingo_pending_language_id";

export default function GetStartedPage() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [selected, setSelected] = useState<Language | null>(null);

  function handleCta() {
    if (!selected) return;
    try {
      sessionStorage.setItem(PENDING_LANGUAGE_STORAGE_KEY, selected.id);
    } catch {
      // sessionStorage may be unavailable in private mode — picker
      // modal will fall back to firing post-signup.
    }
    signup();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-40 pt-12 sm:pt-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          {t("getStarted.title", "What do you want to learn?")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
          {t(
            "getStarted.subtitle",
            "Pick a language to start with. You can switch later, or add more from your settings.",
          )}
        </p>
      </header>

      <div className="mt-10">
        <LanguagePickerGrid
          onSelect={setSelected}
          selectedId={selected?.id ?? null}
          headline=""
          subhead=""
          className=""
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleCta}
          disabled={!selected}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-lg active:translate-y-0 active:shadow-md disabled:cursor-not-allowed disabled:bg-text-muted/40 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {selected
            ? t("getStarted.ctaWithLanguage", "Get started learning {{language}}", {
                language: selected.name,
              })
            : t("getStarted.ctaPrompt", "Pick a language to continue")}
          {selected && <Icon name="arrowRight" size={18} />}
        </button>

        <p className="text-xs text-text-muted">
          {t(
            "getStarted.signupNote",
            "We'll create your account on the next step (Google or email).",
          )}
        </p>

        <Link
          to="/landing"
          className="mt-2 text-sm font-medium text-text-secondary underline-offset-2 hover:underline"
        >
          {t("getStarted.backToLanding", "← Back to landing")}
        </Link>
      </div>
    </div>
  );
}
