import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { useModal } from "@/shared/contexts/ModalContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import type { Command } from "./types";

/**
 * Builds the full command set for the palette: navigation, settings (each
 * section deep-links via `openSettings`), then content (lessons + vocab) that
 * only surfaces once the user types. Everything routes through existing hooks
 * and the course map — no new data sources.
 */
export function useCommands(): Command[] {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const lang = useLang();
  const { openSettings } = useModal();

  return useMemo(() => {
    const go = (path: string) => () => navigate(path);

    const nav: Command[] = [
      { id: "nav-home", label: t("nav.home", "Home"), group: t("cmd.group.nav", "Navigation"), icon: "layoutDashboard", perform: go("/home"), showWhenEmpty: true },
      { id: "nav-learn", label: t("nav.learn", "Learn"), group: t("cmd.group.nav", "Navigation"), icon: "graduationCap", perform: go(langPath("learn")), showWhenEmpty: true },
      { id: "nav-practice", label: t("nav.practice", "Practice"), group: t("cmd.group.nav", "Navigation"), icon: "dumbbell", perform: go(langPath("practice")), showWhenEmpty: true },
      { id: "nav-journey", label: t("nav.journey", "Journey"), group: t("cmd.group.nav", "Navigation"), icon: "trendingUp", keywords: "progress stats streak xp mastery", perform: go(langPath("practice/journey")), showWhenEmpty: true },
      { id: "nav-vocab", label: t("nav.vocab", "Vocab"), group: t("cmd.group.nav", "Navigation"), icon: "library", perform: go(langPath("vocab")), showWhenEmpty: true },
      { id: "nav-flashcards", label: t("nav.flashcards", "Flashcards"), group: t("cmd.group.nav", "Navigation"), icon: "layers", keywords: "srs review cards", perform: go(langPath("practice/flashcards")), showWhenEmpty: true },
      { id: "nav-shop", label: t("nav.shop", "Shop"), group: t("cmd.group.nav", "Navigation"), icon: "gem", keywords: "lingots cosmetics", perform: go(langPath("shop")), showWhenEmpty: true },
      { id: "nav-social", label: t("nav.social", "Social"), group: t("cmd.group.nav", "Navigation"), icon: "users", keywords: "friends leaderboard", perform: go(langPath("social")), showWhenEmpty: true },
      { id: "nav-community", label: t("nav.community", "Community"), group: t("cmd.group.nav", "Navigation"), icon: "globe", keywords: "decks stories forum", perform: go(langPath("community")), showWhenEmpty: true },
      { id: "nav-leaderboard", label: t("nav.leaderboard", "Leaderboard"), group: t("cmd.group.nav", "Navigation"), icon: "trophy", perform: go(langPath("community/leaderboard")), showWhenEmpty: true },
    ];

    const settings: Command[] = [
      { id: "set-general", label: t("settings.nav.general", "General"), group: t("cmd.group.settings", "Settings"), icon: "settings", keywords: "settings preferences", perform: () => openSettings("general"), showWhenEmpty: true },
      { id: "set-appearance", label: t("settings.nav.appearance", "Appearance"), group: t("cmd.group.settings", "Settings"), icon: "palette", keywords: "theme dark light color font", perform: () => openSettings("appearance"), showWhenEmpty: true },
      { id: "set-audio", label: t("settings.nav.audio", "Audio"), group: t("cmd.group.settings", "Settings"), icon: "headphones", keywords: "sound volume tts speech", perform: () => openSettings("audio"), showWhenEmpty: true },
      { id: "set-accessibility", label: t("settings.accessibility", "Accessibility"), group: t("cmd.group.settings", "Settings"), icon: "eye", keywords: "dyslexia font size motion", perform: () => openSettings("accessibility"), showWhenEmpty: true },
      { id: "set-notifications", label: t("settings.notifications", "Notifications"), group: t("cmd.group.settings", "Settings"), icon: "megaphone", perform: () => openSettings("notifications"), showWhenEmpty: true },
      { id: "set-privacy", label: t("legal.settings.privacyTitle", "Privacy"), group: t("cmd.group.settings", "Settings"), icon: "shield", keywords: "account data privacy", perform: () => openSettings("privacy"), showWhenEmpty: true },
    ];

    // Content — hidden until typed so the default view stays scannable.
    const lessons: Command[] = [];
    try {
      const course = getMockCourse(lang);
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (lesson.kind === "alphabet") continue;
          lessons.push({
            id: `lesson-${lesson.id}`,
            label: lesson.title,
            hint: mod.title,
            group: t("cmd.group.lessons", "Lessons"),
            icon: "bookOpen",
            perform: go(langPath(`learn/lessons/${lesson.id}`)),
          });
        }
      }
    } catch {
      // Course map can throw mid-HMR on yōon row transitions — skip lessons.
    }

    // Active language's normalized atom catalog; SRS-eligible only so each
    // entry deep-links to a card the vocab page actually renders.
    const vocab: Command[] = getNormalizedCourseAtoms(lang)
      .filter((a) => a.srsEligible)
      .map((atom) => ({
        id: `vocab-${atom.id}`,
        label: atom.secondary
          ? `${atom.secondary}（${atom.display}）`
          : atom.display,
        hint: atom.gloss,
        group: t("cmd.group.vocab", "Vocab"),
        icon: "bookText",
        keywords: [atom.romanization, atom.gloss, atom.display]
          .filter(Boolean)
          .join(" "),
        perform: go(langPath(`vocab?card=${encodeURIComponent(atom.id)}`)),
      }));

    return [...nav, ...settings, ...lessons, ...vocab];
  }, [t, navigate, langPath, lang, openSettings]);
}
