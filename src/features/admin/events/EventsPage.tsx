import { useMemo, useState } from "react";
import { useEventDetail, useEventList } from "./useEvents";
import { EventRowItem } from "./EventRow";
import { EventDetail } from "./EventDetail";
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

export default function EventsPage() {
  const [filters, setFilters] = useState<EventFilters>({ limit: 100 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQ = useEventList(filters);
  const detailQ = useEventDetail(selectedId);

  const items = useMemo(() => listQ.data?.items ?? [], [listQ.data]);

  return (
    <div className="grid grid-cols-[2fr_1fr] h-[calc(100vh-4rem)]">
      <div className="flex flex-col border-r border-gray-200 dark:border-gray-800">
        <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-800 text-sm">
          <select
            value={filters.eventType ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, eventType: e.target.value || undefined }))
            }
            className="px-2 py-1 border rounded"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t || "(any type)"}
              </option>
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
              <option key={s} value={s}>
                {s || "(any status)"}
              </option>
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
          <span className="ml-auto text-xs text-gray-500 self-center">
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
            <div className="p-3 text-sm text-gray-500">
              No events. Complete a lesson and they should appear within ~3s.
            </div>
          )}
        </div>
      </div>
      <EventDetail event={detailQ.data ?? null} />
    </div>
  );
}
