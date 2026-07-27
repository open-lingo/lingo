import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEventDetail, useEventList } from "./useEvents";
import { EventRowItem } from "./EventRow";
import { EventDetail } from "./EventDetail";
import { EventPublisher } from "./EventPublisher";
import { TabList, TabButton } from "@/shared/components/ui/Tabs";
import type { EventFilters, EventRow } from "./types";

const EVENT_TYPES = [
  "",
  "xp_awarded",
  "lesson_completed",
  "review_completed",
  "friend_added",
  "subscription_changed",
];
const STATUSES = ["", "received", "ok", "failed"];

type TabId = "inspector" | "publish";

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "inspector") as TabId;

  const setTab = (tab: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const [filters, setFilters] = useState<EventFilters>({ limit: 100 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQ = useEventList(filters);
  const detailQ = useEventDetail(selectedId);

  const items = useMemo(() => listQ.data?.items ?? [], [listQ.data]);

  return (
    <div className="flex flex-col h-[calc(100svh-4rem)]">
      {/* Tab bar */}
      <div className="border-b border-border px-0">
        <TabList aria-label="Events sections">
          <TabButton
            isActive={activeTab === "inspector"}
            onClick={() => setTab("inspector")}
          >
            Inspector
          </TabButton>
          <TabButton
            isActive={activeTab === "publish"}
            onClick={() => setTab("publish")}
          >
            Publish
          </TabButton>
        </TabList>
      </div>

      {/* Tab panels */}
      {activeTab === "inspector" && (
        <div className="flex-1 grid grid-cols-[2fr_1fr] min-h-0">
          {/* List + filters */}
          <div className="flex flex-col border-r border-border">
            <div className="flex gap-2 p-3 border-b border-border text-sm flex-wrap">
              <select
                value={filters.eventType ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, eventType: e.target.value || undefined }))
                }
                className="px-2 py-1 border rounded"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t || "(any type)"}</option>
                ))}
              </select>
              <select
                value={filters.status ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: (e.target.value || undefined) as EventRow["status"] | undefined,
                  }))
                }
                className="px-2 py-1 border rounded"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s || "(any status)"}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="user id"
                value={filters.userId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userId: e.target.value || undefined }))
                }
                className="px-2 py-1 border rounded flex-1 font-mono text-xs"
              />
              <span className="ml-auto text-xs text-text-muted self-center">
                {listQ.data?.total ?? 0} events
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {items.map((e) => (
                <EventRowItem
                  key={e.id}
                  event={e}
                  selected={selectedId === e.id}
                  onSelect={() => setSelectedId(e.id)}
                />
              ))}
              {listQ.isLoading && <div className="p-3 text-sm">Loading…</div>}
              {!listQ.isLoading && items.length === 0 && (
                <div className="p-3 text-sm text-text-muted">
                  No events. Complete a lesson and they should appear within ~3s.
                </div>
              )}
            </div>
          </div>
          {/* Detail pane */}
          <div className="flex-1 overflow-auto min-h-0">
            <EventDetail event={detailQ.data ?? null} />
          </div>
        </div>
      )}

      {activeTab === "publish" && (
        <div className="flex-1 overflow-auto p-6 max-w-2xl">
          <EventPublisher />
        </div>
      )}
    </div>
  );
}
