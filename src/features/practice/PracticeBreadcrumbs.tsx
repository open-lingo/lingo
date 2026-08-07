import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath, useLang } from "@/shared/hooks/useLangPath";
import { Icon } from "@/shared/components/Icon";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";
import { useFeatureFlagsOptional } from "@/shared/contexts/FeatureFlagsContext";
import { getPillarsForLanguage, type Pillar } from "./pillars";
import { useReadingItemKind } from "./readingCrumb";

function alphabetIdToName(langId: string | undefined, id: string): string | undefined {
  if (!langId) return undefined;
  const cfg = getLanguageConfig(langId);
  const list = cfg?.alphabets ?? (cfg?.alphabet ? [cfg.alphabet] : []);
  return list.find((a) => a.id === id)?.name;
}

/** Does `path` sit at, or under, this language-relative route? */
function routeMatches(path: string, route: string): boolean {
  return Boolean(route) && (path === route || path.startsWith(`${route}/`));
}

/**
 * Which pillar owns the activity at `activityPath` (language-relative, e.g.
 * `practice/stories/ko-m3-meeting`).
 *
 * Reading has several options now — Stories, Fill in the blank, External
 * content — so the crumbs should read `Practice › Reading › <option>`. But the
 * routes are FLAT siblings and nesting them under `practice/reading/…` would
 * move live URLs for no functional gain. The grouping is already modelled in
 * the pillar catalog, so the middle crumb is synthesized from there instead.
 *
 * Longest matching activity route wins. A tie goes to the pillar that LEADS
 * with the activity: `practice/speaking` is Speaking's first activity and
 * Listening's third, so it belongs to Speaking.
 *
 * Returns null when a pillar's OWN route is already on the path — Vocabulary
 * lives at `practice/flashcards` and Grammar at `practice/grammar`, which the
 * ordinary segment crumbs already render, and the pillar hubs themselves are
 * `practice/pillar/<id>`. Synthesizing there would only say it twice.
 */
export function findOwningPillar(
  activityPath: string,
  pillars: readonly Pillar[],
): Pillar | null {
  for (const pillar of pillars) {
    if (routeMatches(activityPath, pillar.route)) return null;
  }

  let best: Pillar | null = null;
  let bestLength = -1;
  let bestRank = Number.MAX_SAFE_INTEGER;
  for (const pillar of pillars) {
    for (let rank = 0; rank < pillar.activities.length; rank++) {
      const route = pillar.activities[rank].route;
      if (!routeMatches(activityPath, route)) continue;
      if (route.length > bestLength || (route.length === bestLength && rank < bestRank)) {
        best = pillar;
        bestLength = route.length;
        bestRank = rank;
      }
    }
  }
  return best;
}

const SEGMENT_LABEL_KEY: Record<string, string> = {
  flashcards: "nav.flashcards",
  grammar: "practice.grammarPage.breadcrumb",
  particles: "practice.particlePractice",
  alphabet: "practice.alphabetHub.breadcrumb",
  kanji: "practice.kanji",
  components: "practice.components",
  stories: "nav.stories",
  cloze: "practice.cloze.title",
  conversation: "practice.conversation.title",
  counters: "practice.pillars.grammar.counters",
  review: "flashcards.review",
  cards: "flashcards.cardManager.title",
  decks: "flashcards.deckManager.title",
  learn: "practice.hub.breadcrumbAlphabetLesson",
  "external-content": "externalContent.practice.tabLabel",
};

const PILLAR_CRUMB_DEFAULT: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
};

export function PracticeBreadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const langPath = useLangPath();
  const langId = useLang();
  const { storyId } = useParams<{ storyId?: string }>();
  const readingKind = useReadingItemKind();
  // Optional: the crumbs are presentation over a static catalog, and the only
  // thing flags decide here is whether External content is a reading option at
  // all. Defaults let the trail render outside the provider.
  const flags = useFeatureFlagsOptional() ?? DEFAULT_FEATURE_FLAGS;
  const pillars = useMemo(() => getPillarsForLanguage(langId, flags), [langId, flags]);

  const base = langPath("practice");
  const path = location.pathname.replace(/\/$/, "");
  if (path === base) return null;

  const rest = path.slice(base.length).replace(/^\//, "");
  if (!rest) return null;

  const segments = rest.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // `to: null` = a crumb that names a level without being a place. It renders
  // as plain text, never as a link — a crumb that looks clickable and goes
  // nowhere is worse than no crumb at all.
  const crumbs: { to: string | null; label: string; isCurrent: boolean }[] = [
    { to: base, label: t("nav.practice"), isCurrent: false },
  ];

  const pillar = findOwningPillar(`practice/${rest}`, pillars);
  if (pillar) {
    crumbs.push({
      // Every pillar has a hub today, so every synthesized crumb is navigable.
      // The guard stands for the one that doesn't.
      to: pillar.route ? langPath(pillar.route) : null,
      label: t(pillar.titleKey, { defaultValue: pillar.titleDefault }),
      isCurrent: false,
    });
  }

  let acc = base;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    const isLast = i === segments.length - 1;
    const prev = i > 0 ? segments[i - 1] : undefined;
    const twoBack = i >= 2 ? segments[i - 2] : undefined;

    // "pillar" is a structural path segment (practice/pillar/:pillarId),
    // not a navigable page — skip the crumb but keep accumulating the path.
    if (seg === "pillar") continue;

    let label: string;
    if (prev === "pillar") {
      label = t(`practice.pillars.${seg}.title`, {
        defaultValue: PILLAR_CRUMB_DEFAULT[seg] ?? seg,
      });
    } else if (seg === "listening") {
      label = t("practice.listenChoose.title", { defaultValue: "Listen & Choose" });
    } else if (seg === "writing") {
      label = t("practice.typeIt.title", { defaultValue: "Type It" });
    } else if (seg === "reading") {
      label = t("practice.reading.title", { defaultValue: "Reading" });
    } else if (seg === "speaking") {
      label = t("practice.speaking.title", { defaultValue: "Speaking" });
    } else if (seg === "learn" && twoBack === "alphabet") {
      label = t("practice.hub.breadcrumbAlphabetLesson");
    } else if (prev === "alphabet" && seg !== "learn") {
      label = alphabetIdToName(langId, seg) ?? seg;
    } else if (prev === "stories" && isLast && storyId && seg === storyId) {
      // Stories and conversations share this route — the id is the
      // discriminator, and the reader publishes what it resolved (see
      // `readingCrumb`). Unresolved falls back to "Story", which is what the
      // overwhelming majority of the library is.
      label =
        readingKind === "conversation"
          ? t("practice.hub.breadcrumbConversation", { defaultValue: "Conversation" })
          : t("practice.hub.breadcrumbStory", { defaultValue: "Story" });
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
            ) : c.to ? (
              <Link
                to={c.to}
                className="rounded hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {c.label}
              </Link>
            ) : (
              <span>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
