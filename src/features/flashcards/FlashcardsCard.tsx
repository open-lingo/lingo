import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { HomeNavCard } from "@/features/home/HomeNavCard";

export function FlashcardsCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();

  return (
    <HomeNavCard
      to={langPath("practice")}
      iconName="decks"
      title={t("home.cards.flashcards")}
      description={t("home.cards.flashcardsHubDesc")}
    />
  );
}
