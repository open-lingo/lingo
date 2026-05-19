import { useTranslation } from "react-i18next";

export function DocsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-24 space-y-1">
          <a href="#getting-started" className="block rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">
            {t("docs.gettingStarted", "Getting started")}
          </a>
          <a href="#courses" className="block rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">
            {t("docs.courses", "Courses")}
          </a>
          <a href="#flashcards" className="block rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">
            {t("docs.flashcards", "Flashcards")}
          </a>
          <a href="#community" className="block rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">
            {t("docs.community", "Community")}
          </a>
          <a href="#contributing" className="block rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">
            {t("docs.contributing", "Contributing")}
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <section className="min-w-0 flex-1 py-4">
        <h1 className="text-3xl font-bold text-text-primary">
          {t("docs.title", "Documentation")}
        </h1>
        <p className="mt-2 text-text-secondary">
          {t("docs.subtitle", "Learn how to use Open Lingo and contribute to the project.")}
        </p>

        <section id="getting-started" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("docs.gettingStarted", "Getting started")}
          </h2>
          <p className="mt-4 text-text-secondary">
            {t(
              "docs.gettingStartedContent",
              "Open Lingo helps you learn languages through courses, flashcards, and stories. Create an account to sync your progress across devices."
            )}
          </p>
        </section>

        <section id="courses" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("docs.courses", "Courses")}
          </h2>
          <p className="mt-4 text-text-secondary">
            {t(
              "docs.coursesContent",
              "Courses guide you through alphabets, vocabulary, and grammar. Complete lessons to unlock new content and track your progress."
            )}
          </p>
        </section>

        <section id="flashcards" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("docs.flashcards", "Flashcards")}
          </h2>
          <p className="mt-4 text-text-secondary">
            {t(
              "docs.flashcardsContent",
              "Use spaced repetition to review vocabulary and phrases. Subscribe to community decks or create your own."
            )}
          </p>
        </section>

        <section id="community" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("docs.community", "Community")}
          </h2>
          <p className="mt-4 text-text-secondary">
            {t(
              "docs.communityContent",
              "Browse and subscribe to community decks and stories. Contribute your own content to help others learn."
            )}
          </p>
        </section>

        <section id="contributing" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("docs.contributing", "Contributing")}
          </h2>
          <p className="mt-4 text-text-secondary">
            {t(
              "docs.contributingContent",
              "Open Lingo is open source. Check out the repository to report issues, suggest features, or contribute code and content."
            )}
          </p>
        </section>
      </section>
    </div>
  );
}
