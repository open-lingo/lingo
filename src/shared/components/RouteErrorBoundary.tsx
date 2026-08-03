import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Catches errors thrown anywhere under a route subtree. Shipping this on
 * every top-level route avoids the blank-screen failure mode when a lazy
 * chunk fails or a render throws.
 */
export function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  const message =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : t("routeError.generic", "Something went wrong");

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
      <p className="text-6xl font-bold tracking-tight text-warning sm:text-7xl">
        !
      </p>
      <h1 className="mt-6 text-2xl font-bold text-text-primary sm:text-3xl">
        {t("routeError.title", "Something went wrong")}
      </h1>
      <p className="mx-auto mt-3 max-w-sm break-words text-sm text-text-muted">
        {message}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          {t("routeError.reload", "Reload page")}
        </Button>
        <Link to="/">
          <Button variant="outline">
            {t("routeError.home", "Go home")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
