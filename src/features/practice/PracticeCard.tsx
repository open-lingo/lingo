import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getPracticeItemsForLanguage } from "./practiceNavItems";
import { FeatureCardWithDropdown } from "@/shared/components/FeatureCardWithDropdown";

export function PracticeCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const items = getPracticeItemsForLanguage(language?.id);
  const options = items.map((item) => ({
    href: item.to,
    labelKey: item.labelKey,
    label: item.label,
    iconName: item.iconName,
    sampleCharacter: item.sampleCharacter,
  }));

  return (
    <FeatureCardWithDropdown
      icon="dumbbell"
      titleKey="home.cards.gym"
      descriptionKey="home.cards.gymDesc"
      promptTextKey="home.cards.chooseType"
      options={options}
      t={t}
    />
  );
}
