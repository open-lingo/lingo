/**
 * AdminLmsPage — /admin/lms · "Learning config"
 *
 * Global learning-system configuration. Previously this page also owned
 * per-user moderation (user picker → student file with XP/lingot/reset
 * controls) — that surface now lives as the "Learning" tab on
 * /admin/users/:id. The page kept the /admin/lms route to preserve
 * muscle-memory: a UserPicker at the top of this page bounces straight
 * into the per-user tab on selection.
 *
 * Today this page hosts:
 *   - UserPicker (jump to a student's learning record)
 *   - Platform XP rates section (lesson / review / streak XP and lingot
 *     grants tuned for all users)
 *
 * Future home for global learning content config (module ordering, lesson
 * publishing, etc.) — not scaffolded yet.
 */
import { useNavigate } from "react-router-dom";

import { Card } from "@/shared/components/ui/Card";

import { UserPicker } from "./components/UserPicker";
import { PlatformXpRatesPanel } from "./PlatformXpRatesPanel";

export function AdminLmsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-text-primary">Learning config</h1>
        <p className="mt-1 text-sm text-text-muted">
          Global learning-system settings. Use the search below to jump to an
          individual student&apos;s learning record on the user detail page.
        </p>
      </header>

      {/* Jump-to-student affordance. Selecting a user navigates to the
          per-user Learning tab — same destination, deep-linked. */}
      <section aria-labelledby="lms-user-jump-heading" className="max-w-3xl">
        <h2 id="lms-user-jump-heading" className="sr-only">
          Jump to a student
        </h2>
        <Card padding="md">
          <UserPicker
            title="Jump to a student's learning record"
            description="Pick a user to open their per-student learning view."
            onSelect={(userId) =>
              navigate(`/admin/users/${encodeURIComponent(userId)}?tab=learning`)
            }
          />
        </Card>
      </section>

      {/* Platform-wide XP economy. */}
      <section aria-labelledby="lms-xp-rates-heading" className="max-w-3xl">
        <h2 id="lms-xp-rates-heading" className="sr-only">
          Platform XP rates
        </h2>
        <PlatformXpRatesPanel />
      </section>
    </div>
  );
}

export default AdminLmsPage;
