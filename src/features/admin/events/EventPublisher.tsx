import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";

/**
 * Admin synthetic event publisher.
 *
 * Drops a kombu envelope onto the same broker the real producers use —
 * lingo-async picks it up like any other event. Quests advance, the
 * leaderboard updates, the event lands in the inspector below.
 *
 * Useful for: faking lesson completions for a different user_id (so the
 * leaderboard has competitors), QA-ing quest evaluation rules without
 * driving the lesson UI, repro-ing a real event from /admin/events by
 * tweaking the JSON.
 */

const TEMPLATES: Record<string, Record<string, unknown>> = {
  xp_awarded: {
    amount: 25,
    source: "lesson",
    learning_language_id: "ja",
    leaderboard_opt_in: true,
  },
  lesson_completed: {
    lesson_id: "m3-l1",
    score: 1.0,
    perfect: true,
    attempted_at: "2026-05-31T00:00:00Z",
  },
  review_completed: {
    card_id: "synth-1",
    modality: "recognition",
    rating: "good",
    count: 5,
  },
  friend_added: {
    friend_id: "00000000-0000-0000-0000-000000000000",
  },
  subscription_changed: {
    tier: "supporter",
    event: "new",
  },
};

const EVENT_TYPES = Object.keys(TEMPLATES);

export function EventPublisher() {
  const { ops } = useApi();
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [eventType, setEventType] = useState<string>("xp_awarded");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(TEMPLATES.xp_awarded, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(payloadText);
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
      }
      return ops.publishEvent({ userId, eventType, payload });
    },
    onSuccess: () => {
      setError(null);
      // Inspector list lives behind the same query key — refetch so the
      // new row shows up immediately.
      qc.invalidateQueries({ queryKey: ["ops", "events", "list"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });

  const handleTypeChange = (next: string) => {
    setEventType(next);
    setPayloadText(JSON.stringify(TEMPLATES[next] ?? {}, null, 2));
  };

  return (
    <section className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 text-sm bg-gray-50 dark:bg-gray-900/40">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">Publish synthetic event</h3>
        <span className="text-xs text-gray-500">
          Fakes a producer call. Quests + leaderboard react as if real.
        </span>
      </header>
      <div className="grid grid-cols-[10rem_1fr] gap-3 items-center">
        <label htmlFor="evtype" className="text-xs text-gray-500">event_type</label>
        <select
          id="evtype"
          value={eventType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="px-2 py-1 border rounded"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label htmlFor="evuser" className="text-xs text-gray-500">user_id</label>
        <input
          id="evuser"
          type="text"
          value={userId}
          placeholder="paste a user UUID (or your own from the inspector)"
          onChange={(e) => setUserId(e.target.value)}
          className="px-2 py-1 border rounded font-mono text-xs"
        />

        <label htmlFor="evpayload" className="text-xs text-gray-500 self-start mt-1">
          payload JSON
        </label>
        <textarea
          id="evpayload"
          rows={8}
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          className="px-2 py-1 border rounded font-mono text-xs"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!userId || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Publishing…" : "Publish event"}
        </button>
        {mutation.isSuccess && (
          <span className="text-xs text-green-700 dark:text-green-400">
            Published. Event should appear in the inspector within ~3s.
          </span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </section>
  );
}
