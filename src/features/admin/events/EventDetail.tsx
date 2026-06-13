import type { EventRow } from "./types";

type Props = { event: EventRow | null };

export function EventDetail({ event }: Props) {
  if (!event) {
    return (
      <div className="p-6 text-sm text-text-muted">
        Select an event to inspect its payload and outcomes.
      </div>
    );
  }
  return (
    <div className="p-6 space-y-4 overflow-auto">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{event.eventType}</h2>
        <span className="font-mono text-xs">{event.status}</span>
      </header>
      <dl className="text-sm grid grid-cols-[8rem_1fr] gap-y-1">
        <dt className="text-text-muted">id</dt>
        <dd className="font-mono break-all">{event.id}</dd>
        <dt className="text-text-muted">user</dt>
        <dd className="font-mono break-all">{event.userId}</dd>
        <dt className="text-text-muted">received</dt>
        <dd className="font-mono">{event.receivedAt}</dd>
        {event.errorMsg && (
          <>
            <dt className="text-text-muted">error</dt>
            <dd className="font-mono text-error whitespace-pre-wrap">{event.errorMsg}</dd>
          </>
        )}
      </dl>
      <section>
        <h3 className="text-sm font-semibold mb-1">Payload</h3>
        <pre className="bg-surface-muted text-text-primary font-mono text-xs p-3 rounded border border-border overflow-auto">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </section>
      <section>
        <h3 className="text-sm font-semibold mb-1">Outcomes</h3>
        <pre className="bg-surface-muted text-text-primary font-mono text-xs p-3 rounded border border-border overflow-auto">
          {JSON.stringify(event.outcomes, null, 2)}
        </pre>
      </section>
    </div>
  );
}
