/**
 * AdminAuditPage — full audit history at /admin/ops/audit.
 *
 * Paginated table of admin actions: actor, action verb, target,
 * timestamp, payload (JSON snippet). Filter by target_kind via a
 * dropdown.
 *
 * Pagination is cursor-based via /admin/audit?cursor=…&limit=50.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { AuditListResponse } from "@/shared/api/admin";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { ResponsiveTable } from "@/shared/components/ui/ResponsiveTable";

const PAGE_SIZE = 50;
const TARGET_KINDS = ["", "user", "deck", "story"] as const;

export function AdminAuditPage() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const [targetKind, setTargetKind] = useState<string>("");
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const currentCursor = cursorStack[cursorStack.length - 1] ?? null;
  const pageIndex = cursorStack.length - 1;

  useEffect(() => {
    setCursorStack([null]);
  }, [targetKind]);

  const result = useQuery<AuditListResponse>({
    queryKey: ["admin", "audit", { cursor: currentCursor, kind: targetKind }],
    queryFn: () =>
      admin.listAudit({
        limit: PAGE_SIZE,
        cursor: currentCursor ?? undefined,
        target_kind: targetKind || undefined,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const rows = result.data?.items ?? [];
  const nextCursor = result.data?.nextCursor ?? null;

  return (
    <div className="space-y-4 p-6">
      <header>
        <h1 className="text-xl font-bold text-text-primary">
          {t("admin.audit.title", "Audit log")}
        </h1>
        <p className="text-sm text-text-muted">
          {t(
            "admin.audit.subtitle",
            "Append-only history of admin actions — bans, XP grants, content status changes.",
          )}
        </p>
      </header>

      <Card padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase text-text-muted">
            {t("admin.audit.filter", "Target kind")}
          </label>
          <select
            value={targetKind}
            onChange={(e) => setTargetKind(e.target.value)}
            className={cn("py-1 text-sm", inputClassName)}
            aria-label={t("admin.audit.filter", "Target kind")}
          >
            {TARGET_KINDS.map((k) => (
              <option key={k || "all"} value={k}>
                {k || t("admin.audit.allKinds", "All")}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-text-muted">
            {t("admin.audit.pageX", "Page {{n}}", { n: pageIndex + 1 })}
          </span>
        </div>
      </Card>

      <ResponsiveTable className="rounded-card border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-3 py-2">{t("admin.audit.when", "When")}</th>
              <th className="px-3 py-2">{t("admin.audit.action", "Action")}</th>
              <th className="px-3 py-2">{t("admin.audit.actor", "Actor")}</th>
              <th className="px-3 py-2">{t("admin.audit.target", "Target")}</th>
              <th className="px-3 py-2">{t("admin.audit.payload", "Payload")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((entry) => (
              <tr key={entry.id} className="hover:bg-surface-muted">
                <td className="px-3 py-2 text-xs text-text-secondary">
                  {new Date(entry.at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <Badge size="sm" variant={badgeForAction(entry.action)}>
                    {entry.action}
                  </Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                  {entry.actor_id.slice(0, 8) || "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                  {entry.target_kind}/{entry.target_id?.slice(0, 8) ?? "—"}
                </td>
                <td className="max-w-md truncate px-3 py-2 font-mono text-[11px] text-text-muted">
                  {Object.keys(entry.payload).length > 0
                    ? JSON.stringify(entry.payload)
                    : "—"}
                </td>
              </tr>
            ))}
            {!result.isFetching && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-text-muted">
                  {t("admin.audit.empty", "No audit entries.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ResponsiveTable>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pageIndex === 0 || result.isFetching}
          onClick={() => setCursorStack((s) => s.slice(0, -1))}
        >
          {t("common.previous", "Previous")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!nextCursor || result.isFetching}
          onClick={() => nextCursor && setCursorStack((s) => [...s, nextCursor])}
        >
          {t("common.next", "Next")}
        </Button>
      </div>
    </div>
  );
}

function badgeForAction(action: string): "error" | "warning" | "success" | "info" | "neutral" {
  if (action.startsWith("ban_")) return "error";
  if (action.startsWith("unban_")) return "success";
  if (action.startsWith("award_")) return "info";
  if (action.endsWith("_published")) return "success";
  if (action.endsWith("_draft")) return "warning";
  return "neutral";
}

export default AdminAuditPage;
