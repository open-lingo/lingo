import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { HomeNavCard } from "@/features/home/HomeNavCard";

export function PracticeCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();

  return (
    <HomeNavCard
      to={langPath("practice")}
      iconName="dumbbell"
      title={t("home.cards.gym")}
      description={t("home.cards.gymDesc")}
    />
  );
}
