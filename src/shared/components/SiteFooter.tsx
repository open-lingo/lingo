import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GITHUB_REPO_URL } from "@/features/legal/legalConfig";

export function SiteFooter({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const linkClass =
    "text-text-muted underline-offset-2 hover:text-text-secondary hover:underline";

  return (
    <footer
      className={`border-t border-border py-6 text-center text-xs text-text-muted ${className}`}
    >
      <nav
        className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        aria-label={t("legal.footerNav", "Legal and info")}
      >
        <Link to="/about" className={linkClass}>
          {t("legal.aboutLink", "About")}
        </Link>
        <Link to="/privacy" className={linkClass}>
          {t("legal.privacyLink", "Privacy Policy")}
        </Link>
        <Link to="/terms" className={linkClass}>
          {t("legal.termsLink", "Terms of Service")}
        </Link>
        <Link to="/docs" className={linkClass}>
          {t("nav.docs", "Docs")}
        </Link>
        <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className={linkClass}>
          {t("nav.githubRepo", "GitHub")}
        </a>
      </nav>
      <p>
        {t(
          "legal.footerTagline",
          "Open Lingo — open-source language learning. We do not sell your personal data."
        )}
      </p>
    </footer>
  );
}
