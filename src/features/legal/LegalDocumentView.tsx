import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LegalDocument } from "./legalDocuments";
import {
  LEGAL_ENTITY_NAME,
  LEGAL_LAST_UPDATED,
  privacyContactHref,
  privacyContactLabel,
} from "./legalConfig";

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  const { t } = useTranslation();

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-sm text-text-muted">
          {t("legal.lastUpdated", "Last updated")}: {LEGAL_LAST_UPDATED}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text-primary">{doc.title}</h1>
        <p className="mt-3 text-text-secondary">{doc.summary}</p>
      </header>

      <div className="space-y-10">
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-text-secondary">
                {p}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
                {section.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-secondary">
        <p>
          {t("legal.contactLabel", "Contact")}:{" "}
          <a
            href={privacyContactHref()}
            className="font-medium text-accent hover:text-accent-hover"
            {...(privacyContactHref().startsWith("http")
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
          >
            {privacyContactLabel()}
          </a>
        </p>
        <p className="mt-2 text-text-muted">
          {LEGAL_ENTITY_NAME} · {t("legal.notLegalAdvice", "Not legal advice — have a lawyer review for your jurisdiction.")}
        </p>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link to="/privacy" className="text-accent hover:underline">
            {t("legal.privacyLink", "Privacy Policy")}
          </Link>
          <Link to="/terms" className="text-accent hover:underline">
            {t("legal.termsLink", "Terms of Service")}
          </Link>
          <Link to="/about" className="text-accent hover:underline">
            {t("legal.aboutLink", "About")}
          </Link>
        </p>
      </footer>
    </article>
  );
}
