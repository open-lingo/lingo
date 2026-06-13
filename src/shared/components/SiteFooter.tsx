import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BRAND_MARK_STYLE: React.CSSProperties = {
  maskImage: "url('/icon.ico')",
  WebkitMaskImage: "url('/icon.ico')",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

export function SiteFooter({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t border-border bg-surface ${className}`}>
      <div className="mx-auto grid max-w-6xl gap-7 px-6 pb-7 pt-9 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-2">
            <span
              className="inline-block h-6 w-6 shrink-0 bg-current"
              style={BRAND_MARK_STYLE}
              aria-hidden
            />
            <span className="text-text-muted" aria-hidden>|</span>
            <span className="text-base font-semibold text-text-primary">
              {t("nav.siteName", "Open Lingo")}
            </span>
          </div>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-text-muted">
            {t(
              "landing.footerBlurb",
              "Free, open-source language learning. MIT-licensed. Built by learners, ad-supported — no paywalls."
            )}
          </p>
        </div>

        <FooterCol heading={t("landing.footerProduct", "Product")}>
          <FooterLink to="/get-started">
            {t("landing.footerGetStarted", "Get started")}
          </FooterLink>
          <FooterLink to="/landing#features">
            {t("landing.footerFeatures", "Features")}
          </FooterLink>
        </FooterCol>

        <FooterCol heading={t("landing.footerCompany", "Company")}>
          <FooterLink to="/about">{t("landing.footerAbout", "About")}</FooterLink>
          <FooterExternal href="https://github.com/open-lingo/lingo">
            {t("landing.footerOpenSource", "Open source")}
          </FooterExternal>
          <FooterLink to="/login">{t("landing.footerSignIn", "Sign in")}</FooterLink>
        </FooterCol>

        <FooterCol heading={t("landing.footerLegal", "Legal")}>
          <FooterLink to="/privacy">{t("landing.footerPrivacy", "Privacy")}</FooterLink>
          <FooterLink to="/terms">{t("landing.footerTerms", "Terms")}</FooterLink>
          <FooterExternal href="http://kanjivg.tagaini.net">
            {t("landing.footerAttribution", "Attribution")}
          </FooterExternal>
        </FooterCol>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-border px-6 pb-7 pt-4 text-xs text-text-muted">
        <span>
          {t("landing.footerCopyright", "© {{year}} Open Lingo · MIT License", { year })}
        </span>
        <span>
          {t("landing.footerStrokeOrder", "Stroke order: ")}
          <a
            href="http://kanjivg.tagaini.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary"
          >
            KanjiVG
          </a>{" "}
          ·{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary"
          >
            CC BY-SA 3.0
          </a>{" "}
          ·{" "}
          {t("landing.footerStrokeOrderHangul", "Hangul stroke data © Open Lingo")}
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ heading, children }: { heading: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">
        {heading}
      </h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-text-secondary hover:text-text-primary">
      {children}
    </Link>
  );
}

function FooterExternal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-text-secondary hover:text-text-primary"
    >
      {children}
    </a>
  );
}
