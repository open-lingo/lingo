import type { EventRow } from "./types";

type Props = {
  event: EventRow;
  selected: boolean;
  onSelect: () => void;
};

function summarize(event: EventRow): string {
  const parts: string[] = [];
  for (const o of event.outcomes ?? []) {
    if (o.handler === "quest_eval") {
      const n = o.actions.length;
      if (n > 0) parts.push(`advanced ${n} quest${n === 1 ? "" : "s"}`);
    }
    if (o.handler === "leaderboard") {
      const n = o.actions.length;
      if (n > 0) parts.push(`leaderboard ×${n}`);
    }
  }
  return parts.length ? "→ " + parts.join(", ") : "—";
}

export function EventRowItem({ event, selected, onSelect }: Props) {
  const time = new Date(event.receivedAt).toLocaleTimeString();
  const statusColor =
    event.status === "ok"
      ? "text-green-600"
      : event.status === "failed"
        ? "text-red-600"
        : "text-gray-500";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full grid grid-cols-[8ch_1fr_1fr_8ch_1fr] gap-3 px-3 py-2 text-left text-sm border-b border-gray-200 dark:border-gray-800",
        selected
          ? "bg-blue-50 dark:bg-blue-900/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-900",
      ].join(" ")}
    >
      <span className="font-mono text-xs text-gray-500">{time}</span>
      <span className="font-semibold">{event.eventType}</span>
      <span className="font-mono text-xs truncate" title={event.userId}>
        {event.userId}
      </span>
      <span className={`text-xs font-mono ${statusColor}`}>{event.status}</span>
      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{summarize(event)}</span>
    </button>
  );
}
