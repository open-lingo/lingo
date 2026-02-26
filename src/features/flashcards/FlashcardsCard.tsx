import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { FeatureCardWithDropdown } from "@/shared/components/FeatureCardWithDropdown";

const OPTIONS = [
  { to: "practice/flashcards", query: "", labelKey: "home.cards.flashcardsOptionAll" },
  { to: "practice/flashcards", query: "?mode=vocab", labelKey: "home.cards.flashcardsOptionVocab" },
  { to: "practice/flashcards", query: "?mode=sentences", labelKey: "home.cards.flashcardsOptionSentences" },
] as const;

export function FlashcardsCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const options = OPTIONS.map((opt) => ({
    href: langPath(opt.to) + opt.query,
    labelKey: opt.labelKey,
  }));

  return (
    <FeatureCardWithDropdown
      icon="graduationCap"
      titleKey="home.cards.flashcards"
      descriptionKey="home.cards.flashcardsDesc"
      promptTextKey="home.cards.flashcardsChoose"
      options={options}
      t={t}
    />
  );
}
