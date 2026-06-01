/**
 * AdminBackButton — "← Dashboard" link shown at the top of every
 * /admin/* inner page so the user can easily return to /admin/home.
 */
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";

export function AdminBackButton() {
  return (
    <Link
      to="/admin/home"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-text-primary"
    >
      <Icon name="arrowLeft" size={15} aria-hidden />
      Dashboard
    </Link>
  );
}
