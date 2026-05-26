import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavPillLink } from "@/shared/components/ui/NavPillLink";

export function AdminBreadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const isUsers = pathname.includes("/admin/users");
  const isContent = pathname.includes("/admin/content");
  const isContentDecks = pathname.includes("/admin/content/decks");
  const isContentStories = pathname.includes("/admin/content/stories");
  const isContentLessons = pathname.includes("/admin/content/lessons");
  const isOperations = pathname.includes("/admin/operations");

  return (
    <nav
      className="flex flex-wrap items-center gap-2 border-b border-border pb-4"
      aria-label="Admin sections"
    >
      <NavPillLink to="/admin/users" isActive={isUsers}>
        {t("admin.users")}
      </NavPillLink>
      <NavPillLink to="/admin/content/decks" isActive={isContent}>
        {t("admin.content")}
      </NavPillLink>
      <NavPillLink to="/admin/operations" isActive={isOperations}>
        {t("admin.operations", "Operations")}
      </NavPillLink>
      {isContent && (
        <>
          <span className="text-text-muted">/</span>
          <NavPillLink to="/admin/content/decks" isActive={isContentDecks}>
            {t("admin.decks")}
          </NavPillLink>
          <NavPillLink to="/admin/content/stories" isActive={isContentStories}>
            {t("admin.stories")}
          </NavPillLink>
          <NavPillLink to="/admin/content/lessons" isActive={isContentLessons}>
            {t("admin.lessons", "Lessons")}
          </NavPillLink>
        </>
      )}
    </nav>
  );
}
