/**
 * AdminBackButton — "← Dashboard" link shown at the top of every
 * /admin/* inner page so the user can easily return to /admin/home.
 */
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function AdminBackButton() {
  return (
    <Link
      to="/admin/home"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-text-primary"
    >
      <ArrowLeft size={15} aria-hidden />
      Dashboard
    </Link>
  );
}
