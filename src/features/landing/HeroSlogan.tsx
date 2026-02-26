import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const PREFIX = "Stop forgetting what you ";

/** The word "learn" in each language — only this part animates. */
const LEARN_WORD: Record<string, string> = {
  en: "learn.",
  ko: "배우다.",
  ja: "学ぶ。",
  nl: "leert.",
  es: "aprendes.",
};

const ALL_LANGS = ["en", "ko", "ja", "nl", "es"] as const;

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function HeroSlogan() {
  const { i18n } = useTranslation();
  const locale = (i18n.language?.slice(0, 2) || "en").toLowerCase();
  const effectiveLocale = LEARN_WORD[locale] ? locale : "en";
  const [isHovered, setIsHovered] = useState(false);

  const sequence = useMemo(() => {
    const others = ALL_LANGS.filter((l) => l !== effectiveLocale);
    const shuffled = shuffle(others);
    return [effectiveLocale, ...shuffled, effectiveLocale];
  }, [effectiveLocale]);

  const [index, setIndex] = useState(0);
  const displayLang = isHovered ? effectiveLocale : sequence[index];
  const word = LEARN_WORD[displayLang] ?? LEARN_WORD.en;
  const fullSlogan = PREFIX + word;

  useEffect(() => {
    if (isHovered) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % sequence.length);
    }, 2200);
    return () => clearTimeout(t);
  }, [index, sequence.length, isHovered]);

  return (
    <h1
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="min-h-[1.2em] cursor-default text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl"
      aria-live="polite"
      aria-label={fullSlogan}
    >
      {PREFIX}
      <span
        key={displayLang}
        className="inline-block animate-slogan-word"
      >
        {word}
      </span>
    </h1>
  );
}
