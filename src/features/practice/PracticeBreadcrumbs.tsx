import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath, useLang } from "@/shared/hooks/useLangPath";
import { Icon } from "@/shared/components/Icon";
import { getLanguageConfig } from "@/shared/domain/languageConfig";

function alphabetIdToName(langId: string | undefined, id: string): string | undefined {
  if (!langId) return undefined;
  const cfg = getLanguageConfig(langId);
  const list = cfg?.alphabets ?? (cfg?.alphabet ? [cfg.alphabet] : []);
  return list.find((a) => a.id === id)?.name;
}

const SEGMENT_LABEL_KEY: Record<string, string> = {
  flashcards: "nav.flashcards",
  grammar: "practice.grammarPage.breadcrumb",
  particles: "practice.particlePractice",
  alphabet: "practice.alphabetHub.breadcrumb",
  kanji: "practice.kanji",
  components: "practice.components",
  videos: "practice.videos",
  stories: "nav.stories",
  review: "flashcards.review",
  cards: "flashcards.cardManager.title",
  decks: "flashcards.deckManager.title",
  learn: "practice.hub.breadcrumbAlphabetLesson",
  "external-content": "externalContent.practice.tabLabel",
};

export function PracticeBreadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const langPath = useLangPath();
  const langId = useLang();
  const { storyId } = useParams<{ storyId?: string }>();

  const base = langPath("practice");
  const path = location.pathname.replace(/\/$/, "");
  if (path === base) return null;

  const rest = path.slice(base.length).replace(/^\//, "");
  if (!rest) return null;

  const segments = rest.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: { to: string; label: string; isCurrent: boolean }[] = [
    { to: base, label: t("nav.practice"), isCurrent: false },
  ];

  let acc = base;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    const isLast = i === segments.length - 1;
    const prev = i > 0 ? segments[i - 1] : undefined;
    const twoBack = i >= 2 ? segments[i - 2] : undefined;

    let label: string;
    if (seg === "learn" && twoBack === "alphabet") {
      label = t("practice.hub.breadcrumbAlphabetLesson");
    } else if (prev === "alphabet" && seg !== "learn") {
      label = alphabetIdToName(langId, seg) ?? seg;
    } else if (prev === "stories" && isLast && storyId && seg === storyId) {
      label = t("practice.hub.breadcrumbStory");
    } else {
      const key = SEGMENT_LABEL_KEY[seg];
      label = key ? t(key) : seg.replace(/-/g, " ");
    }

    crumbs.push({
      to: acc,
      label,
      isCurrent: isLast,
    });
  }

  return (
    <nav aria-label={t("practice.hub.breadcrumbsAria")} className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-text-secondary">
        {crumbs.map((c, idx) => (
          <li key={`${c.to}-${idx}`} className="flex items-center gap-1">
            {idx > 0 && (
              <Icon
                name="chevronRight"
                size={14}
                className="shrink-0 text-text-muted"
                aria-hidden
              />
            )}
            {c.isCurrent ? (
              <span className="font-medium text-text-primary" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link
                to={c.to}
                className="rounded hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
