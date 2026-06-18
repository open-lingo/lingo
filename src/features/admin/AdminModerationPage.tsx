/**
 * AdminModerationPage — content + user moderation at /admin/moderation.
 *
 * Tabs:
 *   - Pending decks — draft-status decks awaiting approval/rejection
 *   - Pending stories — same flow for stories
 *   - Reported content — placeholder (no backend yet)
 *   - Banned users — list of users with community_status="banned" + unban
 *   - Ban a user — manual ban form (pick user, reason, duration)
 *
 * Each pending row supports approve (→ published) or reject (→ draft +
 * note). The banned-users tab calls /admin/users/{id}/unban.
 */
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useApi } from "@/shared/api/provider";
import type {
  BanDuration,
  BanKind,
  UserListItem,
} from "@/shared/api/admin";
import type { DeckResponse } from "@/shared/api/decks";
import type { StoryResponse } from "@/shared/api/stories";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { TabButton, TabList } from "@/shared/components/ui/Tabs";
import { useToast } from "@/shared/contexts/ToastContext";
import { Icon } from "@/shared/components/Icon";

type TabId =
  | "pending-decks"
  | "pending-stories"
  | "reports"
  | "banned"
  | "ban-user";

export function AdminModerationPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("pending-decks");

  const tabs: { id: TabId; label: string }[] = useMemo(
    () => [
      { id: "pending-decks", label: t("admin.moderation.pendingDecks", "Pending decks") },
      { id: "pending-stories", label: t("admin.moderation.pendingStories", "Pending stories") },
      { id: "reports", label: t("admin.moderation.reports", "Reported content") },
      { id: "banned", label: t("admin.moderation.banned", "Banned users") },
      { id: "ban-user", label: t("admin.moderation.banUser", "Ban a user") },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <TabList>
        {tabs.map((x) => (
          <TabButton key={x.id} isActive={tab === x.id} onClick={() => setTab(x.id)}>
            {x.label}
          </TabButton>
        ))}
      </TabList>
      <div>
        {tab === "pending-decks" && <PendingDecksTab />}
        {tab === "pending-stories" && <PendingStoriesTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "banned" && <BannedUsersTab />}
        {tab === "ban-user" && <BanUserTab />}
      </div>
    </div>
  );
}

// ── Pending decks ───────────────────────────────────────────────

function PendingDecksTab() {
  const { t } = useTranslation();
  const { decks, admin } = useApi();
  const showToast = useToast().showToast;
  const [rows, setRows] = useState<DeckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    decks
      .listAdminDecks({ status: "draft" })
      .then((items) => setRows(items.filter((d) => !d.id.startsWith("vocab-"))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string) => {
    setActingId(id);
    try {
      await admin.updateDeckStatus(id, "published");
      showToast(t("admin.moderation.approved", "Approved"), "success");
      load();
    } catch {
      showToast(t("admin.moderation.actionFailed", "Action failed"), "error");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: string) => {
    setActingId(id);
    try {
      // "Reject" semantics: keep it at draft and unpublish if it was published.
      // (Draft items are already "rejected" until approved; this re-asserts.)
      await admin.updateDeckStatus(id, "draft");
      showToast(t("admin.moderation.rejected", "Returned to draft"), "success");
      load();
    } catch {
      showToast(t("admin.moderation.actionFailed", "Action failed"), "error");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">{t("common.loading")}</p>;
  if (rows.length === 0) {
    return (
      <Card padding="lg">
        <p className="text-sm text-text-muted">
          {t("admin.moderation.noPendingDecks", "No pending decks.")}
        </p>
      </Card>
    );
  }

  return (
    <ModerationTable
      head={[
        t("admin.deckName", "Deck"),
        t("admin.author", "Author"),
        t("admin.language", "Language"),
        t("admin.moderation.submittedAt", "Submitted"),
        "",
      ]}
      rows={rows.map((d) => ({
        key: d.id,
        cells: [
          <span key="n" className="font-medium text-text-primary">{d.name}</span>,
          <span key="a" className="font-mono text-xs text-text-secondary">{d.authorId ?? "—"}</span>,
          <span key="l" className="text-text-secondary">{d.languageId}</span>,
          <span key="t" className="text-text-secondary">{d.updatedAt ?? "—"}</span>,
          <div key="x" className="flex justify-end gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={actingId === d.id}
              onClick={() => approve(d.id)}
            >
              {actingId === d.id ? t("common.loading") : t("admin.moderation.approve", "Approve")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actingId === d.id}
              onClick={() => reject(d.id)}
            >
              {t("admin.moderation.reject", "Reject")}
            </Button>
          </div>,
        ],
      }))}
    />
  );
}

// ── Pending stories ─────────────────────────────────────────────

function PendingStoriesTab() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const showToast = useToast().showToast;
  const [rows, setRows] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    admin
      .listStories({ status: "draft" })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string) => {
    setActingId(id);
    try {
      await admin.updateStoryStatus(id, "published");
      showToast(t("admin.moderation.approved", "Approved"), "success");
      load();
    } catch {
      showToast(t("admin.moderation.actionFailed", "Action failed"), "error");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: string) => {
    setActingId(id);
    try {
      await admin.updateStoryStatus(id, "draft");
      showToast(t("admin.moderation.rejected", "Returned to draft"), "success");
      load();
    } catch {
      showToast(t("admin.moderation.actionFailed", "Action failed"), "error");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">{t("common.loading")}</p>;
  if (rows.length === 0) {
    return (
      <Card padding="lg">
        <p className="text-sm text-text-muted">
          {t("admin.moderation.noPendingStories", "No pending stories.")}
        </p>
      </Card>
    );
  }

  return (
    <ModerationTable
      head={[
        t("admin.storyTitle", "Story"),
        t("admin.author", "Author"),
        t("admin.language", "Language"),
        t("admin.moderation.submittedAt", "Submitted"),
        "",
      ]}
      rows={rows.map((s) => ({
        key: s.id,
        cells: [
          <span key="n" className="font-medium text-text-primary">{s.title}</span>,
          <span key="a" className="font-mono text-xs text-text-secondary">{s.authorId ?? "—"}</span>,
          <span key="l" className="text-text-secondary">{s.languageId}</span>,
          <span key="t" className="text-text-secondary">{s.updatedAt ?? "—"}</span>,
          <div key="x" className="flex justify-end gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={actingId === s.id}
              onClick={() => approve(s.id)}
            >
              {actingId === s.id ? t("common.loading") : t("admin.moderation.approve", "Approve")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actingId === s.id}
              onClick={() => reject(s.id)}
            >
              {t("admin.moderation.reject", "Reject")}
            </Button>
          </div>,
        ],
      }))}
    />
  );
}

// ── Reported content (placeholder) ──────────────────────────────

function ReportsTab() {
  const { t } = useTranslation();
  return (
    <Card padding="lg" className="text-center">
      <p className="text-sm font-medium text-text-primary">
        {t("admin.moderation.reportsTitle", "No reports yet")}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {t(
          "admin.moderation.reportsDesc",
          "When users flag content it'll appear here.",
        )}
      </p>
    </Card>
  );
}

// ── Banned users ────────────────────────────────────────────────

function BannedUsersTab() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const showToast = useToast().showToast;
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"community" | "account" | "both">("both");

  const load = async () => {
    setLoading(true);
    try {
      const [comm, acct] = await Promise.all([
        admin.listUsers({ limit: 100, community_status: "banned" }),
        admin.listUsers({ limit: 100, status: "banned" }),
      ]);
      // Merge unique by id.
      const map = new Map<string, UserListItem>();
      for (const u of [...comm.items, ...acct.items]) map.set(u.id, u);
      setUsers([...map.values()]);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === "both") return users;
    if (filter === "community") return users.filter((u) => u.community_status === "banned");
    return users.filter((u) => u.status === "banned");
  }, [users, filter]);

  const unban = async (userId: string, type: BanKind) => {
    setActing(`${userId}-${type}`);
    try {
      await admin.unbanUser(userId, { type });
      showToast(t("admin.moderation.unbanned", "Unbanned"), "success");
      load();
    } catch {
      showToast(t("admin.moderation.actionFailed", "Action failed"), "error");
    } finally {
      setActing(null);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">{t("common.loading")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-text-muted">
          {t("admin.moderation.filter", "Filter")}
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className={cn("py-1 text-sm", inputClassName)}
        >
          <option value="both">{t("admin.moderation.bothTypes", "All bans")}</option>
          <option value="community">{t("admin.moderation.communityOnly", "Community only")}</option>
          <option value="account">{t("admin.moderation.accountOnly", "Account only")}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card padding="lg">
          <p className="text-sm text-text-muted">
            {t("admin.moderation.noBanned", "No banned users right now.")}
          </p>
        </Card>
      ) : (
        <ModerationTable
          head={[
            t("admin.username", "Username"),
            t("admin.moderation.lastBan", "Last ban"),
            t("admin.moderation.expires", "Expires"),
            t("admin.moderation.types", "Type"),
            "",
          ]}
          rows={filtered.map((u) => {
            const lastAccount = (u.account_ban_history ?? []).slice(-1)[0];
            const lastCommunity = (u.community_ban_history ?? []).slice(-1)[0];
            const last = lastAccount ?? lastCommunity;
            const types: BanKind[] = [];
            if (u.status === "banned") types.push("account");
            if (u.community_status === "banned") types.push("community");
            return {
              key: u.id,
              cells: [
                <Link key="u" to={`/admin/users/${u.id}`} className="font-medium text-accent hover:underline">
                  @{u.username}
                </Link>,
                <span key="r" className="text-text-secondary" title={last?.notes ?? undefined}>
                  {last?.reason ?? "—"}
                </span>,
                <span key="x" className="text-text-secondary">
                  {(u.status_expiration ?? u.community_status_expiration) ?? t("admin.moderation.permanent", "Permanent")}
                </span>,
                <span key="t" className="flex gap-1">
                  {types.map((k) => (
                    <Badge key={k} size="sm" variant={k === "account" ? "error" : "warning"}>
                      {k}
                    </Badge>
                  ))}
                </span>,
                <div key="a" className="flex justify-end gap-1">
                  {types.map((k) => (
                    <Button
                      key={k}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={acting === `${u.id}-${k}`}
                      onClick={() => unban(u.id, k)}
                    >
                      {acting === `${u.id}-${k}`
                        ? t("common.loading")
                        : t("admin.moderation.unbanWithType", "Unban {{type}}", { type: k })}
                    </Button>
                  ))}
                </div>,
              ],
            };
          })}
        />
      )}
    </div>
  );
}

// ── Manual ban form ─────────────────────────────────────────────

function BanUserTab() {
  const { t } = useTranslation();
  const { admin } = useApi();
  const showToast = useToast().showToast;
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<UserListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const [type, setType] = useState<BanKind>("community");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState<BanDuration>("7d");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Debounce the local search box and fan out to /admin/users.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setCandidates([]);
      setSelected(null);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const r = await admin.listUsers({ search: query.trim(), limit: 8 });
        setCandidates(r.items);
      } catch {
        setCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, admin]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await admin.banUser(selected.id, {
        type,
        reason: reason.trim(),
        duration,
        notes: notes.trim() || undefined,
      });
      showToast(t("admin.moderation.bannedSuccess", "User banned"), "success");
      setReason("");
      setNotes("");
      setSelected(null);
      setCandidates([]);
      setQuery("");
    } catch (err) {
      const status = err && typeof err === "object" && "status" in err
        ? Number((err as { status?: number }).status)
        : 0;
      if (status === 403) {
        showToast(t("admin.moderation.cannotBanSelf", "Cannot ban yourself"), "error");
      } else {
        showToast(t("admin.moderation.actionFailed", "Action failed"), "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("admin.moderation.pickUser", "1. Pick a user")}
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          {t(
            "admin.moderation.pickUserHint",
            "Type a username substring to find a user.",
          )}
        </p>
        <div className="relative mt-3">
          <Icon
            name="search"
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.searchUsers", "Search users…")}
            aria-label={t("admin.searchUsers", "Search users…")}
            className={cn(inputClassName, "pl-8")}
          />
        </div>
        <div className="mt-3 space-y-2">
          {searching ? (
            <p className="text-sm text-text-muted">{t("common.loading")}</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-text-muted">
              {query
                ? t("admin.moderation.noMatches", "No matches.")
                : t("admin.moderation.startTyping", "Start typing to search.")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.map((u) => {
                const isSelected = selected?.id === u.id;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(u)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-accent-muted text-accent"
                          : "hover:bg-surface-muted",
                      )}
                    >
                      <span>
                        <span className="font-medium">@{u.username}</span>
                        <span className="ml-2 text-xs text-text-muted">{u.display_name}</span>
                      </span>
                      {u.community_status === "banned" ? (
                        <Badge size="sm" variant="warning">community-banned</Badge>
                      ) : u.status === "banned" ? (
                        <Badge size="sm" variant="error">banned</Badge>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("admin.moderation.banDetails", "2. Ban details")}
        </h3>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div>
            <label className="block text-xs uppercase text-text-muted">
              {t("admin.moderation.banType", "Type")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BanKind)}
              className={cn("mt-1 w-full", inputClassName)}
              disabled={submitting}
            >
              <option value="community">{t("admin.moderation.communityBan", "Community ban")}</option>
              <option value="account">{t("admin.moderation.accountBan", "Account ban")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-text-muted">
              {t("admin.moderation.banDuration", "Duration")}
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as BanDuration)}
              className={cn("mt-1 w-full", inputClassName)}
              disabled={submitting}
            >
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="permanent">{t("admin.moderation.permanent", "Permanent")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-text-muted">
              {t("admin.moderation.banReason", "Reason")}
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              maxLength={500}
              disabled={submitting}
              className={cn("mt-1 w-full", inputClassName)}
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-text-muted">
              {t("admin.moderation.banNotes", "Internal notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
              disabled={submitting}
              className={cn("mt-1 w-full", inputClassName)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {selected ? (
                <>{t("admin.moderation.targetingUser", "Target:")}{" "}
                <span className="font-medium text-text-primary">@{selected.username}</span></>
              ) : (
                t("admin.moderation.noTarget", "No user selected.")
              )}
            </p>
            <Button
              type="submit"
              variant="danger"
              disabled={!selected || !reason.trim() || submitting}
            >
              {submitting ? t("common.loading") : t("admin.moderation.banSubmit", "Ban user")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ── Shared table primitive ──────────────────────────────────────

function ModerationTable({
  head,
  rows,
}: {
  head: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={cn("px-3 py-2", i === head.length - 1 && "text-right")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-surface-muted">
              {row.cells.map((cell, i) => (
                <td key={i} className={cn("px-3 py-2", i === row.cells.length - 1 && "text-right")}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminModerationPage;
