import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

const PREFIX = "Stop forgetting what you ";

/** The word "learn" or "study" in each language — only this part animates. Similar length to avoid layout shift. */
const LEARN_WORD: Record<string, string> = {
  en: "learn.",
  ko: "배우다.",
  ja: "学ぶ。",
  nl: "leert.",
  pt: "estuda.",
  de: "lernst.",
  it: "studia.",
  zh: "学习。",
};

const ALL_LANGS = ["en", "ko", "ja", "nl", "pt", "de", "it", "zh"] as const;
const ANIM_DURATION_MS = 500;

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
  const [previousWord, setPreviousWord] = useState<string | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sequence = useMemo(() => {
    const others = ALL_LANGS.filter((l) => l !== effectiveLocale);
    const shuffled = shuffle(others);
    return [effectiveLocale, ...shuffled, effectiveLocale];
  }, [effectiveLocale]);

  const [index, setIndex] = useState(0);
  const prevIndexRef = useRef(index);
  const displayLang = isHovered ? effectiveLocale : sequence[index];
  const word = LEARN_WORD[displayLang] ?? LEARN_WORD.en;
  const fullSlogan = PREFIX + word;

  useEffect(() => {
    if (prevIndexRef.current !== index) {
      setPreviousWord(LEARN_WORD[sequence[prevIndexRef.current]] ?? LEARN_WORD.en);
      prevIndexRef.current = index;
    }
  }, [index, sequence]);

  useEffect(() => {
    if (previousWord == null) return;
    const t = setTimeout(() => {
      setPreviousWord(null);
      transitionRef.current = null;
    }, ANIM_DURATION_MS);
    transitionRef.current = t;
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, [previousWord]);

  useEffect(() => {
    if (isHovered) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % sequence.length);
    }, 2600);
    return () => clearTimeout(t);
  }, [index, sequence.length, isHovered]);

  const showTransition = previousWord != null && previousWord !== word;

  return (
    <h1
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-default whitespace-nowrap text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl"
      aria-live="polite"
      aria-label={fullSlogan}
    >
      {PREFIX}
      <span className="relative inline-block min-w-[6ch] align-baseline" style={{ lineHeight: 1.2 }}>
        {showTransition && (
          <span
            className="absolute left-0 right-0 top-0 font-extrabold animate-slogan-exit"
            aria-hidden
          >
            {previousWord}
          </span>
        )}
        <span
          key={displayLang}
          className="absolute left-0 right-0 top-0 font-extrabold animate-slogan-enter"
        >
          {word}
        </span>
        {/* Spacer for layout; both words are absolutely positioned */}
        <span className="invisible inline-block font-extrabold" aria-hidden>
          {word}
        </span>
      </span>
    </h1>
  );
}
