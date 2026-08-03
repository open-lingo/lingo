import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
      <p className="text-7xl font-bold tracking-tight text-accent sm:text-8xl">
        404
      </p>
      <h1 className="mt-6 text-2xl font-bold text-text-primary sm:text-3xl">
        {t("notFound.title", "Page not found")}
      </h1>
      <p className="mx-auto mt-3 max-w-xs text-base text-text-secondary">
        {t(
          "notFound.body",
          "We couldn't find what you're looking for. The link may be old or you may have mistyped the URL.",
        )}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link to="/">
          <Button variant="primary">
            {t("notFound.cta", "Take me home")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
